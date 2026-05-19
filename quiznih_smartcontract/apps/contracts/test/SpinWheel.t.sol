// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console}   from "forge-std/Test.sol";
import {ERC1967Proxy}    from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {SpinWheel}       from "../src/SpinWheel.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// ─── Attack Helpers ──────────────────────────────────────────────────────────

/// @dev Attempts reentrancy into claimSpin during ETH receive
contract ReentrantPlayer {
    SpinWheel public wheel;
    bytes32   public sessionId;
    uint256   public amount;
    bytes     public signature;
    bool      public attacked;
    bool      public succeeded;

    constructor(SpinWheel _wheel, bytes32 _sessionId) {
        wheel     = _wheel;
        sessionId = _sessionId;
    }

    function setClaimParams(uint256 _amount, bytes calldata _sig) external {
        amount    = _amount;
        signature = _sig;
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            try wheel.claimSpin(sessionId, amount, signature) {
                succeeded = true;
            } catch {
                succeeded = false;
            }
        }
    }
}

/// @dev Reverts on any ETH receive — tests TransferFailed path
contract RejectingPlayer {
    receive() external payable {
        revert("rejected");
    }
}

/// @dev V2 stub for upgrade tests
contract SpinWheelV2 is SpinWheel {
    function version() external pure returns (string memory) { return "v2"; }
}

// ─── Main Test Contract ──────────────────────────────────────────────────────

