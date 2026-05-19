export const SPIN_WHEEL_ABI = [
  // ─── Host Functions ───────────────────────────────────
  {
    type: "function",
    name: "createSession",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "closeSession",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── Player Functions ─────────────────────────────────
  {
    type: "function",
    name: "claimSpin",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "amount", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ─── View Functions ───────────────────────────────────
  {
    type: "function",
    name: "getSession",
    inputs: [{ name: "sessionId", type: "bytes32" }],
    outputs: [
      { name: "host", type: "address" },
      { name: "isActive", type: "bool" },
      { name: "isExpired", type: "bool" },
      { name: "prizePool", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasClaimed",
    inputs: [
      { name: "sessionId", type: "bytes32" },
      { name: "player", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
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

  // ─── Events ───────────────────────────────────────────
  {
    type: "event",
    name: "SessionCreated",
    inputs: [
      { name: "sessionId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "prizePool", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SpinClaimed",
    inputs: [
      { name: "sessionId", type: "bytes32", indexed: true },
      { name: "winner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SessionClosed",
    inputs: [
      { name: "sessionId", type: "bytes32", indexed: true },
      { name: "host", type: "address", indexed: true },
      { name: "refund", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SignerUpdated",
    inputs: [{ name: "newSigner", type: "address", indexed: true }],
  },

  // ─── Errors ───────────────────────────────────────────
  { type: "error", name: "SessionAlreadyExists", inputs: [{ name: "sessionId", type: "bytes32" }] },
  { type: "error", name: "SessionNotFound", inputs: [{ name: "sessionId", type: "bytes32" }] },
  { type: "error", name: "SessionNotActive", inputs: [{ name: "sessionId", type: "bytes32" }] },
  { type: "error", name: "AlreadyClaimed", inputs: [{ name: "sessionId", type: "bytes32" }, { name: "player", type: "address" }] },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "InvalidSigner", inputs: [] },
  { type: "error", name: "ZeroDeposit", inputs: [] },
  { type: "error", name: "ClaimExpired", inputs: [{ name: "sessionId", type: "bytes32" }] },
  { type: "error", name: "SessionNotExpired", inputs: [{ name: "sessionId", type: "bytes32" }] },
  { type: "error", name: "InsufficientPool", inputs: [{ name: "available", type: "uint256" }, { name: "requested", type: "uint256" }] },
  { type: "error", name: "TransferFailed", inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }] },
] as const;
