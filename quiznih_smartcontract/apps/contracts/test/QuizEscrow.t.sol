// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console}     from "forge-std/Test.sol";
import {ERC1967Proxy}      from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {QuizEscrow}        from "../src/QuizEscrow.sol";
import {MessageHashUtils}  from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

// ─── Attack Helpers ──────────────────────────────────────────────────────────

/// @dev Attempts reentrancy into claimReward during ETH receive
contract ReentrantWinner {
    QuizEscrow public escrow;
    bytes32    public quizId;
    uint256    public amount;
    bytes      public signature;
    bool       public attacked;
    bool       public succeeded;

    constructor(QuizEscrow _escrow, bytes32 _quizId) {
        escrow = _escrow;
        quizId = _quizId;
    }

    function setClaimParams(uint256 _amount, bytes calldata _sig) external {
        amount    = _amount;
        signature = _sig;
    }

    receive() external payable {
        if (!attacked) {
            attacked = true;
            try escrow.claimReward(quizId, amount, signature) {
                succeeded = true;
            } catch {
                succeeded = false;
            }
        }
    }
}

/// @dev Reverts on any ETH receive
contract RejectingWinner {
    receive() external payable { revert("rejected"); }
}

/// @dev V2 stub for upgrade tests
contract QuizEscrowV2 is QuizEscrow {
    function version() external pure returns (string memory) { return "v2"; }
}

// ─── Main Test Contract ──────────────────────────────────────────────────────