contract SpinWheelTest is Test {
    SpinWheel public wheel;

    // named accounts
    address public owner;
    address public host;
    address public player1;
    address public player2;
    address public stranger;

    // signer keypair (vm.sign needs the private key)
    uint256 public signerKey;
    address public signer;

    // reused constants
    bytes32 constant SESSION_A = keccak256("session-a");
    bytes32 constant SESSION_B = keccak256("session-b");
    uint256 constant PRIZE     = 0.001 ether;
    uint256 constant POOL      = 1 ether;

    // ─── Setup ───────────────────────────────────────────────

    function setUp() public {
        owner    = makeAddr("owner");
        host     = makeAddr("host");
        player1  = makeAddr("player1");
        player2  = makeAddr("player2");
        stranger = makeAddr("stranger");

        signerKey = 0xBEEFCAFE;
        signer    = vm.addr(signerKey);

        vm.startPrank(owner);
        SpinWheel impl = new SpinWheel();
        bytes memory init = abi.encodeWithSelector(
            SpinWheel.initialize.selector,
            owner,
            signer
        );
        wheel = SpinWheel(address(new ERC1967Proxy(address(impl), init)));
        vm.stopPrank();

        // fund actors
        vm.deal(host,    10 ether);
        vm.deal(player1, 1 ether);
        vm.deal(player2, 1 ether);
    }

    // ─── Signature helper ────────────────────────────────────

    function _sign(
        address player,
        bytes32 sessionId,
        uint256 amount
    ) internal view returns (bytes memory) {
        bytes32 msgHash = keccak256(abi.encodePacked(
            block.chainid,
            sessionId,
            player,
            amount,
            address(wheel)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // ─── Helpers ─────────────────────────────────────────────

    function _createSession(bytes32 id, uint256 poolSize) internal {
        vm.prank(host);
        wheel.createSession{value: poolSize}(id);
    }

    // ════════════════════════════════════════════════════════
    // 1. INITIALIZATION
    // ════════════════════════════════════════════════════════

    function test_initialize_setsOwnerAndSigner() public view {
        assertEq(wheel.owner(),         owner);
        assertEq(wheel.trustedSigner(), signer);
    }

    function test_initialize_revertsZeroSigner() public {
        SpinWheel impl = new SpinWheel();
        bytes memory init = abi.encodeWithSelector(
            SpinWheel.initialize.selector,
            owner,
            address(0)
        );
        vm.expectRevert(SpinWheel.InvalidSigner.selector);
        new ERC1967Proxy(address(impl), init);
    }

    function test_initialize_cannotBeCalledTwice() public {
        vm.expectRevert();
        wheel.initialize(owner, signer);
    }

    function test_initialize_emitsSignerUpdated() public {
        SpinWheel impl = new SpinWheel();
        vm.expectEmit(true, false, false, false);
        emit SpinWheel.SignerUpdated(signer);
        new ERC1967Proxy(
            address(impl),
            abi.encodeWithSelector(SpinWheel.initialize.selector, owner, signer)
        );
    }

    // ════════════════════════════════════════════════════════
    // 2. createSession
    // ════════════════════════════════════════════════════════

    function test_createSession_success() public {
        vm.expectEmit(true, true, false, true);
        emit SpinWheel.SessionCreated(SESSION_A, host, POOL);

        _createSession(SESSION_A, POOL);

        (address h, bool active,, uint256 pool,) = wheel.getSession(SESSION_A);
        assertEq(h,    host);
        assertTrue(active);
        assertEq(pool, POOL);
        assertEq(address(wheel).balance, POOL);
    }

    function test_createSession_revertsZeroDeposit() public {
        vm.prank(host);
        vm.expectRevert(SpinWheel.ZeroDeposit.selector);
        wheel.createSession{value: 0}(SESSION_A);
    }

    function test_createSession_revertsAlreadyExists() public {
        _createSession(SESSION_A, POOL);

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.SessionAlreadyExists.selector, SESSION_A)
        );
        wheel.createSession{value: POOL}(SESSION_A);
    }

    function test_createSession_setsExpiry() public {
        uint256 before = block.timestamp;
        _createSession(SESSION_A, POOL);

        (,,,, uint256 expiresAt) = wheel.getSession(SESSION_A);
        assertEq(expiresAt, before + 7 days);
    }

    // ════════════════════════════════════════════════════════
    // 3. closeSession
    // ════════════════════════════════════════════════════════

    function test_closeSession_refundsFullPool() public {
        _createSession(SESSION_A, POOL);

        uint256 before = host.balance;

        vm.expectEmit(true, true, false, true);
        emit SpinWheel.SessionClosed(SESSION_A, host, POOL);

        vm.prank(host);
        wheel.closeSession(SESSION_A);

        assertEq(host.balance, before + POOL);
        assertEq(address(wheel).balance, 0);
    }

    function test_closeSession_refundsPartialPool() public {
        _createSession(SESSION_A, POOL);

        // player1 claims PRIZE first
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        uint256 before = host.balance;
        vm.prank(host);
        wheel.closeSession(SESSION_A);

        assertEq(host.balance, before + POOL - PRIZE);
    }

    function test_closeSession_marksInactive() public {
        _createSession(SESSION_A, POOL);
        vm.prank(host);
        wheel.closeSession(SESSION_A);

        (, bool active, bool expired,,) = wheel.getSession(SESSION_A);
        assertFalse(active);
        assertTrue(expired);
    }

    function test_closeSession_revertsNotHost() public {
        _createSession(SESSION_A, POOL);

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.SessionNotFound.selector, SESSION_A)
        );
        wheel.closeSession(SESSION_A);
    }

    function test_closeSession_revertsAlreadyClosed() public {
        _createSession(SESSION_A, POOL);
        vm.prank(host);
        wheel.closeSession(SESSION_A);

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.SessionNotActive.selector, SESSION_A)
        );
        wheel.closeSession(SESSION_A);
    }

    function test_closeSession_whenPoolAlreadyEmpty() public {
        // All prizes claimed, pool = 0 → closeSession still works, refund=0
        _createSession(SESSION_A, PRIZE); // pool exactly 1 prize

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        uint256 before = host.balance;
        vm.prank(host);
        wheel.closeSession(SESSION_A); // should not revert

        assertEq(host.balance, before); // no refund, but no revert
    }

    function test_closeSession_hostCanCloseAfterExpiry() public {
        _createSession(SESSION_A, POOL);

        // Fast-forward past expiry
        vm.warp(block.timestamp + 8 days);

        uint256 before = host.balance;
        vm.prank(host);
        wheel.closeSession(SESSION_A); // should still work

        assertEq(host.balance, before + POOL);
    }

    // ════════════════════════════════════════════════════════
    // 4. claimSpin
    // ════════════════════════════════════════════════════════

    function test_claimSpin_success() public {
        _createSession(SESSION_A, POOL);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        uint256 before   = player1.balance;

        vm.expectEmit(true, true, false, true);
        emit SpinWheel.SpinClaimed(SESSION_A, player1, PRIZE);

        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        assertEq(player1.balance, before + PRIZE);
        assertTrue(wheel.hasClaimed(SESSION_A, player1));
    }

    function test_claimSpin_deductsPrizeFromPool() public {
        _createSession(SESSION_A, POOL);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        (,,, uint256 remaining,) = wheel.getSession(SESSION_A);
        assertEq(remaining, POOL - PRIZE);
    }

    function test_claimSpin_revertsAlreadyClaimed() public {
        _createSession(SESSION_A, POOL);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.AlreadyClaimed.selector, SESSION_A, player1)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }

    function test_claimSpin_revertsSessionNotFound() public {
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.SessionNotFound.selector, SESSION_A)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }

    function test_claimSpin_revertsSessionNotActive() public {
        _createSession(SESSION_A, POOL);
        vm.prank(host);
        wheel.closeSession(SESSION_A);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.SessionNotActive.selector, SESSION_A)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }

    function test_claimSpin_revertsExpired() public {
        _createSession(SESSION_A, POOL);
        vm.warp(block.timestamp + 8 days);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.ClaimExpired.selector, SESSION_A)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }

    function test_claimSpin_succeedsAtExactExpiry() public {
        // boundary: at exactly expiresAt, claim is still valid (> not >=)
        _createSession(SESSION_A, POOL);
        (,,,, uint256 expiresAt) = wheel.getSession(SESSION_A);
        vm.warp(expiresAt);

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig); // should NOT revert
    }

    function test_claimSpin_revertsInsufficientPool() public {
        _createSession(SESSION_A, PRIZE); // pool = exactly 1 prize

        // player1 claims
        bytes memory sig1 = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig1);

        // player2 tries to claim same amount — pool empty
        bytes memory sig2 = _sign(player2, SESSION_A, PRIZE);
        vm.prank(player2);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.InsufficientPool.selector, 0, PRIZE)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig2);
    }

    function test_claimSpin_revertsInvalidSignature_wrongSigner() public {
        _createSession(SESSION_A, POOL);

        // Sign with random key (not trustedSigner)
        uint256 wrongKey = 0xDEADBEEF;
        bytes32 msgHash  = keccak256(abi.encodePacked(
            block.chainid, SESSION_A, player1, PRIZE, address(wheel)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethHash);
        bytes memory badSig = abi.encodePacked(r, s, v);

        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE, badSig);
    }

    function test_claimSpin_revertsInvalidSignature_wrongPlayer() public {
        _createSession(SESSION_A, POOL);

        // Signature for player2, but player1 tries to use it
        bytes memory sig = _sign(player2, SESSION_A, PRIZE);

        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }

    function test_claimSpin_revertsInvalidSignature_wrongAmount() public {
        _createSession(SESSION_A, POOL);

        // Signature for PRIZE, but claim with PRIZE*2
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);

        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE * 2, sig);
    }

    function test_claimSpin_revertsInvalidSignature_wrongSession() public {
        _createSession(SESSION_A, POOL);
        _createSession(SESSION_B, POOL);

        // Signature for SESSION_A, but claim on SESSION_B
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);

        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_B, PRIZE, sig);
    }

    function test_claimSpin_revertsInvalidSignature_wrongContract() public {
        // Deploy a second SpinWheel — same signer, different address
        SpinWheel impl2 = new SpinWheel();
        SpinWheel wheel2 = SpinWheel(address(new ERC1967Proxy(
            address(impl2),
            abi.encodeWithSelector(SpinWheel.initialize.selector, owner, signer)
        )));
        vm.deal(host, 20 ether);
        vm.prank(host);
        wheel2.createSession{value: POOL}(SESSION_A);

        // Sign for wheel2 but submit to wheel (original)
        bytes32 msgHash = keccak256(abi.encodePacked(
            block.chainid, SESSION_A, player1, PRIZE, address(wheel2)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, ethHash);
        bytes memory crossSig = abi.encodePacked(r, s, v);

        _createSession(SESSION_A, POOL);
        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE, crossSig);
    }

    function test_claimSpin_multiplePlayers_allSucceed() public {
        _createSession(SESSION_A, POOL);

        address[3] memory players = [player1, player2, makeAddr("p3")];
        for (uint256 i = 0; i < players.length; i++) {
            bytes memory sig = _sign(players[i], SESSION_A, PRIZE);
            vm.prank(players[i]);
            wheel.claimSpin(SESSION_A, PRIZE, sig);
            assertTrue(wheel.hasClaimed(SESSION_A, players[i]));
        }

        (,,, uint256 remaining,) = wheel.getSession(SESSION_A);
        assertEq(remaining, POOL - PRIZE * 3);
    }

    // ─── Reentrancy ──────────────────────────────────────────

    function test_claimSpin_reentrancyBlocked() public {
        _createSession(SESSION_A, POOL);

        ReentrantPlayer attacker = new ReentrantPlayer(wheel, SESSION_A);
        vm.deal(address(attacker), 1 ether);

        bytes memory sig = _sign(address(attacker), SESSION_A, PRIZE);
        attacker.setClaimParams(PRIZE, sig);

        vm.prank(address(attacker));
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        // Reentrancy attempt in receive() must have failed
        assertTrue(attacker.attacked());
        assertFalse(attacker.succeeded());

        // Pool should only be decremented once
        (,,, uint256 remaining,) = wheel.getSession(SESSION_A);
        assertEq(remaining, POOL - PRIZE);
    }

    // ─── Transfer failure ────────────────────────────────────

    function test_claimSpin_transferFailedReverts() public {
        _createSession(SESSION_A, POOL);

        RejectingPlayer rejector = new RejectingPlayer();

        bytes memory sig = _sign(address(rejector), SESSION_A, PRIZE);
        vm.prank(address(rejector));
        vm.expectRevert(
            abi.encodeWithSelector(
                SpinWheel.TransferFailed.selector,
                address(rejector),
                PRIZE
            )
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig);

        // hasClaimed must be FALSE — state rolled back
        assertFalse(wheel.hasClaimed(SESSION_A, address(rejector)));

        // pool must be unchanged
        (,,, uint256 remaining,) = wheel.getSession(SESSION_A);
        assertEq(remaining, POOL);
    }

    // ─── Audit fix: zero-amount guard ────────────────────────

    function test_claimSpin_zeroAmountSucceedsButWastesClaimSlot() public {
        // Documents current behavior: zero-amount claim goes through
        // (burns hasClaimed slot). Fix: add zero-amount revert in contract.
        _createSession(SESSION_A, POOL);

        bytes memory sig = _sign(player1, SESSION_A, 0);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, 0, sig);

        // Slot is consumed
        assertTrue(wheel.hasClaimed(SESSION_A, player1));

        // player1 can never claim real prize now
        bytes memory sig2 = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(SpinWheel.AlreadyClaimed.selector, SESSION_A, player1)
        );
        wheel.claimSpin(SESSION_A, PRIZE, sig2);
    }

    // ════════════════════════════════════════════════════════
    // 5. setSigner
    // ════════════════════════════════════════════════════════

    function test_setSigner_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        wheel.setSigner(stranger);
    }

    function test_setSigner_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(SpinWheel.InvalidSigner.selector);
        wheel.setSigner(address(0));
    }

    function test_setSigner_updatesAndEmits() public {
        address newSigner = makeAddr("newSigner");

        vm.expectEmit(true, false, false, false);
        emit SpinWheel.SignerUpdated(newSigner);

        vm.prank(owner);
        wheel.setSigner(newSigner);

        assertEq(wheel.trustedSigner(), newSigner);
    }

    function test_setSigner_oldSignaturesInvalidated() public {
        _createSession(SESSION_A, POOL);

        // Rotate signer
        uint256 newKey    = 0xC0FFEE;
        address newSigner = vm.addr(newKey);
        vm.prank(owner);
        wheel.setSigner(newSigner);

        // Old signature no longer valid
        bytes memory oldSig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE, oldSig);

        // New signature works
        bytes32 msgHash = keccak256(abi.encodePacked(
            block.chainid, SESSION_A, player1, PRIZE, address(wheel)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(newKey, ethHash);
        bytes memory newSig = abi.encodePacked(r, s, v);

        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, newSig);
        assertTrue(wheel.hasClaimed(SESSION_A, player1));
    }

    // ════════════════════════════════════════════════════════
    // 6. UUPS UPGRADE
    // ════════════════════════════════════════════════════════

    function test_upgrade_onlyOwner() public {
        SpinWheelV2 v2impl = new SpinWheelV2();

        vm.prank(stranger);
        vm.expectRevert();
        wheel.upgradeToAndCall(address(v2impl), "");
    }

    function test_upgrade_preservesStorage() public {
        _createSession(SESSION_A, POOL);

        SpinWheelV2 v2impl = new SpinWheelV2();
        vm.prank(owner);
        wheel.upgradeToAndCall(address(v2impl), "");

        // Cast to V2 via same proxy address
        SpinWheelV2 wheelV2 = SpinWheelV2(address(wheel));
        assertEq(wheelV2.version(), "v2");

        // Storage intact
        (address h, bool active,,uint256 pool,) = wheelV2.getSession(SESSION_A);
        assertEq(h,    host);
        assertTrue(active);
        assertEq(pool, POOL);
    }

    function test_upgrade_claimsStillWorkAfterUpgrade() public {
        _createSession(SESSION_A, POOL);

        SpinWheelV2 v2impl = new SpinWheelV2();
        vm.prank(owner);
        wheel.upgradeToAndCall(address(v2impl), "");

        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        wheel.claimSpin(SESSION_A, PRIZE, sig);
        assertTrue(wheel.hasClaimed(SESSION_A, player1));
    }

    // ════════════════════════════════════════════════════════
    // 7. FUZZ TESTS
    // ════════════════════════════════════════════════════════

    function testFuzz_claimSpin_invalidAmountReverts(uint256 badAmount) public {
        vm.assume(badAmount != PRIZE);
        vm.assume(badAmount <= POOL);

        _createSession(SESSION_A, POOL);

        // Signature is for PRIZE but claim with badAmount
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);
        vm.prank(player1);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, badAmount, sig);
    }

    function testFuzz_createSession_anyDepositWorks(uint256 amount) public {
        vm.assume(amount > 0 && amount <= 10 ether);
        vm.deal(host, amount);

        vm.prank(host);
        wheel.createSession{value: amount}(SESSION_A);

        (,,, uint256 pool,) = wheel.getSession(SESSION_A);
        assertEq(pool, amount);
    }

    function testFuzz_claimSpin_signatureBindsToPlayer(address fakePlayer) public {
        vm.assume(fakePlayer != player1);
        vm.assume(fakePlayer != address(0));

        _createSession(SESSION_A, POOL);

        // Signature for player1
        bytes memory sig = _sign(player1, SESSION_A, PRIZE);

        // fakePlayer tries to use player1's signature
        vm.prank(fakePlayer);
        vm.expectRevert(SpinWheel.InvalidSignature.selector);
        wheel.claimSpin(SESSION_A, PRIZE, sig);
    }
}
