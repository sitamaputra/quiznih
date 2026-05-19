// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable}      from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable}    from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard}    from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA}              from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils}   from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title QuizEscrow
/// @author Quiznih Team
/// @notice Upgradeable (UUPS) escrow contract for Quiznih quiz reward pools on Celo.
///         Host deposits CELO once. After quiz ends, backend signs each winner's claim.
///         Winners call claimReward() independently — no host action needed post-deposit.
/// @dev Uses OpenZeppelin v5 upgradeable contracts + ECDSA signature verification.
///      Deploy via ERC1967Proxy. Call initialize() on first deploy.
contract QuizEscrow is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuard
{

    // ─── Types ──────────────────────────────────────────────

    struct Quiz {
        address host;       // slot A: 20 bytes ┐
        bool isActive;      // slot A:  1 byte  ├─ packed → 1 SLOAD reads all three
        bool isFinalized;   // slot A:  1 byte  ┘ quiz ended, winners can claim
        uint256 rewardPool; // slot B: 32 bytes
        string roomCode;    // slot C+: dynamic
    }

    // ─── Constants ──────────────────────────────────────────

    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant CLAIM_EXPIRY = 30 days;

    // ─── Storage ────────────────────────────────────────────
    // NOTE: ReentrancyGuard (non-upgradeable) stores `_status` at slot 0.
    // Our variables start at slot 1. Keep this in mind when upgrading.

    uint256[] public rewardDistribution;                                        // slot 1
    mapping(bytes32 quizId => Quiz) public quizzes;                            // slot 2
    address public trustedSigner;                                               // slot 3
    mapping(bytes32 quizId => mapping(address winner => bool)) public claimed; // slot 4
    mapping(bytes32 quizId => uint256 deadline) public claimDeadline;          // slot 5

    // ─── Events ─────────────────────────────────────────────

    event QuizCreated(bytes32 indexed quizId, address indexed host, string roomCode);
    event RewardDeposited(bytes32 indexed quizId, address indexed host, uint256 amount);
    event QuizFinalized(bytes32 indexed quizId, uint256 deadline);
    event RewardClaimed(bytes32 indexed quizId, address indexed winner, uint256 amount);
    event QuizCancelled(bytes32 indexed quizId, address indexed host, uint256 refundAmount);
    event ExpiredFundsReclaimed(bytes32 indexed quizId, address indexed host, uint256 amount);
    event SignerUpdated(address indexed newSigner);
    event RewardDistributionUpdated(uint256[] newDistribution);

    // ─── Errors ─────────────────────────────────────────────

    error QuizAlreadyExists(bytes32 quizId);
    error QuizNotFound(bytes32 quizId);
    error ZeroDeposit();
    error QuizNotActive(bytes32 quizId);
    error QuizNotFinalized(bytes32 quizId);
    error QuizAlreadyFinalized(bytes32 quizId);
    error AlreadyClaimed(bytes32 quizId, address winner);
    error InvalidSignature();
    error InvalidSigner();
    error InsufficientPool(uint256 available, uint256 requested);
    error ClaimExpired(bytes32 quizId);
    error ClaimNotExpired(bytes32 quizId);
    error TransferFailed(address recipient, uint256 amount);
    error InvalidDistribution(uint256 total, uint256 required);

    // ─── Modifiers ──────────────────────────────────────────

    modifier onlyHost(bytes32 quizId) {
        if (quizzes[quizId].host != msg.sender) revert QuizNotFound(quizId);
        _;
    }

    // ─── Constructor & Initializer ───────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialises the proxy. Called once by the deploy script via ERC1967Proxy.
    /// @param initialOwner   Address that will own (and be able to upgrade) the contract
    /// @param _trustedSigner Backend wallet address whose signatures authorize winner claims
    function initialize(address initialOwner, address _trustedSigner) external initializer {
        __Ownable_init(initialOwner);

        if (_trustedSigner == address(0)) revert InvalidSigner();
        trustedSigner = _trustedSigner;

        rewardDistribution = new uint256[](3);
        rewardDistribution[0] = 5_000; // 50% → 1st place
        rewardDistribution[1] = 3_000; // 30% → 2nd place
        rewardDistribution[2] = 2_000; // 20% → 3rd place

        emit SignerUpdated(_trustedSigner);
        emit RewardDistributionUpdated(rewardDistribution);
    }

    // ─── Host Functions ──────────────────────────────────────

    /// @notice Create a quiz and deposit the CELO reward pool in one transaction.
    ///         After this, host has no further on-chain responsibility.
    /// @param quizId   Unique identifier — UUID from Supabase converted to bytes32
    /// @param roomCode Human-readable 6-character join code
    function createQuizAndDeposit(bytes32 quizId, string calldata roomCode) external payable {
        if (msg.value == 0) revert ZeroDeposit();
        if (quizzes[quizId].host != address(0)) revert QuizAlreadyExists(quizId);

        quizzes[quizId] = Quiz({
            host: msg.sender,
            isActive: true,
            isFinalized: false,
            rewardPool: msg.value,
            roomCode: roomCode
        });

        emit QuizCreated(quizId, msg.sender, roomCode);
        emit RewardDeposited(quizId, msg.sender, msg.value);
    }

    /// @notice Top up the reward pool of an existing active quiz.
    function addToRewardPool(bytes32 quizId) external payable onlyHost(quizId) {
        if (msg.value == 0) revert ZeroDeposit();
        Quiz storage quiz = quizzes[quizId];
        if (quiz.isFinalized) revert QuizAlreadyFinalized(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        quiz.rewardPool += msg.value;
        emit RewardDeposited(quizId, msg.sender, msg.value);
    }

    /// @notice Cancel a quiz and refund remaining pool to host.
    ///         Only callable before the quiz is finalized.
    function cancelQuiz(bytes32 quizId) external nonReentrant onlyHost(quizId) {
        Quiz storage quiz = quizzes[quizId];
        if (quiz.isFinalized) revert QuizAlreadyFinalized(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        uint256 refund   = quiz.rewardPool;
        address quizHost = quiz.host;
        quiz.rewardPool  = 0;
        quiz.isActive    = false;

        (bool sent,) = payable(quizHost).call{value: refund}("");
        if (!sent) revert TransferFailed(quizHost, refund);

        emit QuizCancelled(quizId, msg.sender, refund);
    }

    /// @notice After CLAIM_EXPIRY has passed, host can reclaim any unclaimed funds.
    function reclaimExpiredFunds(bytes32 quizId) external nonReentrant onlyHost(quizId) {
        Quiz storage quiz = quizzes[quizId];
        if (!quiz.isFinalized) revert QuizNotFinalized(quizId);
        if (block.timestamp < claimDeadline[quizId]) revert ClaimNotExpired(quizId);

        uint256 amount   = quiz.rewardPool;
        address quizHost = quiz.host;
        quiz.rewardPool  = 0;

        (bool sent,) = payable(quizHost).call{value: amount}("");
        if (!sent) revert TransferFailed(quizHost, amount);

        emit ExpiredFundsReclaimed(quizId, quizHost, amount);
    }

    // ─── Backend Signer Functions ────────────────────────────

    /// @notice Finalize a quiz so winners can start claiming.
    ///         Only callable by the trusted backend signer.
    /// @param quizId The quiz to finalize
    function finalizeQuiz(bytes32 quizId) external {
        if (msg.sender != trustedSigner) revert InvalidSigner();
        Quiz storage quiz = quizzes[quizId];
        if (quiz.host == address(0)) revert QuizNotFound(quizId);
        if (quiz.isFinalized) revert QuizAlreadyFinalized(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        quiz.isFinalized = true;
        quiz.isActive    = false;
        claimDeadline[quizId] = block.timestamp + CLAIM_EXPIRY;

        emit QuizFinalized(quizId, claimDeadline[quizId]);
    }

    // ─── Winner Functions ────────────────────────────────────

    /// @notice Claim reward with a backend-signed authorization.
    ///         Winner calls this themselves — no host involvement needed.
    /// @dev Signature: keccak256(abi.encodePacked(chainid, quizId, winner, amount, address(this)))
    ///      signed with Ethereum prefix by trustedSigner.
    /// @param quizId    The quiz identifier
    /// @param amount    Reward amount in wei (included in signature — tamper-proof)
    /// @param signature ECDSA signature from the trusted backend signer
    function claimReward(
        bytes32 quizId,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        if (claimed[quizId][msg.sender]) revert AlreadyClaimed(quizId, msg.sender);

        Quiz storage quiz = quizzes[quizId];
        if (quiz.host == address(0)) revert QuizNotFound(quizId);
        if (!quiz.isFinalized) revert QuizNotFinalized(quizId);
        if (block.timestamp > claimDeadline[quizId]) revert ClaimExpired(quizId);
        if (quiz.rewardPool < amount) revert InsufficientPool(quiz.rewardPool, amount);

        // Verify backend signature — includes chainId + contract address to prevent replay attacks
        bytes32 msgHash = keccak256(abi.encodePacked(block.chainid, quizId, msg.sender, amount, address(this)));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        address recovered = ECDSA.recover(ethHash, signature);
        if (recovered != trustedSigner) revert InvalidSignature();

        // Effects (CEI — state before external call)
        claimed[quizId][msg.sender] = true;
        quiz.rewardPool -= amount;

        // Interaction
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed(msg.sender, amount);

        emit RewardClaimed(quizId, msg.sender, amount);
    }

    // ─── Admin Functions ─────────────────────────────────────

    /// @notice Update the trusted backend signer address.
    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidSigner();
        trustedSigner = _signer;
        emit SignerUpdated(_signer);
    }

    /// @notice Update reward split percentages. Must sum to BASIS_POINTS (10 000).
    function updateRewardDistribution(uint256[] calldata newDistribution) external onlyOwner {
        uint256 len   = newDistribution.length;
        uint256 total = 0;
        for (uint256 i = 0; i < len; ++i) total += newDistribution[i];
        if (total != BASIS_POINTS) revert InvalidDistribution(total, BASIS_POINTS);

        uint256 currentLen = rewardDistribution.length;
        for (uint256 i = 0; i < len; ++i) {
            if (i < currentLen) rewardDistribution[i] = newDistribution[i];
            else rewardDistribution.push(newDistribution[i]);
        }
        while (rewardDistribution.length > len) rewardDistribution.pop();

        emit RewardDistributionUpdated(newDistribution);
    }

    // ─── View Functions ──────────────────────────────────────

    function getQuizInfo(bytes32 quizId) external view returns (
        address host,
        uint256 rewardPool,
        bool isActive,
        bool isFinalized,
        string memory roomCode,
        uint256 deadline
    ) {
        Quiz storage quiz = quizzes[quizId];
        return (
            quiz.host,
            quiz.rewardPool,
            quiz.isActive,
            quiz.isFinalized,
            quiz.roomCode,
            claimDeadline[quizId]
        );
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function hasClaimed(bytes32 quizId, address winner) external view returns (bool) {
        return claimed[quizId][winner];
    }

    // ─── UUPS Internal ───────────────────────────────────────

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
