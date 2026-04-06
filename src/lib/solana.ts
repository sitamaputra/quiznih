/**
 * Solana on-chain utility functions for Quiznih
 * Handles: reward pool deposits, SOL transfers, balance checks
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  TransactionSignature,
  Keypair,
} from "@solana/web3.js";

// Network configuration
const NETWORK = "devnet"; // Change to 'mainnet-beta' for production
const ENDPOINT = clusterApiUrl(NETWORK);
const connection = new Connection(ENDPOINT, "confirmed");

// Escrow wallet for quiz reward pools
// In production, use a proper PDA or multisig
// For now, we use a deterministic derivation from quiz ID
const PROGRAM_SEED = "quiznih-escrow-v1";

/**
 * Get the Solana connection instance
 */
export function getConnection(): Connection {
  return connection;
}

/**
 * Get SOL balance of a wallet
 */
export async function getBalance(walletAddress: string): Promise<number> {
  try {
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (err) {
    console.error("Error fetching balance:", err);
    return 0;
  }
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Create a transaction to deposit SOL into the escrow wallet for a quiz reward pool.
 * The escrow wallet address is stored in Supabase alongside the quiz.
 * Returns unsigned transaction that needs to be signed by the sender's wallet adapter.
 */
export async function createDepositTransaction(
  senderPubkey: PublicKey,
  escrowPubkey: PublicKey,
  amountSol: number
): Promise<Transaction> {
  const lamports = solToLamports(amountSol);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: senderPubkey,
      toPubkey: escrowPubkey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = senderPubkey;

  return transaction;
}

/**
 * Create a transaction to distribute rewards from escrow to winner.
 * This is intended to be signed server-side using the escrow keypair.
 */
export async function createDistributeTransaction(
  escrowPubkey: PublicKey,
  winnerPubkey: PublicKey,
  amountSol: number
): Promise<Transaction> {
  const lamports = solToLamports(amountSol);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: escrowPubkey,
      toPubkey: winnerPubkey,
      lamports,
    })
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.lastValidBlockHeight = lastValidBlockHeight;
  transaction.feePayer = escrowPubkey;

  return transaction;
}

/**
 * Verify a transaction was confirmed on-chain
 */
export async function confirmTransaction(
  signature: TransactionSignature
): Promise<boolean> {
  try {
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    return !confirmation.value.err;
  } catch (err) {
    console.error("Error confirming transaction:", err);
    return false;
  }
}

/**
 * Get transaction details for display
 */
export function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${NETWORK}`;
}

/**
 * Get wallet explorer URL
 */
export function getWalletExplorerUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${NETWORK}`;
}

/**
 * Generate a new escrow keypair for a quiz
 * The secret key should be stored securely (in Supabase encrypted column or server env)
 */
export function generateEscrowKeypair(): {
  publicKey: string;
  secretKey: string; // base64 encoded
} {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Buffer.from(keypair.secretKey).toString("base64"),
  };
}

/**
 * Reconstruct keypair from base64 secret key
 */
export function keypairFromSecret(secretKeyBase64: string): Keypair {
  const secretKey = Buffer.from(secretKeyBase64, "base64");
  return Keypair.fromSecretKey(new Uint8Array(secretKey));
}

/**
 * Request SOL airdrop on devnet (for testing)
 */
export async function requestAirdrop(
  walletAddress: string,
  amountSol: number = 1
): Promise<string | null> {
  if (NETWORK !== "devnet") {
    console.warn("Airdrop only available on devnet");
    return null;
  }
  try {
    const pubkey = new PublicKey(walletAddress);
    const signature = await connection.requestAirdrop(
      pubkey,
      solToLamports(amountSol)
    );
    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  } catch (err) {
    console.error("Airdrop failed:", err);
    return null;
  }
}

export { NETWORK, ENDPOINT, LAMPORTS_PER_SOL };
