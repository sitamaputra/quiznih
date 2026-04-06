/**
 * React hook for Solana on-chain interactions in Quiznih.
 * Provides deposit, claim, balance check, and airdrop functions.
 */

"use client";

import { useCallback, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getBalance, getExplorerUrl, requestAirdrop, NETWORK } from "@/lib/solana";

interface DepositResult {
  success: boolean;
  txSignature?: string;
  escrowAddress?: string;
  explorerUrl?: string;
  error?: string;
}

interface ClaimResult {
  success: boolean;
  rewardAmount?: number;
  rank?: number;
  txSignature?: string;
  explorerUrl?: string;
  error?: string;
}

export function useSolanaQuiz() {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const { connection } = useConnection();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  /**
   * Fetch wallet SOL balance
   */
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return 0;
    const bal = await getBalance(publicKey.toString());
    setBalance(bal);
    return bal;
  }, [publicKey]);

  /**
   * Full deposit flow:
   * 1. Call API to create escrow wallet
   * 2. Build SOL transfer transaction
   * 3. Sign & send via wallet adapter
   * 4. Confirm deposit on backend
   */
  const depositRewardPool = useCallback(
    async (quizId: string, amountSol: number): Promise<DepositResult> => {
      if (!publicKey || !sendTransaction) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsDepositing(true);
      try {
        // Step 1: Create escrow via API
        const depositRes = await fetch("/api/quiz/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            hostWallet: publicKey.toString(),
            amountSol,
          }),
        });

        const depositData = await depositRes.json();
        if (!depositRes.ok || !depositData.success) {
          return {
            success: false,
            error: depositData.error || "Failed to create escrow",
          };
        }

        const escrowPubkey = new PublicKey(depositData.escrowAddress);

        // Step 2: Build transaction
        const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: escrowPubkey,
            lamports,
          })
        );

        // Step 3: Send transaction via wallet adapter
        const signature = await sendTransaction(transaction, connection);

        // Step 4: Wait for confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          "confirmed"
        );

        // Step 5: Confirm on backend
        const confirmRes = await fetch("/api/quiz/confirm-deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            txSignature: signature,
          }),
        });

        const confirmData = await confirmRes.json();

        // Refresh balance
        await fetchBalance();

        return {
          success: true,
          txSignature: signature,
          escrowAddress: depositData.escrowAddress,
          explorerUrl: getExplorerUrl(signature),
        };
      } catch (err: any) {
        console.error("Deposit error:", err);

        // Handle user rejection
        if (err.message?.includes("User rejected")) {
          return { success: false, error: "Transaction cancelled by user" };
        }

        return {
          success: false,
          error: err.message || "Deposit failed",
        };
      } finally {
        setIsDepositing(false);
      }
    },
    [publicKey, sendTransaction, connection, fetchBalance]
  );

  /**
   * Claim reward for a quiz
   * Calls the server-side API which signs and sends the reward transaction
   */
  const claimReward = useCallback(
    async (quizId: string): Promise<ClaimResult> => {
      if (!publicKey) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsClaiming(true);
      try {
        const res = await fetch("/api/quiz/claim-reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId,
            userWallet: publicKey.toString(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          return {
            success: false,
            error: data.error || "Failed to claim reward",
          };
        }

        // Refresh balance
        await fetchBalance();

        return {
          success: true,
          rewardAmount: data.rewardAmount,
          rank: data.rank,
          txSignature: data.txSignature,
          explorerUrl: data.explorerUrl,
        };
      } catch (err: any) {
        console.error("Claim error:", err);
        return {
          success: false,
          error: err.message || "Claim failed",
        };
      } finally {
        setIsClaiming(false);
      }
    },
    [publicKey, fetchBalance]
  );

  /**
   * Request devnet airdrop for testing
   */
  const requestDevnetAirdrop = useCallback(
    async (amount: number = 1): Promise<boolean> => {
      if (!publicKey) return false;
      if (NETWORK !== "devnet") return false;

      setIsAirdropping(true);
      try {
        const sig = await requestAirdrop(publicKey.toString(), amount);
        if (sig) {
          await fetchBalance();
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        setIsAirdropping(false);
      }
    },
    [publicKey, fetchBalance]
  );

  return {
    // State
    balance,
    isDepositing,
    isClaiming,
    isAirdropping,
    isDevnet: NETWORK === "devnet",

    // Actions
    fetchBalance,
    depositRewardPool,
    claimReward,
    requestDevnetAirdrop,

    // Utils
    getExplorerUrl,
  };
}
