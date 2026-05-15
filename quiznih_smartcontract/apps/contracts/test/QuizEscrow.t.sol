// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console}   from "forge-std/Test.sol";
import {ERC1967Proxy}    from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {QuizEscrow}      from "../src/QuizEscrow.sol";

// ─── Helpers ────────────────────────────────────────────────────────────────

/// @dev Malicious contract that attempts reentrancy inside distributeRewards.
contract ReentrantWinner {
    QuizEscrow public escrow;
    bytes32 public quizId;
    bool public attackTriggered;
    bool public attackSucceeded;

    constructor(QuizEscrow _escrow, bytes32 _quizId) {
        escrow = _escrow;
        quizId = _quizId;
    }

    receive() external payable {
        if (!attackTriggered) {
            attackTriggered = true;
            address payable[] memory winners = new address payable[](1);
            winners[0] = payable(address(this));
            // This should be blocked by the nonReentrant modifier
            try escrow.distributeRewards(quizId, winners) {
                attackSucceeded = true;
            } catch {
                attackSucceeded = false;
            }
        }
    }
}

/// @dev Reverts on any ETH receive — used to test TransferFailed error.
contract RejectingWinner {
    receive() external payable {
        revert("I reject funds");
    }
}

/// @dev Minimal V2 implementation for upgrade tests.
contract QuizEscrowV2 is QuizEscrow {
    function version() external pure returns (string memory) {
        return "v2";
    }
}

// ─── Test Contract ───────────────────────────────────────────────────────────

