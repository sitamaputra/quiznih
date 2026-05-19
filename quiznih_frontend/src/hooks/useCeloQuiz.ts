/**
 * React hook for Celo on-chain interactions in Quiznih.
 * Provides deposit, distribute, cancel, and balance check functions.
 */

"use client";

import { useCallback, useState } from "react";
import { useAccount, useBalance, useWriteContract, useSwitchChain } from "wagmi";
import {
  QUIZ_ESCROW_ADDRESS,
  QUIZ_ESCROW_ABI,
  SPIN_WHEEL_ADDRESS,
  SPIN_WHEEL_ABI,
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

interface ClaimResult {
  success: boolean;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export function useCeloQuiz() {
  const { address, isConnected, chain } = useAccount();
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address,
    chainId: ACTIVE_CHAIN.id,
  });

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const ensureCorrectChain = async () => {
    if (chain?.id !== ACTIVE_CHAIN.id) {
      await switchChainAsync({ chainId: ACTIVE_CHAIN.id });
    }
  };

  const [isDepositing, setIsDepositing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClaimingSpin, setIsClaimingSpin] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);

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
        await ensureCorrectChain();
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
        await ensureCorrectChain();
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
   * Cancel a quiz and refund the host
   */
  const cancelQuiz = useCallback(
    async (quizId: string): Promise<ClaimResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsCancelling(true);
      try {
        await ensureCorrectChain();
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

  /**
   * Winner claims reward using backend-signed authorization.
   * No host involvement needed — winner calls this directly.
   */
  const claimReward = useCallback(
    async (quizId: string, amountWei: string, signature: `0x${string}`): Promise<ClaimResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsClaiming(true);
      try {
        await ensureCorrectChain();
        const quizIdBytes = uuidToBytes32(quizId);

        const txHash = await writeContractAsync({
          address: QUIZ_ESCROW_ADDRESS,
          abi: QUIZ_ESCROW_ABI,
          functionName: "claimReward",
          args: [quizIdBytes, BigInt(amountWei), signature],
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Claim error:", err);
        if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
          return { success: false, error: "Transaction cancelled by user" };
        }
        return {
          success: false,
          error: err.shortMessage || err.message || "Claim failed",
        };
      } finally {
        setIsClaiming(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Claim spin prize using backend-signed authorization.
   */
  const claimSpin = useCallback(
    async (sessionId: string, amountWei: string, signature: `0x${string}`): Promise<ClaimResult> => {
      if (!address || !isConnected) {
        return { success: false, error: "Wallet not connected" };
      }

      setIsClaimingSpin(true);
      try {
        await ensureCorrectChain();
        const sessionIdBytes = uuidToBytes32(sessionId);

        const txHash = await writeContractAsync({
          address: SPIN_WHEEL_ADDRESS,
          abi: SPIN_WHEEL_ABI,
          functionName: "claimSpin",
          args: [sessionIdBytes, BigInt(amountWei), signature],
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();

        return {
          success: true,
          txHash,
          explorerUrl: getExplorerTxUrl(txHash),
        };
      } catch (err: any) {
        console.error("Claim spin error:", err);
        if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
          return { success: false, error: "Transaction cancelled by user" };
        }
        return {
          success: false,
          error: err.shortMessage || err.message || "Claim spin failed",
        };
      } finally {
        setIsClaimingSpin(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Host creates a SpinWheel session and deposits prize pool.
   */
  const createSpinSession = useCallback(
    async (sessionId: string, amountCelo: string): Promise<ClaimResult> => {
      if (!address || !isConnected) return { success: false, error: "Wallet not connected" };

      setIsCreatingSession(true);
      try {
        await ensureCorrectChain();
        const sessionIdBytes = uuidToBytes32(sessionId);
        const value = parseCelo(amountCelo);

        const txHash = await writeContractAsync({
          address: SPIN_WHEEL_ADDRESS,
          abi: SPIN_WHEEL_ABI,
          functionName: "createSession",
          args: [sessionIdBytes],
          value,
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();
        return { success: true, txHash, explorerUrl: getExplorerTxUrl(txHash) };
      } catch (err: any) {
        if (err.message?.includes("User rejected") || err.message?.includes("denied"))
          return { success: false, error: "Transaction cancelled by user" };
        return { success: false, error: err.shortMessage || err.message || "Create session failed" };
      } finally {
        setIsCreatingSession(false);
      }
    },
    [address, isConnected, writeContractAsync, refetchBalance]
  );

  /**
   * Host closes a SpinWheel session and reclaims remaining pool.
   */
  const closeSpinSession = useCallback(
    async (sessionId: string): Promise<ClaimResult> => {
      if (!address || !isConnected) return { success: false, error: "Wallet not connected" };

      setIsClosingSession(true);
      try {
        await ensureCorrectChain();
        const sessionIdBytes = uuidToBytes32(sessionId);

        const txHash = await writeContractAsync({
          address: SPIN_WHEEL_ADDRESS,
          abi: SPIN_WHEEL_ABI,
          functionName: "closeSession",
          args: [sessionIdBytes],
          chain: ACTIVE_CHAIN,
        });

        await refetchBalance();
        return { success: true, txHash, explorerUrl: getExplorerTxUrl(txHash) };
      } catch (err: any) {
        if (err.message?.includes("User rejected") || err.message?.includes("denied"))
          return { success: false, error: "Transaction cancelled by user" };
        return { success: false, error: err.shortMessage || err.message || "Close session failed" };
      } finally {
        setIsClosingSession(false);
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
    isCancelling,
    isClaiming,
    isClaimingSpin,
    isCreatingSession,
    isClosingSession,

    // Actions
    createQuizAndDeposit,
    addToRewardPool,
    cancelQuiz,
    claimReward,
    claimSpin,
    createSpinSession,
    closeSpinSession,
    refetchBalance,

    // Utils
    getExplorerTxUrl,
  };
}
