export const QUIZ_ESCROW_ABI = [
  // ─── Core Functions ──────────────────────────────────
  {
    type: "function",
    name: "createQuizAndDeposit",
    inputs: [
      { name: "quizId", type: "bytes32" },
      { name: "roomCode", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "addToRewardPool",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "distributeRewards",
    inputs: [
      { name: "quizId", type: "bytes32" },
      { name: "winners", type: "address[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelQuiz",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ─── View Functions ──────────────────────────────────
  {
    type: "function",
    name: "getQuizInfo",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [
      { name: "host", type: "address" },
      { name: "rewardPool", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "isDistributed", type: "bool" },
      { name: "roomCode", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getContractBalance",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "rewardDistribution",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  // ─── Owner Functions ─────────────────────────────────
  {
    type: "function",
    name: "updateRewardDistribution",
    inputs: [{ name: "newDistribution", type: "uint256[]" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // ─── UUPS ────────────────────────────────────────────
  {
    type: "function",
    name: "initialize",
    inputs: [{ name: "initialOwner", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "upgradeToAndCall",
    inputs: [
      { name: "newImplementation", type: "address" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  // ─── Events ──────────────────────────────────────────
  {
    type: "event",
    name: "QuizCreated",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "roomCode", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardDeposited",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardDistributed",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "rank", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "QuizCancelled",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "refundAmount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardDistributionUpdated",
    inputs: [
      { name: "newDistribution", type: "uint256[]", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true },
      { name: "newOwner", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      { name: "implementation", type: "address", indexed: true },
    ],
  },
] as const;
