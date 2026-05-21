import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoAlfajores } from "viem/chains";
import { defineChain } from "viem";
import * as dotenv from "dotenv";

dotenv.config();

// ─── Toggle Mainnet / Testnet ─────────────────────────────────────────────────

export const IS_MAINNET = process.env.IS_MAINNET === "true";

const CELO_SEPOLIA = defineChain({
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://celo-sepolia.drpc.org"] } },
});

export const CHAIN = IS_MAINNET ? celo : CELO_SEPOLIA;

// ─── Env ──────────────────────────────────────────────────────────────────────

export const SPIN_WHEEL_ADDRESS = process.env.SPIN_WHEEL_PROXY_ADDRESS as Address;

const rawKey = process.env.PRIVATE_KEY ?? "";
export const BACKEND_PRIVATE_KEY = (
  rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`
) as `0x${string}`;


// ─── Bot settings ─────────────────────────────────────────────────────────────

export const POOL_PER_SESSION   = "0.5";    // CELO deposit per session
export const SPINS_PER_SESSION  = 5;        // jumlah wallet per session
export const GAS_SEED_PER_WALLET = "0.06";  // CELO seed ke tiap generated wallet
export const GAS_RESERVE        = "0.02";   // sisa gas buat send back
export const ROUNDS             = 3;        // berapa kali session dibuka

export const WHEEL_CONFIG = [
  { label: "Jackpot",   celoAmount: 0.1  },
  { label: "Mini",      celoAmount: 0.05 },
  { label: "Micro",     celoAmount: 0.01 },
  { label: "Coba Lagi", celoAmount: 0    },
];

// ─── Clients ──────────────────────────────────────────────────────────────────

export const backendAccount = privateKeyToAccount(BACKEND_PRIVATE_KEY);

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

export const backendClient = createWalletClient({
  account: backendAccount,
  chain: CHAIN,
  transport: http(),
});
