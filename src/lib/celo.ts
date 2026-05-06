/**
 * Celo blockchain configuration and utilities for Quiznih
 * Handles: chain config, contract ABI, explorer URLs
 */

import { createPublicClient, http, parseEther, formatEther, type Address, keccak256, toHex } from "viem";
import { celo, celoAlfajores } from "viem/chains";

// ─── Network Config ─────────────────────────────────────
// Use Alfajores for dev, Celo mainnet for production
export const IS_TESTNET = true; // Toggle for production
export const ACTIVE_CHAIN = IS_TESTNET ? celoAlfajores : celo;
export const CHAIN_NAME = IS_TESTNET ? "Celo Alfajores" : "Celo";

// QuizEscrow contract address (deploy & update this)
export const QUIZ_ESCROW_ADDRESS: Address = (process.env.NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS as Address) || "0x0000000000000000000000000000000000000000";

// ─── Public Client (read-only) ─────────────────────────
export const publicClient = createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http(),
});

// ─── Contract ABI ──────────────────────────────────────
export const QUIZ_ESCROW_ABI = [
  {
    type: "function",
    name: "createQuizAndDeposit",
    inputs: [
      { name: "_quizId", type: "bytes32" },
      { name: "_roomCode", type: "string" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "addToRewardPool",
    inputs: [{ name: "_quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "distributeRewards",
    inputs: [
      { name: "_quizId", type: "bytes32" },
      { name: "_winners", type: "address[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelQuiz",
    inputs: [{ name: "_quizId", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getQuizInfo",
    inputs: [{ name: "_quizId", type: "bytes32" }],
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
] as const;

// ─── Utility Functions ─────────────────────────────────

/**
 * Convert UUID string to bytes32 for smart contract usage
 */
export function uuidToBytes32(uuid: string): `0x${string}` {
  // Remove dashes and pad to 32 bytes
  const cleaned = uuid.replace(/-/g, "");
  return `0x${cleaned.padEnd(64, "0")}` as `0x${string}`;
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  if (IS_TESTNET) {
    return `https://alfajores.celoscan.io/tx/${txHash}`;
  }
  return `https://celoscan.io/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  if (IS_TESTNET) {
    return `https://alfajores.celoscan.io/address/${address}`;
  }
  return `https://celoscan.io/address/${address}`;
}

/**
 * Format CELO amount for display
 */
export function formatCelo(wei: bigint): string {
  return formatEther(wei);
}

/**
 * Parse CELO amount from string to wei
 */
export function parseCelo(amount: string): bigint {
  return parseEther(amount);
}

/**
 * Get CELO balance for an address
 */
export async function getBalance(address: string): Promise<string> {
  try {
    const balance = await publicClient.getBalance({
      address: address as Address,
    });
    return formatEther(balance);
  } catch (err) {
    console.error("Error fetching balance:", err);
    return "0";
  }
}

/**
 * Check if the current environment is MiniPay
 */
export function isMiniPayEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isMiniPay;
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export { parseEther, formatEther, celo, celoAlfajores };
