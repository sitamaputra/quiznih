export const SPIN_WHEEL_ABI = [
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
] as const;
