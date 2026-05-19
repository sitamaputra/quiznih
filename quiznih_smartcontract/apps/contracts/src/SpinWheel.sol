// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable}  from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA}           from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title SpinWheel
/// @author Quiznih Team
/// @notice Upgradeable escrow for spin wheel sessions on Celo.
///         Host deposits a prize pool. Backend signs each spin result.
///         Participants call claimSpin() with the signature — trustless payout.
/// @dev UUPS + ReentrancyGuardUpgradeable (ERC-7201 namespaced storage).
///      Slot layout starts at slot 0 — no hidden inherited slots.
contract SpinWheel is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuard
{
    // ─── Types ──────────────────────────────────────────────

    struct Session {
        address host;       // 20 bytes ┐
        bool isActive;      //  1 byte  ├─ packed in one slot
        bool isExpired;     //  1 byte  ┘
        uint256 prizePool;  // slot B
        uint256 expiresAt;  // slot C
    }

    // ─── Constants ──────────────────────────────────────────

    uint256 public constant SESSION_EXPIRY = 7 days;

    // ─── Storage ────────────────────────────────────────────
    // NOTE: ReentrancyGuard (non-upgradeable) stores `_status` at slot 0.
    // Our variables start at slot 1. Keep this in mind when upgrading.

    address public trustedSigner;                                                      // slot 1
    mapping(bytes32 sessionId => Session) public sessions;                             // slot 2
    mapping(bytes32 sessionId => mapping(address player => bool)) public hasClaimed;   // slot 3

    // ─── Events ─────────────────────────────────────────────

    event SessionCreated(bytes32 indexed sessionId, address indexed host, uint256 prizePool);
    event SpinClaimed(bytes32 indexed sessionId, address indexed winner, uint256 amount);
    event SessionClosed(bytes32 indexed sessionId, address indexed host, uint256 refund);
    event SignerUpdated(address indexed newSigner);

    // ─── Errors ─────────────────────────────────────────────

    error SessionAlreadyExists(bytes32 sessionId);
    error SessionNotFound(bytes32 sessionId);
    error SessionNotActive(bytes32 sessionId);
    error AlreadyClaimed(bytes32 sessionId, address player);
    error InsufficientPool(uint256 available, uint256 requested);
    error InvalidSignature();
    error InvalidSigner();
    error ClaimExpired(bytes32 sessionId);
    error SessionNotExpired(bytes32 sessionId);
    error TransferFailed(address recipient, uint256 amount);
    error ZeroDeposit();

    // ─── Constructor & Initializer ───────────────────────────

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @param initialOwner   Owner who can upgrade the contract
    /// @param _trustedSigner Backend wallet that signs spin results
    function initialize(address initialOwner, address _trustedSigner) external initializer {
        __Ownable_init(initialOwner);

        if (_trustedSigner == address(0)) revert InvalidSigner();
        trustedSigner = _trustedSigner;

        emit SignerUpdated(_trustedSigner);
    }

    // ─── Host Functions ──────────────────────────────────────

    /// @notice Open a spin wheel session and deposit the prize pool.
    /// @param sessionId Unique ID (UUID → bytes32) from Supabase
    function createSession(bytes32 sessionId) external payable {
        if (msg.value == 0) revert ZeroDeposit();
        if (sessions[sessionId].host != address(0)) revert SessionAlreadyExists(sessionId);

        sessions[sessionId] = Session({
            host:      msg.sender,
            isActive:  true,
            isExpired: false,
            prizePool: msg.value,
            expiresAt: block.timestamp + SESSION_EXPIRY
        });

        emit SessionCreated(sessionId, msg.sender, msg.value);
    }

    /// @notice Host closes the session and reclaims any remaining prize pool.
    ///         Callable any time — does not need to wait for expiry.
    function closeSession(bytes32 sessionId) external nonReentrant {
        Session storage s = sessions[sessionId];
        if (s.host != msg.sender) revert SessionNotFound(sessionId);
        if (!s.isActive) revert SessionNotActive(sessionId);

        uint256 refund = s.prizePool;
        s.prizePool    = 0;
        s.isActive     = false;
        s.isExpired    = true;

        if (refund > 0) {
            (bool sent,) = payable(msg.sender).call{value: refund}("");
            if (!sent) revert TransferFailed(msg.sender, refund);
        }

        emit SessionClosed(sessionId, msg.sender, refund);
    }

    // ─── Player Functions ────────────────────────────────────

    /// @notice Claim a spin prize using a backend-signed authorization.
    /// @dev Signature: keccak256(abi.encodePacked(chainid, sessionId, player, amount, address(this)))
    ///      signed with Ethereum prefix by trustedSigner.
    /// @param sessionId Spin session identifier
    /// @param amount    Prize amount in wei — included in signature, tamper-proof
    /// @param signature ECDSA signature from backend signer
    function claimSpin(
        bytes32 sessionId,
        uint256 amount,
        bytes calldata signature
    ) external nonReentrant {
        if (hasClaimed[sessionId][msg.sender]) revert AlreadyClaimed(sessionId, msg.sender);

        Session storage s = sessions[sessionId];
        if (s.host == address(0)) revert SessionNotFound(sessionId);
        if (!s.isActive)          revert SessionNotActive(sessionId);
        if (block.timestamp > s.expiresAt) revert ClaimExpired(sessionId);
        if (s.prizePool < amount) revert InsufficientPool(s.prizePool, amount);

        // Verify backend signature
        bytes32 msgHash = keccak256(abi.encodePacked(
            block.chainid, sessionId, msg.sender, amount, address(this)
        ));
        bytes32 ethHash  = MessageHashUtils.toEthSignedMessageHash(msgHash);
        address recovered = ECDSA.recover(ethHash, signature);
        if (recovered != trustedSigner) revert InvalidSignature();

        // Effects (CEI)
        hasClaimed[sessionId][msg.sender] = true;
        s.prizePool -= amount;

        // Interaction
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert TransferFailed(msg.sender, amount);

        emit SpinClaimed(sessionId, msg.sender, amount);
    }

    // ─── View Functions ──────────────────────────────────────

    function getSession(bytes32 sessionId) external view returns (
        address host,
        bool isActive,
        bool isExpired,
        uint256 prizePool,
        uint256 expiresAt
    ) {
        Session storage s = sessions[sessionId];
        return (s.host, s.isActive, s.isExpired, s.prizePool, s.expiresAt);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Admin ───────────────────────────────────────────────

    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidSigner();
        trustedSigner = _signer;
        emit SignerUpdated(_signer);
    }

    // ─── UUPS ────────────────────────────────────────────────

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
