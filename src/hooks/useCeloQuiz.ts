/**
 * React hook for Celo on-chain interactions in Quiznih.
 * Provides deposit, distribute, cancel, and balance check functions.
 */

"use client";

import { useCallback, useState } from "react";
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  QUIZ_ESCROW_ADDRESS,
  QUIZ_ESCROW_ABI,
  ACTIVE_CHAIN,
  uuidToBytes32,
  getExplorerTxUrl,
  IS_TESTNET,
  parseCelo,
  formatCelo,
} from "@/lib/celo";

interface DepositResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

interface DistributeResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export function useCeloQuiz() {
  const { address, isConnected, chain } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
  });

  const { writeContractAsync } = useWriteContract();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * Create a quiz and deposit CELO reward pool
   */
  const createQuizAndDeposit = useCallback(
    async (quizId: string, roomCode: string, amountCelo: string): Promise<DepositResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsDepositing(true);
      try {
        const quizIdBytes = uuidToBytes32(quizId);
        const value = parseCelo(amountCelo);

        const txHash = await writeContractAsync({
          address: QUIZ_ESCROW_ADDRESS,
          abi: QUIZ_ESCROW_ABI,
          functionName: "createQuizAndDeposit",
          args: [quizIdBytes, roomCode],
          value,
          chain: ACTIVE_CHAIN,
        });

        // Refresh balance after tx
        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Deposit error:", err);
        if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
          return { success: false, error: "Transaction cancelled by user" };
        }
        return {
          success: false,
          error: err.shortMessage || err.message || "Deposit failed",
        };
      } finally {
        setIsDepositing(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Add more CELO to an existing quiz reward pool
   */
  const addToRewardPool = useCallback(
    async (quizId: string, amountCelo: string): Promise<DepositResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsDepositing(true);
      try {
        const quizIdBytes = uuidToBytes32(quizId);
        const value = parseCelo(amountCelo);

        const txHash = await writeContractAsync({
          address: QUIZ_ESCROW_ADDRESS,
          abi: QUIZ_ESCROW_ABI,
          functionName: "addToRewardPool",
          args: [quizIdBytes],
          value,
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Add to pool error:", err);
        return {
          success: false,
          error: err.shortMessage || err.message || "Failed to add to reward pool",
        };
      } finally {
        setIsDepositing(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Distribute rewards to quiz winners
   */
  const distributeRewards = useCallback(
    async (quizId: string, winners: string[]): Promise<DistributeResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsDistributing(true);
      try {
        const quizIdBytes = uuidToBytes32(quizId);

        const txHash = await writeContractAsync({
          address: QUIZ_ESCROW_ADDRESS,
          abi: QUIZ_ESCROW_ABI,
          functionName: "distributeRewards",
          args: [quizIdBytes, winners as `0x${string}`[]],
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Distribute error:", err);
        return {
          success: false,
          error: err.shortMessage || err.message || "Distribution failed",
        };
      } finally {
        setIsDistributing(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Cancel a quiz and refund the host
   */
  const cancelQuiz = useCallback(
    async (quizId: string): Promise<DistributeResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsCancelling(true);
      try {
        const quizIdBytes = uuidToBytes32(quizId);

        const txHash = await writeContractAsync({
          address: QUIZ_ESCROW_ADDRESS,
          abi: QUIZ_ESCROW_ABI,
          functionName: "cancelQuiz",
          args: [quizIdBytes],
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Cancel error:", err);
        return {
          success: false,
          error: err.shortMessage || err.message || "Cancel failed",
        };
      } finally {
        setIsCancelling(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  return {
    // State
    address,
    isConnected,
    balance: balanceData ? balanceData.formatted : null,
    balanceSymbol: balanceData?.symbol || "CELO",
    isTestnet: IS_TESTNET,
    chainName: chain?.name || ACTIVE_CHAIN.name,

    // Loading states
    isDepositing,
    isDistributing,
    isCancelling,

    // Actions
    createQuizAndDeposit,
    addToRewardPool,
    distributeRewards,
    cancelQuiz,
    refetchBalance,

    // Utils
    getExplorerTxUrl,
  };
}
