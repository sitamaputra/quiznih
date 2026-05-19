export const QUIZ_ESCROW_ABI = [
  // ─── Host Functions ───────────────────────────────────
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
    name: "cancelQuiz",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reclaimExpiredFunds",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── Backend Signer Functions ─────────────────────────
  {
    type: "function",
    name: "finalizeQuiz",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── Winner Functions ─────────────────────────────────
  {
    type: "function",
    name: "claimReward",
    inputs: [
      { name: "quizId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── View Functions ───────────────────────────────────
  {
    type: "function",
    name: "getQuizInfo",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [
      { name: "host", type: "address" },
      { name: "rewardPool", type: "uint256" },
      { name: "isActive", type: "bool" },
      { name: "isFinalized", type: "bool" },
      { name: "roomCode", type: "string" },
      { name: "deadline", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { name: "quizId", type: "bytes32" },
      { name: "winner", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimDeadline",
    inputs: [{ name: "quizId", type: "bytes32" }],
    outputs: [{ name: "deadline", type: "uint256" }],
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
    name: "trustedSigner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },

  // ─── Admin Functions ──────────────────────────────────
  {
    type: "function",
    name: "setSigner",
    inputs: [{ name: "_signer", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateRewardDistribution",
    inputs: [{ name: "newDistribution", type: "uint256[]" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── Events ───────────────────────────────────────────
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
    name: "QuizFinalized",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "deadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardClaimed",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
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
    name: "ExpiredFundsReclaimed",
    inputs: [
      { name: "quizId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SignerUpdated",
    inputs: [{ name: "newSigner", type: "address", indexed: true }],
  },

  // ─── Errors ───────────────────────────────────────────
  { type: "error", name: "QuizAlreadyExists", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "QuizNotFound", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "QuizNotActive", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "QuizNotFinalized", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "QuizAlreadyFinalized", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "AlreadyClaimed", inputs: [{ name: "quizId", type: "bytes32" }, { name: "winner", type: "address" }] },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "InvalidSigner", inputs: [] },
  { type: "error", name: "ZeroDeposit", inputs: [] },
  { type: "error", name: "ClaimExpired", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "ClaimNotExpired", inputs: [{ name: "quizId", type: "bytes32" }] },
  { type: "error", name: "InsufficientPool", inputs: [{ name: "available", type: "uint256" }, { name: "requested", type: "uint256" }] },
  { type: "error", name: "TransferFailed", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }] },
  { type: "error", name: "InvalidDistribution", inputs: [{ name: "total", type: "uint256" }, { name: "required", type: "uint256" }] },
] as const;
