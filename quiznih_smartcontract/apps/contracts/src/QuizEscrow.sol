// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable}      from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable}    from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard}    from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title QuizEscrow
/// @author Quiznih Team
/// @notice Upgradeable (UUPS) escrow contract for Quiznih quiz reward pools on Celo.
///         Hosts deposit CELO; top-3 winners receive 50/30/20% of the pool.
/// @dev Uses OpenZeppelin v5 upgradeable contracts.
///      Deploy via ERC1967Proxy. Call initialize() on first deploy.
///      To upgrade: deploy new implementation → call upgradeToAndCall() through the proxy.
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
        bool isDistributed; // slot A:  1 byte  ┘
        uint256 rewardPool; // slot B: 32 bytes
        string roomCode;    // slot C+: dynamic
    }

    // ─── Constants ──────────────────────────────────────────

    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MAX_WINNERS  = 3;

    // ─── Storage ────────────────────────────────────────────
    // OZ upgradeable contracts use namespaced (ERC-7201) storage,
    // so they do NOT occupy these numbered slots.

    uint256[] public rewardDistribution; // slot 0
    mapping(bytes32 quizId => Quiz) public quizzes; // slot 1

    // ─── Events ─────────────────────────────────────────────

    event QuizCreated(bytes32 indexed quizId, address indexed host, string roomCode);
    event RewardDeposited(bytes32 indexed quizId, address indexed host, uint256 amount);
    event RewardDistributed(bytes32 indexed quizId, address indexed winner, uint256 amount, uint256 rank);
    event QuizCancelled(bytes32 indexed quizId, address indexed host, uint256 refundAmount);
    event RewardDistributionUpdated(uint256[] newDistribution);

    // ─── Errors ─────────────────────────────────────────────

    error QuizAlreadyExists(bytes32 quizId);
    error ZeroDeposit();
    error QuizNotActive(bytes32 quizId);
    error RewardsAlreadyDistributed(bytes32 quizId);
    error NotQuizHost(bytes32 quizId, address caller);
    error NoWinners();
    error TooManyWinners(uint256 provided, uint256 max);
    error TransferFailed(address recipient, uint256 amount);
    error InvalidDistribution(uint256 total, uint256 required);

    // ─── Modifiers ──────────────────────────────────────────

    modifier onlyHost(bytes32 quizId) {
        if (quizzes[quizId].host != msg.sender) revert NotQuizHost(quizId, msg.sender);
        _;
    }

    // ─── Constructor & Initializer ───────────────────────────

    /// @dev Disables direct initialisation of the implementation contract.
    ///      The proxy is the only intended entry-point.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialises the proxy. Called once by the deploy script via ERC1967Proxy.
    /// @param initialOwner Address that will own (and be able to upgrade) the contract
    function initialize(address initialOwner) external initializer {
        __Ownable_init(initialOwner);

        rewardDistribution = new uint256[](3);
        rewardDistribution[0] = 5_000; // 50% → 1st place
        rewardDistribution[1] = 3_000; // 30% → 2nd place
        rewardDistribution[2] = 2_000; // 20% → 3rd place
    }

    // ─── External Functions ─────────────────────────────────

    /// @notice Create a quiz and deposit the CELO reward pool in one transaction.
    /// @param quizId   Unique identifier — UUID from Supabase converted to bytes32
    /// @param roomCode Human-readable 6-character join code
    function createQuizAndDeposit(bytes32 quizId, string calldata roomCode) external payable {
        if (msg.value == 0) revert ZeroDeposit();
        if (quizzes[quizId].host != address(0)) revert QuizAlreadyExists(quizId);

        quizzes[quizId] = Quiz({
            host: msg.sender,
            isActive: true,
            isDistributed: false,
            rewardPool: msg.value,
            roomCode: roomCode
        });

        emit QuizCreated(quizId, msg.sender, roomCode);
        emit RewardDeposited(quizId, msg.sender, msg.value);
    }

    /// @notice Top up the reward pool of an existing active quiz.
    /// @param quizId The quiz to top up
    function addToRewardPool(bytes32 quizId) external payable onlyHost(quizId) {
        if (msg.value == 0) revert ZeroDeposit();

        Quiz storage quiz = quizzes[quizId];
        if (quiz.isDistributed) revert RewardsAlreadyDistributed(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        quiz.rewardPool += msg.value;

        emit RewardDeposited(quizId, msg.sender, msg.value);
    }

    /// @notice Distribute rewards to top winners. Only callable by the quiz host.
    /// @dev CEI pattern: state updated before external calls. nonReentrant as second layer.
    /// @param quizId  The quiz identifier
    /// @param winners Ordered winner addresses: index 0 = 1st, 1 = 2nd, 2 = 3rd
    function distributeRewards(
        bytes32 quizId,
        address payable[] calldata winners
    ) external nonReentrant onlyHost(quizId) {
        uint256 winnersLen = winners.length;
        if (winnersLen == 0) revert NoWinners();
        if (winnersLen > MAX_WINNERS) revert TooManyWinners(winnersLen, MAX_WINNERS);

        Quiz storage quiz = quizzes[quizId];
        if (quiz.isDistributed) revert RewardsAlreadyDistributed(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        // Effects — update state BEFORE external calls (CEI)
        uint256 totalPool = quiz.rewardPool;
        address quizHost  = quiz.host;
        quiz.rewardPool    = 0;
        quiz.isDistributed = true;
        quiz.isActive      = false;

        // Interactions — transfer to each winner
        uint256 totalSent = 0;
        for (uint256 i = 0; i < winnersLen; ++i) {
            uint256 amount = (totalPool * rewardDistribution[i]) / BASIS_POINTS;
            if (amount > 0) {
                (bool sent,) = winners[i].call{value: amount}("");
                if (!sent) revert TransferFailed(winners[i], amount);
                totalSent += amount;
                emit RewardDistributed(quizId, winners[i], amount, i + 1);
            }
        }

        // Dust remainder → back to host
        uint256 remainder = totalPool - totalSent;
        if (remainder > 0) {
            (bool sent,) = payable(quizHost).call{value: remainder}("");
            if (!sent) revert TransferFailed(quizHost, remainder);
        }
    }

    /// @notice Cancel a quiz and refund the full reward pool to the host.
    /// @param quizId The quiz to cancel
    function cancelQuiz(bytes32 quizId) external nonReentrant onlyHost(quizId) {
        Quiz storage quiz = quizzes[quizId];
        if (quiz.isDistributed) revert RewardsAlreadyDistributed(quizId);
        if (!quiz.isActive) revert QuizNotActive(quizId);

        // Effects first (CEI)
        uint256 refund   = quiz.rewardPool;
        address quizHost = quiz.host;
        quiz.rewardPool  = 0;
        quiz.isActive    = false;

        // Interaction
        (bool sent,) = payable(quizHost).call{value: refund}("");
        if (!sent) revert TransferFailed(quizHost, refund);

        emit QuizCancelled(quizId, msg.sender, refund);
    }

    /// @notice Update reward split percentages. Only callable by owner.
    /// @param newDistribution Array of basis-point values that must sum to 10 000
    function updateRewardDistribution(uint256[] calldata newDistribution) external onlyOwner {
        uint256 len   = newDistribution.length;
        uint256 total = 0;
        for (uint256 i = 0; i < len; ++i) {
            total += newDistribution[i];
        }
        if (total != BASIS_POINTS) revert InvalidDistribution(total, BASIS_POINTS);

        uint256 currentLen = rewardDistribution.length;
        for (uint256 i = 0; i < len; ++i) {
            if (i < currentLen) {
                rewardDistribution[i] = newDistribution[i];
            } else {
                rewardDistribution.push(newDistribution[i]);
            }
        }
        while (rewardDistribution.length > len) {
            rewardDistribution.pop();
        }

        emit RewardDistributionUpdated(newDistribution);
    }

    // ─── External View Functions ─────────────────────────────

    /// @notice Get full information about a quiz.
    /// @param quizId         The quiz identifier
    /// @return host          The quiz creator address
    /// @return rewardPool    Current reward pool balance in wei
    /// @return isActive      Whether the quiz is still active
    /// @return isDistributed Whether rewards have been distributed
    /// @return roomCode      Human-readable room code
    function getQuizInfo(bytes32 quizId) external view returns (
        address host,
        uint256 rewardPool,
        bool isActive,
        bool isDistributed,
        string memory roomCode
    ) {
        Quiz storage quiz = quizzes[quizId];
        return (quiz.host, quiz.rewardPool, quiz.isActive, quiz.isDistributed, quiz.roomCode);
    }

    /// @notice Get total CELO balance held by this contract.
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── UUPS Internal ───────────────────────────────────────

    /// @dev Only the owner can authorise an implementation upgrade.
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
