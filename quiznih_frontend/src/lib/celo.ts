/**
 * Celo blockchain configuration and utilities for Quiznih
 * Handles: chain config, contract ABI, explorer URLs
 */

import { createPublicClient, http, parseEther, formatEther, type Address, keccak256, toHex, defineChain } from "viem";
import { celo } from "viem/chains";
import { QUIZ_ESCROW_ABI } from "./abi/QuizEscrow";
import { SPIN_WHEEL_ABI } from "./abi/SpinWheel";
export { QUIZ_ESCROW_ABI, SPIN_WHEEL_ABI };

// ─── Celo Sepolia Testnet (viem belum include ini) ──────
export const celoSepolia = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://celo-sepolia.drpc.org"] },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://sepolia.celoscan.io" },
  },
  testnet: true,
});

// ─── Network Config ─────────────────────────────────────
export const IS_TESTNET = true; // Toggle untuk production
export const ACTIVE_CHAIN = IS_TESTNET ? celoSepolia : celo;
export const CHAIN_NAME = IS_TESTNET ? "Celo Sepolia" : "Celo";

export const QUIZ_ESCROW_ADDRESS: Address = (process.env.NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS as Address) || "0x0000000000000000000000000000000000000000";
export const SPIN_WHEEL_ADDRESS: Address = (process.env.NEXT_PUBLIC_SPIN_WHEEL_ADDRESS as Address) || "0x0000000000000000000000000000000000000000";

// ─── Public Client (read-only) ─────────────────────────
export const publicClient = createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http(),
});

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
    return `https://sepolia.celoscan.io/tx/${txHash}`;
  }
  return `https://celoscan.io/tx/${txHash}`;
}

/**
 * Get block explorer URL for an address
 */
export function getExplorerAddressUrl(address: string): string {
  if (IS_TESTNET) {
    return `https://sepolia.celoscan.io/address/${address}`;
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

export { parseEther, formatEther, celo };