contract QuizEscrowTest is Test {
    QuizEscrow public escrow;

    address public owner;
    address public host;
    address public player1;
    address public player2;
    address public player3;
    address public stranger;

    uint256 public signerKey;
    address public signer;

    bytes32 public constant QUIZ_ID     = keccak256("quiz-uuid-001");
    string  public constant ROOM_CODE   = "ABC123";
    uint256 public constant REWARD_POOL = 1 ether;

    // ─── Setup ───────────────────────────────────────────────

    function setUp() public {
        owner    = makeAddr("owner");
        host     = makeAddr("host");
        player1  = makeAddr("player1");
        player2  = makeAddr("player2");
        player3  = makeAddr("player3");
        stranger = makeAddr("stranger");

        signerKey = 0xBEEFCAFE;
        signer    = vm.addr(signerKey);

        vm.startPrank(owner);
        QuizEscrow impl = new QuizEscrow();
        bytes memory init = abi.encodeWithSelector(
            QuizEscrow.initialize.selector, owner, signer
        );
        escrow = QuizEscrow(address(new ERC1967Proxy(address(impl), init)));
        vm.stopPrank();

        vm.deal(host,    10 ether);
        vm.deal(stranger, 1 ether);
    }

    // ─── Signature helper ────────────────────────────────────

    function _sign(address winner, bytes32 quizId, uint256 amount)
        internal view returns (bytes memory)
    {
        bytes32 msgHash = keccak256(abi.encodePacked(
            block.chainid, quizId, winner, amount, address(escrow)
        ));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(msgHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // ─── Helpers ─────────────────────────────────────────────

    function _createQuiz() internal {
        vm.prank(host);
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    function _finalizeQuiz() internal {
        vm.prank(signer);
        escrow.finalizeQuiz(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // 1. INITIALIZATION
    // ════════════════════════════════════════════════════════

    function test_initialize_setsOwnerAndSigner() public view {
        assertEq(escrow.owner(),         owner);
        assertEq(escrow.trustedSigner(), signer);
    }

    function test_initialize_setsDefaultDistribution() public view {
        assertEq(escrow.rewardDistribution(0), 5_000);
        assertEq(escrow.rewardDistribution(1), 3_000);
        assertEq(escrow.rewardDistribution(2), 2_000);
    }

    function test_initialize_revertsZeroSigner() public {
        QuizEscrow impl = new QuizEscrow();
        vm.expectRevert(QuizEscrow.InvalidSigner.selector);
        new ERC1967Proxy(
            address(impl),
            abi.encodeWithSelector(QuizEscrow.initialize.selector, owner, address(0))
        );
    }

    function test_initialize_cannotBeCalledTwice() public {
        vm.expectRevert();
        escrow.initialize(owner, signer);
    }

    function test_initialize_emitsEvents() public {
        QuizEscrow impl = new QuizEscrow();
        vm.expectEmit(true, false, false, false);
        emit QuizEscrow.SignerUpdated(signer);
        new ERC1967Proxy(
            address(impl),
            abi.encodeWithSelector(QuizEscrow.initialize.selector, owner, signer)
        );
    }

    // ════════════════════════════════════════════════════════
    // 2. createQuizAndDeposit
    // ════════════════════════════════════════════════════════

    function test_createQuiz_storesData() public {
        _createQuiz();
        (address h, uint256 pool, bool active, bool finalized, string memory code,) =
            escrow.getQuizInfo(QUIZ_ID);

        assertEq(h,    host);
        assertEq(pool, REWARD_POOL);
        assertTrue(active);
        assertFalse(finalized);
        assertEq(code, ROOM_CODE);
    }

    function test_createQuiz_emitsEvents() public {
        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.QuizCreated(QUIZ_ID, host, ROOM_CODE);
        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDeposited(QUIZ_ID, host, REWARD_POOL);

        vm.prank(host);
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    function test_createQuiz_revertsZeroDeposit() public {
        vm.prank(host);
        vm.expectRevert(QuizEscrow.ZeroDeposit.selector);
        escrow.createQuizAndDeposit{value: 0}(QUIZ_ID, ROOM_CODE);
    }

    function test_createQuiz_revertsAlreadyExists() public {
        _createQuiz();
        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizAlreadyExists.selector, QUIZ_ID)
        );
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    // ════════════════════════════════════════════════════════
    // 3. addToRewardPool
    // ════════════════════════════════════════════════════════

    function test_addToPool_increasesPool() public {
        _createQuiz();
        vm.prank(host);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);

        (, uint256 pool,,,,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, 1.5 ether);
    }

    function test_addToPool_revertsNotHost() public {
        _createQuiz();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFound.selector, QUIZ_ID)
        );
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    function test_addToPool_revertsAfterFinalized() public {
        _createQuiz();
        _finalizeQuiz();

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizAlreadyFinalized.selector, QUIZ_ID)
        );
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // 4. cancelQuiz
    // ════════════════════════════════════════════════════════

    function test_cancelQuiz_refundsHost() public {
        _createQuiz();
        uint256 before = host.balance;

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.QuizCancelled(QUIZ_ID, host, REWARD_POOL);

        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        assertEq(host.balance, before + REWARD_POOL);
        assertEq(escrow.getContractBalance(), 0);
    }

    function test_cancelQuiz_updatesState() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        (,, bool active,,,) = escrow.getQuizInfo(QUIZ_ID);
        assertFalse(active);
    }

    function test_cancelQuiz_revertsNotHost() public {
        _createQuiz();
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFound.selector, QUIZ_ID)
        );
        escrow.cancelQuiz(QUIZ_ID);
    }

    function test_cancelQuiz_revertsAlreadyCancelled() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotActive.selector, QUIZ_ID)
        );
        escrow.cancelQuiz(QUIZ_ID);
    }

    function test_cancelQuiz_revertsAfterFinalized() public {
        _createQuiz();
        _finalizeQuiz();

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizAlreadyFinalized.selector, QUIZ_ID)
        );
        escrow.cancelQuiz(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // 5. finalizeQuiz
    // ════════════════════════════════════════════════════════

    function test_finalizeQuiz_success() public {
        _createQuiz();

        vm.expectEmit(true, false, false, false);
        emit QuizEscrow.QuizFinalized(QUIZ_ID, block.timestamp + 30 days);

        _finalizeQuiz();

        (,, bool active, bool finalized,, uint256 deadline) = escrow.getQuizInfo(QUIZ_ID);
        assertFalse(active);
        assertTrue(finalized);
        assertEq(deadline, block.timestamp + 30 days);
    }

    function test_finalizeQuiz_revertsNotSigner() public {
        _createQuiz();
        vm.prank(stranger);
        vm.expectRevert(QuizEscrow.InvalidSigner.selector);
        escrow.finalizeQuiz(QUIZ_ID);
    }

    function test_finalizeQuiz_revertsQuizNotFound() public {
        vm.prank(signer);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFound.selector, QUIZ_ID)
        );
        escrow.finalizeQuiz(QUIZ_ID);
    }

    function test_finalizeQuiz_revertsAlreadyFinalized() public {
        _createQuiz();
        _finalizeQuiz();

        vm.prank(signer);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizAlreadyFinalized.selector, QUIZ_ID)
        );
        escrow.finalizeQuiz(QUIZ_ID);
    }

    function test_finalizeQuiz_revertsOnCancelledQuiz() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        vm.prank(signer);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotActive.selector, QUIZ_ID)
        );
        escrow.finalizeQuiz(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // 6. claimReward
    // ════════════════════════════════════════════════════════

    function test_claimReward_success() public {
        _createQuiz();
        _finalizeQuiz();

        uint256 amount = 0.5 ether;
        bytes memory sig = _sign(player1, QUIZ_ID, amount);
        uint256 before   = player1.balance;

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardClaimed(QUIZ_ID, player1, amount);

        vm.prank(player1);
        escrow.claimReward(QUIZ_ID, amount, sig);

        assertEq(player1.balance, before + amount);
        assertTrue(escrow.claimed(QUIZ_ID, player1));
    }

    function test_claimReward_deductsFromPool() public {
        _createQuiz();
        _finalizeQuiz();

        uint256 amount = 0.5 ether;
        bytes memory sig = _sign(player1, QUIZ_ID, amount);
        vm.prank(player1);
        escrow.claimReward(QUIZ_ID, amount, sig);

        (, uint256 pool,,,,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, REWARD_POOL - amount);
    }

    function test_claimReward_revertsAlreadyClaimed() public {
        _createQuiz();
        _finalizeQuiz();

        uint256 amount = 0.5 ether;
        bytes memory sig = _sign(player1, QUIZ_ID, amount);
        vm.prank(player1);
        escrow.claimReward(QUIZ_ID, amount, sig);

        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.AlreadyClaimed.selector, QUIZ_ID, player1)
        );
        escrow.claimReward(QUIZ_ID, amount, sig);
    }

    function test_claimReward_revertsQuizNotFound() public {
        bytes32 fakeId = keccak256("nonexistent");
        bytes memory sig = _sign(player1, fakeId, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFound.selector, fakeId)
        );
        escrow.claimReward(fakeId, 0.5 ether, sig);
    }

    function test_claimReward_revertsNotFinalized() public {
        _createQuiz();

        bytes memory sig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFinalized.selector, QUIZ_ID)
        );
        escrow.claimReward(QUIZ_ID, 0.5 ether, sig);
    }

    function test_claimReward_revertsExpired() public {
        _createQuiz();
        _finalizeQuiz();

        vm.warp(block.timestamp + 31 days);

        bytes memory sig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.ClaimExpired.selector, QUIZ_ID)
        );
        escrow.claimReward(QUIZ_ID, 0.5 ether, sig);
    }

    function test_claimReward_revertsInsufficientPool() public {
        _createQuiz();
        _finalizeQuiz();

        // Claim full pool first
        bytes memory sig1 = _sign(player1, QUIZ_ID, REWARD_POOL);
        vm.prank(player1);
        escrow.claimReward(QUIZ_ID, REWARD_POOL, sig1);

        // player2 tries to claim more
        bytes memory sig2 = _sign(player2, QUIZ_ID, 0.1 ether);
        vm.prank(player2);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.InsufficientPool.selector, 0, 0.1 ether)
        );
        escrow.claimReward(QUIZ_ID, 0.1 ether, sig2);
    }

    function test_claimReward_revertsInvalidSig_wrongWinner() public {
        _createQuiz();
        _finalizeQuiz();

        // Signed for player2, but player1 submits
        bytes memory sig = _sign(player2, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(QuizEscrow.InvalidSignature.selector);
        escrow.claimReward(QUIZ_ID, 0.5 ether, sig);
    }

    function test_claimReward_revertsInvalidSig_wrongAmount() public {
        _createQuiz();
        _finalizeQuiz();

        bytes memory sig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(QuizEscrow.InvalidSignature.selector);
        escrow.claimReward(QUIZ_ID, 0.9 ether, sig);
    }

    function test_claimReward_multipleWinners() public {
        _createQuiz();
        _finalizeQuiz();

        uint256[3] memory amounts = [uint256(0.5 ether), 0.3 ether, 0.2 ether];
        address[3] memory players = [player1, player2, player3];

        for (uint256 i = 0; i < 3; i++) {
            bytes memory sig = _sign(players[i], QUIZ_ID, amounts[i]);
            vm.prank(players[i]);
            escrow.claimReward(QUIZ_ID, amounts[i], sig);
        }

        assertEq(player1.balance, 0.5 ether);
        assertEq(player2.balance, 0.3 ether);
        assertEq(player3.balance, 0.2 ether);
        assertEq(escrow.getContractBalance(), 0);
    }

    // ─── Reentrancy ──────────────────────────────────────────

    function test_claimReward_reentrancyBlocked() public {
        _createQuiz();
        _finalizeQuiz();

        ReentrantWinner attacker = new ReentrantWinner(escrow, QUIZ_ID);
        vm.deal(address(attacker), 1 ether);

        uint256 amount  = 0.5 ether;
        bytes memory sig = _sign(address(attacker), QUIZ_ID, amount);
        attacker.setClaimParams(amount, sig);

        vm.prank(address(attacker));
        escrow.claimReward(QUIZ_ID, amount, sig);

        assertTrue(attacker.attacked());
        assertFalse(attacker.succeeded());

        // Pool decremented exactly once
        (, uint256 pool,,,,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, REWARD_POOL - amount);
    }

    // ─── Transfer failure ────────────────────────────────────

    function test_claimReward_transferFailedReverts() public {
        _createQuiz();
        _finalizeQuiz();

        RejectingWinner rejector = new RejectingWinner();
        uint256 amount = 0.5 ether;
        bytes memory sig = _sign(address(rejector), QUIZ_ID, amount);

        vm.prank(address(rejector));
        vm.expectRevert(
            abi.encodeWithSelector(
                QuizEscrow.TransferFailed.selector, address(rejector), amount
            )
        );
        escrow.claimReward(QUIZ_ID, amount, sig);

        // hasClaimed must remain false
        assertFalse(escrow.claimed(QUIZ_ID, address(rejector)));
    }

    // ════════════════════════════════════════════════════════
    // 7. reclaimExpiredFunds
    // ════════════════════════════════════════════════════════

    function test_reclaimExpired_afterDeadline() public {
        _createQuiz();
        _finalizeQuiz();

        // Partial claim by player1 only
        bytes memory sig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        escrow.claimReward(QUIZ_ID, 0.5 ether, sig);

        vm.warp(block.timestamp + 31 days);

        uint256 before = host.balance;
        vm.prank(host);
        escrow.reclaimExpiredFunds(QUIZ_ID);

        assertEq(host.balance, before + 0.5 ether); // remaining pool
    }

    function test_reclaimExpired_revertsBeforeDeadline() public {
        _createQuiz();
        _finalizeQuiz();

        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.ClaimNotExpired.selector, QUIZ_ID)
        );
        escrow.reclaimExpiredFunds(QUIZ_ID);
    }

    function test_reclaimExpired_revertsNotFinalized() public {
        _createQuiz();

        vm.warp(block.timestamp + 31 days);
        vm.prank(host);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFinalized.selector, QUIZ_ID)
        );
        escrow.reclaimExpiredFunds(QUIZ_ID);
    }

    function test_reclaimExpired_revertsNotHost() public {
        _createQuiz();
        _finalizeQuiz();

        vm.warp(block.timestamp + 31 days);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.QuizNotFound.selector, QUIZ_ID)
        );
        escrow.reclaimExpiredFunds(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // 8. setSigner
    // ════════════════════════════════════════════════════════

    function test_setSigner_updatesAndEmits() public {
        address newSigner = makeAddr("newSigner");
        vm.expectEmit(true, false, false, false);
        emit QuizEscrow.SignerUpdated(newSigner);

        vm.prank(owner);
        escrow.setSigner(newSigner);

        assertEq(escrow.trustedSigner(), newSigner);
    }

    function test_setSigner_revertsNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert();
        escrow.setSigner(stranger);
    }

    function test_setSigner_revertsZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(QuizEscrow.InvalidSigner.selector);
        escrow.setSigner(address(0));
    }

    function test_setSigner_oldSignaturesInvalidated() public {
        _createQuiz();
        _finalizeQuiz();

        uint256 newKey = 0xC0FFEE;
        vm.prank(owner);
        escrow.setSigner(vm.addr(newKey));

        bytes memory oldSig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(player1);
        vm.expectRevert(QuizEscrow.InvalidSignature.selector);
        escrow.claimReward(QUIZ_ID, 0.5 ether, oldSig);
    }

    // ════════════════════════════════════════════════════════
    // 9. updateRewardDistribution
    // ════════════════════════════════════════════════════════

    function test_updateDist_success() public {
        uint256[] memory dist = new uint256[](3);
        dist[0] = 6_000; dist[1] = 3_000; dist[2] = 1_000;

        vm.expectEmit(false, false, false, true);
        emit QuizEscrow.RewardDistributionUpdated(dist);

        vm.prank(owner);
        escrow.updateRewardDistribution(dist);

        assertEq(escrow.rewardDistribution(0), 6_000);
    }

    function test_updateDist_revertsNotOwner() public {
        uint256[] memory dist = new uint256[](3);
        dist[0] = 6_000; dist[1] = 3_000; dist[2] = 1_000;
        vm.prank(stranger);
        vm.expectRevert();
        escrow.updateRewardDistribution(dist);
    }

    function test_updateDist_revertsWrongSum() public {
        uint256[] memory dist = new uint256[](3);
        dist[0] = 5_000; dist[1] = 3_000; dist[2] = 1_000; // = 9000

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.InvalidDistribution.selector, 9_000, 10_000)
        );
        escrow.updateRewardDistribution(dist);
    }

    // ════════════════════════════════════════════════════════
    // 10. UUPS UPGRADE
    // ════════════════════════════════════════════════════════

    function test_upgrade_onlyOwner() public {
        QuizEscrowV2 v2 = new QuizEscrowV2();
        vm.prank(stranger);
        vm.expectRevert();
        escrow.upgradeToAndCall(address(v2), "");
    }

    function test_upgrade_preservesStorage() public {
        _createQuiz();

        QuizEscrowV2 v2 = new QuizEscrowV2();
        vm.prank(owner);
        escrow.upgradeToAndCall(address(v2), "");

        QuizEscrowV2 v2proxy = QuizEscrowV2(address(escrow));
        assertEq(v2proxy.version(), "v2");
        assertEq(v2proxy.owner(), owner);
        assertEq(v2proxy.rewardDistribution(0), 5_000);

        (address h, uint256 pool,,,,) = v2proxy.getQuizInfo(QUIZ_ID);
        assertEq(h,    host);
        assertEq(pool, REWARD_POOL);
    }

    // ════════════════════════════════════════════════════════
    // 11. FUZZ TESTS
    // ════════════════════════════════════════════════════════

    function testFuzz_createQuiz_anyDepositWorks(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(host, amount);

        bytes32 id = keccak256("fuzz-quiz");
        vm.prank(host);
        escrow.createQuizAndDeposit{value: amount}(id, "FUZZ01");

        (, uint256 pool,,,,) = escrow.getQuizInfo(id);
        assertEq(pool, amount);
    }

    function testFuzz_cancelQuiz_fullRefund(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(host, amount);

        bytes32 id = keccak256("fuzz-cancel");
        vm.prank(host);
        escrow.createQuizAndDeposit{value: amount}(id, "FUZZ02");

        uint256 before = host.balance;
        vm.prank(host);
        escrow.cancelQuiz(id);

        assertEq(host.balance - before, amount);
        assertEq(escrow.getContractBalance(), 0);
    }

    function testFuzz_claimReward_signatureBindsToWinner(address fakeWinner) public {
        vm.assume(fakeWinner != player1 && fakeWinner != address(0));

        _createQuiz();
        _finalizeQuiz();

        bytes memory sig = _sign(player1, QUIZ_ID, 0.5 ether);
        vm.prank(fakeWinner);
        vm.expectRevert(QuizEscrow.InvalidSignature.selector);
        escrow.claimReward(QUIZ_ID, 0.5 ether, sig);
    }

    function testFuzz_claimReward_invalidAmountReverts(uint256 badAmount) public {
        uint256 signedAmount = 0.5 ether;
        vm.assume(badAmount != signedAmount);
        vm.assume(badAmount <= REWARD_POOL);

        _createQuiz();
        _finalizeQuiz();

        bytes memory sig = _sign(player1, QUIZ_ID, signedAmount);
        vm.prank(player1);
        vm.expectRevert(QuizEscrow.InvalidSignature.selector);
        escrow.claimReward(QUIZ_ID, badAmount, sig);
    }
}