contract QuizEscrowTest is Test {
    QuizEscrow public escrow;

    address public owner;
    address public host;
    address public player1;
    address public player2;
    address public player3;
    address public stranger;

    bytes32 public constant QUIZ_ID    = keccak256("quiz-uuid-001");
    string  public constant ROOM_CODE  = "ABC123";
    uint256 public constant REWARD_POOL = 1 ether;

    // ─── Setup ──────────────────────────────────────────────

    function setUp() public {
        owner   = makeAddr("owner");
        host    = makeAddr("host");
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        stranger = makeAddr("stranger");

        // Deploy implementation + proxy
        QuizEscrow impl = new QuizEscrow();
        bytes memory initData = abi.encodeWithSelector(QuizEscrow.initialize.selector, owner);
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        escrow = QuizEscrow(address(proxy));

        vm.deal(host, 10 ether);
        vm.deal(stranger, 1 ether);
    }

    // ─── Helpers ────────────────────────────────────────────

    function _createQuiz() internal {
        vm.prank(host);
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    function _threeWinners() internal view returns (address payable[] memory) {
        address payable[] memory winners = new address payable[](3);
        winners[0] = payable(player1);
        winners[1] = payable(player2);
        winners[2] = payable(player3);
        return winners;
    }

    // ════════════════════════════════════════════════════════
    // Proxy / Initializer
    // ════════════════════════════════════════════════════════

    function test_Initialize_SetsOwner() public view {
        assertEq(escrow.owner(), owner);
    }

    function test_Initialize_SetsDefaultDistribution() public view {
        assertEq(escrow.rewardDistribution(0), 5_000);
        assertEq(escrow.rewardDistribution(1), 3_000);
        assertEq(escrow.rewardDistribution(2), 2_000);
    }

    function test_RevertIf_Initialize_CalledTwice() public {
        vm.expectRevert();
        escrow.initialize(owner);
    }

    // ════════════════════════════════════════════════════════
    // UUPS Upgrade
    // ════════════════════════════════════════════════════════

    function test_UpgradeToV2_Success() public {
        QuizEscrowV2 implV2 = new QuizEscrowV2();

        vm.prank(owner);
        escrow.upgradeToAndCall(address(implV2), "");

        // Proxy now points to V2 — call the new function through the proxy
        assertEq(QuizEscrowV2(address(escrow)).version(), "v2");
        // State preserved through upgrade
        assertEq(escrow.owner(), owner);
        assertEq(escrow.rewardDistribution(0), 5_000);
    }

    function test_RevertIf_Upgrade_NotOwner() public {
        QuizEscrowV2 implV2 = new QuizEscrowV2();

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                stranger
            )
        );
        vm.prank(stranger);
        escrow.upgradeToAndCall(address(implV2), "");
    }

    // ════════════════════════════════════════════════════════
    // createQuizAndDeposit
    // ════════════════════════════════════════════════════════

    function test_CreateQuizAndDeposit_StoresCorrectData() public {
        _createQuiz();

        (address h, uint256 pool, bool active, bool distributed, string memory code) =
            escrow.getQuizInfo(QUIZ_ID);

        assertEq(h, host);
        assertEq(pool, REWARD_POOL);
        assertTrue(active);
        assertFalse(distributed);
        assertEq(code, ROOM_CODE);
        assertTrue(h != address(0));
    }

    function test_CreateQuizAndDeposit_EmitsEvents() public {
        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.QuizCreated(QUIZ_ID, host, ROOM_CODE);

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDeposited(QUIZ_ID, host, REWARD_POOL);

        vm.prank(host);
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    function test_CreateQuizAndDeposit_UpdatesContractBalance() public {
        _createQuiz();
        assertEq(escrow.getContractBalance(), REWARD_POOL);
    }

    function test_RevertIf_CreateQuiz_AlreadyExists() public {
        _createQuiz();
        vm.expectRevert(abi.encodeWithSelector(QuizEscrow.QuizAlreadyExists.selector, QUIZ_ID));
        vm.prank(host);
        escrow.createQuizAndDeposit{value: REWARD_POOL}(QUIZ_ID, ROOM_CODE);
    }

    function test_RevertIf_CreateQuiz_ZeroDeposit() public {
        vm.expectRevert(QuizEscrow.ZeroDeposit.selector);
        vm.prank(host);
        escrow.createQuizAndDeposit{value: 0}(QUIZ_ID, ROOM_CODE);
    }

    // ════════════════════════════════════════════════════════
    // addToRewardPool
    // ════════════════════════════════════════════════════════

    function test_AddToRewardPool_IncreasesPool() public {
        _createQuiz();

        vm.prank(host);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);

        (, uint256 pool,,,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, 1.5 ether);
    }

    function test_AddToRewardPool_EmitsEvent() public {
        _createQuiz();

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDeposited(QUIZ_ID, host, 0.5 ether);

        vm.prank(host);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    function test_RevertIf_AddToPool_NotHost() public {
        _createQuiz();
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.NotQuizHost.selector, QUIZ_ID, stranger)
        );
        vm.prank(stranger);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    function test_RevertIf_AddToPool_ZeroDeposit() public {
        _createQuiz();
        vm.expectRevert(QuizEscrow.ZeroDeposit.selector);
        vm.prank(host);
        escrow.addToRewardPool{value: 0}(QUIZ_ID);
    }

    function test_RevertIf_AddToPool_QuizNotActive() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        vm.expectRevert(abi.encodeWithSelector(QuizEscrow.QuizNotActive.selector, QUIZ_ID));
        vm.prank(host);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    function test_RevertIf_AddToPool_AlreadyDistributed() public {
        _createQuiz();
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());

        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.RewardsAlreadyDistributed.selector, QUIZ_ID)
        );
        vm.prank(host);
        escrow.addToRewardPool{value: 0.5 ether}(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // distributeRewards
    // ════════════════════════════════════════════════════════

    function test_DistributeRewards_ThreeWinners_CorrectSplit() public {
        _createQuiz();

        uint256 p1Before   = player1.balance;
        uint256 p2Before   = player2.balance;
        uint256 p3Before   = player3.balance;
        uint256 hostBefore = host.balance;

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());

        assertEq(player1.balance - p1Before, 0.5 ether);
        assertEq(player2.balance - p2Before, 0.3 ether);
        assertEq(player3.balance - p3Before, 0.2 ether);
        assertEq(host.balance, hostBefore); // no remainder
        assertEq(escrow.getContractBalance(), 0);
    }

    function test_DistributeRewards_TwoWinners_RemainderToHost() public {
        _createQuiz();

        uint256 hostBefore = host.balance;

        address payable[] memory winners = new address payable[](2);
        winners[0] = payable(player1);
        winners[1] = payable(player2);

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, winners);

        assertEq(player1.balance, 0.5 ether);
        assertEq(player2.balance, 0.3 ether);
        assertEq(host.balance - hostBefore, 0.2 ether); // 20% remainder
        assertEq(escrow.getContractBalance(), 0);
    }

    function test_DistributeRewards_OneWinner_RemainderToHost() public {
        _createQuiz();

        uint256 hostBefore = host.balance;

        address payable[] memory winners = new address payable[](1);
        winners[0] = payable(player1);

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, winners);

        assertEq(player1.balance, 0.5 ether);
        assertEq(host.balance - hostBefore, 0.5 ether); // 50% remainder
        assertEq(escrow.getContractBalance(), 0);
    }

    function test_DistributeRewards_UpdatesState() public {
        _createQuiz();

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());

        (, uint256 pool, bool active, bool distributed,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, 0);
        assertFalse(active);
        assertTrue(distributed);
    }

    function test_DistributeRewards_EmitsEvents() public {
        _createQuiz();

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDistributed(QUIZ_ID, player1, 0.5 ether, 1);
        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDistributed(QUIZ_ID, player2, 0.3 ether, 2);
        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.RewardDistributed(QUIZ_ID, player3, 0.2 ether, 3);

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());
    }

    function test_RevertIf_Distribute_NotHost() public {
        _createQuiz();
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.NotQuizHost.selector, QUIZ_ID, stranger)
        );
        vm.prank(stranger);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());
    }

    function test_RevertIf_Distribute_AlreadyDistributed() public {
        _createQuiz();
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());

        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.RewardsAlreadyDistributed.selector, QUIZ_ID)
        );
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());
    }

    function test_RevertIf_Distribute_NoWinners() public {
        _createQuiz();
        vm.expectRevert(QuizEscrow.NoWinners.selector);
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, new address payable[](0));
    }

    function test_RevertIf_Distribute_TooManyWinners() public {
        _createQuiz();

        address payable[] memory winners = new address payable[](4);
        for (uint256 i = 0; i < 4; ++i) {
            winners[i] = payable(makeAddr(string(abi.encodePacked("w", i))));
        }

        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.TooManyWinners.selector, 4, escrow.MAX_WINNERS())
        );
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, winners);
    }

    function test_RevertIf_Distribute_QuizNotActive() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        vm.expectRevert(abi.encodeWithSelector(QuizEscrow.QuizNotActive.selector, QUIZ_ID));
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());
    }

    function test_RevertIf_Distribute_WinnerRejectsEth() public {
        _createQuiz();

        RejectingWinner rejecter = new RejectingWinner();

        address payable[] memory winners = new address payable[](1);
        winners[0] = payable(address(rejecter));

        vm.expectRevert(
            abi.encodeWithSelector(
                QuizEscrow.TransferFailed.selector,
                address(rejecter),
                (REWARD_POOL * 5_000) / 10_000
            )
        );
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, winners);
    }

    // ─── Reentrancy Attack ───────────────────────────────────

    function test_Reentrancy_DistributeRewards_IsBlocked() public {
        _createQuiz();

        ReentrantWinner attacker = new ReentrantWinner(escrow, QUIZ_ID);

        address payable[] memory winners = new address payable[](1);
        winners[0] = payable(address(attacker));

        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, winners);

        assertTrue(attacker.attackTriggered(), "Attack should have been triggered");
        assertFalse(attacker.attackSucceeded(), "Reentrant call must not succeed");
        assertEq(escrow.getContractBalance(), 0);
    }

    // ════════════════════════════════════════════════════════
    // cancelQuiz
    // ════════════════════════════════════════════════════════

    function test_CancelQuiz_RefundsHost() public {
        _createQuiz();
        uint256 hostBefore = host.balance;

        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        assertEq(host.balance - hostBefore, REWARD_POOL);
        assertEq(escrow.getContractBalance(), 0);
    }

    function test_CancelQuiz_UpdatesState() public {
        _createQuiz();

        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        (, uint256 pool, bool active,,) = escrow.getQuizInfo(QUIZ_ID);
        assertEq(pool, 0);
        assertFalse(active);
    }

    function test_CancelQuiz_EmitsEvent() public {
        _createQuiz();

        vm.expectEmit(true, true, false, true);
        emit QuizEscrow.QuizCancelled(QUIZ_ID, host, REWARD_POOL);

        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);
    }

    function test_RevertIf_Cancel_NotHost() public {
        _createQuiz();
        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.NotQuizHost.selector, QUIZ_ID, stranger)
        );
        vm.prank(stranger);
        escrow.cancelQuiz(QUIZ_ID);
    }

    function test_RevertIf_Cancel_AlreadyCancelled() public {
        _createQuiz();
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);

        vm.expectRevert(abi.encodeWithSelector(QuizEscrow.QuizNotActive.selector, QUIZ_ID));
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);
    }

    function test_RevertIf_Cancel_AlreadyDistributed() public {
        _createQuiz();
        vm.prank(host);
        escrow.distributeRewards(QUIZ_ID, _threeWinners());

        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.RewardsAlreadyDistributed.selector, QUIZ_ID)
        );
        vm.prank(host);
        escrow.cancelQuiz(QUIZ_ID);
    }

    // ════════════════════════════════════════════════════════
    // updateRewardDistribution
    // ════════════════════════════════════════════════════════

    function test_UpdateRewardDistribution_Success() public {
        uint256[] memory newDist = new uint256[](3);
        newDist[0] = 6_000;
        newDist[1] = 3_000;
        newDist[2] = 1_000;

        vm.expectEmit(false, false, false, true);
        emit QuizEscrow.RewardDistributionUpdated(newDist);

        vm.prank(owner);
        escrow.updateRewardDistribution(newDist);

        assertEq(escrow.rewardDistribution(0), 6_000);
        assertEq(escrow.rewardDistribution(1), 3_000);
        assertEq(escrow.rewardDistribution(2), 1_000);
    }

    function test_RevertIf_UpdateDist_NotOwner() public {
        uint256[] memory newDist = new uint256[](3);
        newDist[0] = 6_000;
        newDist[1] = 3_000;
        newDist[2] = 1_000;

        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                stranger
            )
        );
        vm.prank(stranger);
        escrow.updateRewardDistribution(newDist);
    }

    function test_RevertIf_UpdateDist_DoesNotSumTo10000() public {
        uint256[] memory newDist = new uint256[](3);
        newDist[0] = 5_000;
        newDist[1] = 3_000;
        newDist[2] = 1_000; // total = 9000

        vm.expectRevert(
            abi.encodeWithSelector(QuizEscrow.InvalidDistribution.selector, 9_000, 10_000)
        );
        vm.prank(owner);
        escrow.updateRewardDistribution(newDist);
    }

    // ════════════════════════════════════════════════════════
    // transferOwnership (OZ Ownable)
    // ════════════════════════════════════════════════════════

    function test_TransferOwnership_Success() public {
        vm.prank(owner);
        escrow.transferOwnership(stranger);

        assertEq(escrow.owner(), stranger);
    }

    function test_RevertIf_TransferOwnership_NotOwner() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")),
                stranger
            )
        );
        vm.prank(stranger);
        escrow.transferOwnership(stranger);
    }

    function test_RevertIf_TransferOwnership_ZeroAddress() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableInvalidOwner(address)")),
                address(0)
            )
        );
        vm.prank(owner);
        escrow.transferOwnership(address(0));
    }

    // ════════════════════════════════════════════════════════
    // Fuzz Tests
    // ════════════════════════════════════════════════════════

    function testFuzz_CreateQuizAndDeposit(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(host, amount);

        bytes32 id = keccak256("fuzz-quiz");

        vm.prank(host);
        escrow.createQuizAndDeposit{value: amount}(id, "FUZZ01");

        (, uint256 pool,,,) = escrow.getQuizInfo(id);
        assertEq(pool, amount);
        assertEq(escrow.getContractBalance(), amount);
    }

    function testFuzz_DistributeRewards_ContractAlwaysEmpty(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(host, amount);

        bytes32 id = keccak256("fuzz-dist");
        vm.prank(host);
        escrow.createQuizAndDeposit{value: amount}(id, "FUZZ02");

        vm.prank(host);
        escrow.distributeRewards(id, _threeWinners());

        assertEq(escrow.getContractBalance(), 0);

        uint256 p1Share   = (amount * 5_000) / 10_000;
        uint256 p2Share   = (amount * 3_000) / 10_000;
        uint256 p3Share   = (amount * 2_000) / 10_000;
        uint256 remainder = amount - p1Share - p2Share - p3Share;

        assertEq(player1.balance, p1Share);
        assertEq(player2.balance, p2Share);
        assertEq(player3.balance, p3Share);
        assertEq(host.balance, remainder);
    }

    function testFuzz_CancelQuiz_FullRefund(uint256 amount) public {
        amount = bound(amount, 1, 100 ether);
        vm.deal(host, amount);

        bytes32 id = keccak256("fuzz-cancel");
        vm.prank(host);
        escrow.createQuizAndDeposit{value: amount}(id, "FUZZ03");

        uint256 hostAfterDeposit = host.balance;

        vm.prank(host);
        escrow.cancelQuiz(id);

        assertEq(host.balance - hostAfterDeposit, amount);
        assertEq(escrow.getContractBalance(), 0);
    }
}
