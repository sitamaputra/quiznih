// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QuizEscrow
 * @dev Smart contract for Quiznih quiz reward pools on Celo.
 *      Handles deposit of CELO into escrow and distributes
 *      rewards to top winners after quiz completion.
 */
contract QuizEscrow {
    // ─── State ──────────────────────────────────────────────
    address public owner;

    struct Quiz {
        address host;
        uint256 rewardPool;
        bool isActive;
        bool isDistributed;
        string roomCode;
    }

    mapping(bytes32 => Quiz) public quizzes;       // quizId => Quiz
    mapping(bytes32 => bool) public quizExists;     // prevent duplicates

    // Reward split: top 3 → 50%, 30%, 20%
    uint256[] public rewardDistribution;

    // ─── Events ─────────────────────────────────────────────
    event QuizCreated(bytes32 indexed quizId, address indexed host, string roomCode);
    event RewardDeposited(bytes32 indexed quizId, address indexed host, uint256 amount);
    event RewardDistributed(bytes32 indexed quizId, address indexed winner, uint256 amount, uint256 rank);
    event QuizCancelled(bytes32 indexed quizId, address indexed host, uint256 refundAmount);

    // ─── Modifiers ──────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyHost(bytes32 _quizId) {
        require(quizzes[_quizId].host == msg.sender, "Not quiz host");
        _;
    }

    // ─── Constructor ────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        // Default distribution: 50%, 30%, 20% (represented as basis points)
        rewardDistribution.push(5000);
        rewardDistribution.push(3000);
        rewardDistribution.push(2000);
    }

    // ─── External Functions ─────────────────────────────────

    /**
     * @dev Create a quiz and deposit CELO reward pool in one transaction.
     * @param _quizId Unique identifier (UUID hashed to bytes32)
     * @param _roomCode Human-readable room code
     */
    function createQuizAndDeposit(bytes32 _quizId, string calldata _roomCode) external payable {
        require(!quizExists[_quizId], "Quiz already exists");
        require(msg.value > 0, "Must deposit reward pool");

        quizzes[_quizId] = Quiz({
            host: msg.sender,
            rewardPool: msg.value,
            isActive: true,
            isDistributed: false,
            roomCode: _roomCode
        });
        quizExists[_quizId] = true;

        emit QuizCreated(_quizId, msg.sender, _roomCode);
        emit RewardDeposited(_quizId, msg.sender, msg.value);
    }

    /**
     * @dev Add more CELO to an existing quiz reward pool.
     * @param _quizId The quiz to top up
     */
    function addToRewardPool(bytes32 _quizId) external payable onlyHost(_quizId) {
        require(quizzes[_quizId].isActive, "Quiz not active");
        require(!quizzes[_quizId].isDistributed, "Already distributed");
        require(msg.value > 0, "Must send CELO");

        quizzes[_quizId].rewardPool += msg.value;
        emit RewardDeposited(_quizId, msg.sender, msg.value);
    }

    /**
     * @dev Distribute rewards to top winners. Only callable by quiz host.
     * @param _quizId The quiz
     * @param _winners Array of winner addresses (ordered: 1st, 2nd, 3rd)
     */
    function distributeRewards(
        bytes32 _quizId,
        address payable[] calldata _winners
    ) external onlyHost(_quizId) {
        Quiz storage quiz = quizzes[_quizId];
        require(quiz.isActive, "Quiz not active");
        require(!quiz.isDistributed, "Already distributed");
        require(_winners.length > 0, "No winners");
        require(_winners.length <= rewardDistribution.length, "Too many winners");

        uint256 totalPool = quiz.rewardPool;
        uint256 totalSent = 0;

        for (uint256 i = 0; i < _winners.length; i++) {
            uint256 amount = (totalPool * rewardDistribution[i]) / 10000;
            if (amount > 0) {
                (bool sent, ) = _winners[i].call{value: amount}("");
                require(sent, "Transfer failed");
                totalSent += amount;
                emit RewardDistributed(_quizId, _winners[i], amount, i + 1);
            }
        }

        // Any dust/remainder goes back to host
        uint256 remainder = totalPool - totalSent;
        if (remainder > 0) {
            (bool sent, ) = payable(quiz.host).call{value: remainder}("");
            require(sent, "Remainder transfer failed");
        }

        quiz.isDistributed = true;
        quiz.isActive = false;
    }

    /**
     * @dev Cancel a quiz and refund the host. Only callable by host.
     * @param _quizId The quiz to cancel
     */
    function cancelQuiz(bytes32 _quizId) external onlyHost(_quizId) {
        Quiz storage quiz = quizzes[_quizId];
        require(quiz.isActive, "Quiz not active");
        require(!quiz.isDistributed, "Already distributed");

        uint256 refund = quiz.rewardPool;
        quiz.rewardPool = 0;
        quiz.isActive = false;

        (bool sent, ) = payable(quiz.host).call{value: refund}("");
        require(sent, "Refund failed");

        emit QuizCancelled(_quizId, msg.sender, refund);
    }

    // ─── View Functions ─────────────────────────────────────

    function getQuizInfo(bytes32 _quizId) external view returns (
        address host,
        uint256 rewardPool,
        bool isActive,
        bool isDistributed,
        string memory roomCode
    ) {
        Quiz storage quiz = quizzes[_quizId];
        return (quiz.host, quiz.rewardPool, quiz.isActive, quiz.isDistributed, quiz.roomCode);
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─── Admin ──────────────────────────────────────────────

    function updateRewardDistribution(uint256[] calldata _newDistribution) external onlyOwner {
        uint256 total = 0;
        for (uint256 i = 0; i < _newDistribution.length; i++) {
            total += _newDistribution[i];
        }
        require(total == 10000, "Must equal 10000 basis points");
        
        delete rewardDistribution;
        for (uint256 i = 0; i < _newDistribution.length; i++) {
            rewardDistribution.push(_newDistribution[i]);
        }
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }

    // Accept plain CELO transfers
    receive() external payable {}
}
