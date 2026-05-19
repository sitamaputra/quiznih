/**
 * POST /api/quiz/finalize
 *
 * Dipanggil dari control room ketika host mengakhiri quiz.
 * Flow:
 *  1. Ambil top-3 dari leaderboard berdasarkan final_score
 *  2. Hitung reward amount masing-masing (50/30/20% dari pool)
 *  3. Sign setiap klaim dengan SIGNER_PRIVATE_KEY (backend wallet)
 *  4. Simpan signature + rank + amount ke tabel leaderboard
 *  5. Update status quiz → 'finished'
 *  6. Panggil finalizeQuiz() di smart contract via backend wallet
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createWalletClient,
  http,
  keccak256,
  encodePacked,
  parseEther,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ─── Helpers ────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

function uuidToBytes32(uuid: string): `0x${string}` {
  const cleaned = uuid.replace(/-/g, "");
  return `0x${cleaned.padEnd(64, "0")}` as `0x${string}`;
}

// Basis points for each rank: 50%, 30%, 20%
const REWARD_SPLITS_BPS = [5_000n, 3_000n, 2_000n];
const BASIS_POINTS = 10_000n;

// ─── POST Handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { quizId } = await req.json();

    if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
    }

    // ── Validate env ──
    const signerKey = process.env.SIGNER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_QUIZ_ESCROW_ADDRESS as Address;

    if (!signerKey || !contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json(
        { error: "Backend signer or contract not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabase();

    // ── 1. Fetch quiz ──
    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizErr || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (!quiz.reward_pool_amount || quiz.reward_pool_amount <= 0) {
      // No on-chain reward — just mark finished, skip signing
      await supabase.from("quizzes").update({ status: "finished" }).eq("id", quizId);
      return NextResponse.json({ success: true, winners: [] });
    }

    // ── 2. Fetch leaderboard (top 3 by score) ──
    const { data: leaderboard, error: lbErr } = await supabase
      .from("leaderboard")
      .select("user_wallet, final_score, claim_signature")
      .eq("quiz_id", quizId)
      .order("final_score", { ascending: false })
      .limit(3);

    // Signatures sudah ada — skip signing, tapi tetap coba finalize on-chain
    // (kalau sebelumnya on-chain gagal karena signer tidak punya gas)
    if (leaderboard && leaderboard[0]?.claim_signature) {
      let onChainFinalized = false;
      let onChainError: string | null = null;
      try {
        const privateKey = signerKey.startsWith("0x")
          ? (signerKey as `0x${string}`)
          : (`0x${signerKey}` as `0x${string}`);
        const account = privateKeyToAccount(privateKey);
        const { QUIZ_ESCROW_ABI } = await import("@/lib/abi/QuizEscrow");
        const { ACTIVE_CHAIN } = await import("@/lib/celo");
        const walletClient = createWalletClient({ account, chain: ACTIVE_CHAIN, transport: http() });
        const quizIdBytes32 = uuidToBytes32(quizId);
        await walletClient.writeContract({
          address: contractAddress,
          abi: QUIZ_ESCROW_ABI,
          functionName: "finalizeQuiz",
          args: [quizIdBytes32],
        });
        onChainFinalized = true;
      } catch (err: any) {
        const msg: string = err.shortMessage || err.message || "";
        if (msg.includes("QuizAlreadyFinalized")) {
          onChainFinalized = true;
        } else {
          onChainError = msg;
          console.error("retry finalizeQuiz on-chain failed:", msg);
        }
      }
      return NextResponse.json({ success: true, alreadyFinalized: true, onChainFinalized, onChainError, winners: [] });
    }

    if (lbErr || !leaderboard || leaderboard.length === 0) {
      return NextResponse.json({ error: "No participants found" }, { status: 400 });
    }

    // ── 3. Sign each winner's claim ──
    const privateKey = signerKey.startsWith("0x")
      ? (signerKey as `0x${string}`)
      : (`0x${signerKey}` as `0x${string}`);

    const account = privateKeyToAccount(privateKey);
    const quizIdBytes32 = uuidToBytes32(quizId);
    const { ACTIVE_CHAIN } = await import("@/lib/celo");
    const chainId = BigInt(ACTIVE_CHAIN.id);

    // Use bigint arithmetic to avoid float rounding errors.
    // reward_pool_amount is stored as CELO (float) in DB — convert to wei once.
    const totalPoolWei = parseEther(quiz.reward_pool_amount.toString());

    const winners = [];

    for (let i = 0; i < leaderboard.length; i++) {
      const winner = leaderboard[i];
      // For the last winner, give remainder to avoid dust from integer division
      const amountWei: bigint =
        i < leaderboard.length - 1
          ? (totalPoolWei * REWARD_SPLITS_BPS[i]) / BASIS_POINTS
          : totalPoolWei - winners.reduce((acc, w) => acc + BigInt(w.claim_amount_wei), 0n);

      // Hash: keccak256(chainId, quizId_bytes32, winnerAddress, amountWei, contractAddress)
      // Must match the contract's: keccak256(abi.encodePacked(block.chainid, quizId, msg.sender, amount, address(this)))
      const msgHash = keccak256(
        encodePacked(
          ["uint256", "bytes32", "address", "uint256", "address"],
          [chainId, quizIdBytes32, winner.user_wallet as Address, amountWei, contractAddress]
        )
      );

      // signMessage applies the "\x19Ethereum Signed Message:\n32" prefix
      // — matches Solidity's MessageHashUtils.toEthSignedMessageHash
      const signature = await account.signMessage({
        message: { raw: msgHash as `0x${string}` },
      });

      winners.push({
        user_wallet: winner.user_wallet,
        rank: i + 1,
        claim_signature: signature,
        claim_amount_wei: amountWei.toString(),
        reward_amount: Number(amountWei) / 1e18,
      });
    }

    // ── 4. Persist signatures to leaderboard ──
    for (const w of winners) {
      await supabase
        .from("leaderboard")
        .update({
          rank: w.rank,
          claim_signature: w.claim_signature,
          claim_amount_wei: w.claim_amount_wei,
          reward_amount: w.reward_amount,
        })
        .eq("quiz_id", quizId)
        .eq("user_wallet", w.user_wallet);
    }

    // ── 5. Update quiz status ──
    await supabase
      .from("quizzes")
      .update({ status: "finished" })
      .eq("id", quizId);

    // ── 6. Call finalizeQuiz() on-chain via backend wallet ──
    // This marks the contract as finalized so winners can claim
    let onChainFinalized = false;
    let onChainError: string | null = null;

    try {
      const { QUIZ_ESCROW_ABI } = await import("@/lib/abi/QuizEscrow");
      const { ACTIVE_CHAIN } = await import("@/lib/celo");

      const walletClient = createWalletClient({
        account,
        chain: ACTIVE_CHAIN,
        transport: http(),
      });

      await walletClient.writeContract({
        address: contractAddress,
        abi: QUIZ_ESCROW_ABI,
        functionName: "finalizeQuiz",
        args: [quizIdBytes32],
      });

      onChainFinalized = true;
    } catch (err: any) {
      const msg: string = err.shortMessage || err.message || "";
      // QuizAlreadyFinalized = sudah pernah di-finalize sebelumnya, bukan error sebenarnya
      if (msg.includes("QuizAlreadyFinalized")) {
        onChainFinalized = true;
      } else {
        onChainError = msg;
        console.error("finalizeQuiz on-chain failed:", msg);
      }
    }

    return NextResponse.json({
      success: true,
      onChainFinalized,
      onChainError,
      winners: winners.map((w) => ({ rank: w.rank, wallet: w.user_wallet })),
    });
  } catch (err: any) {
    console.error("Finalize error:", err);
    return NextResponse.json(
      { error: err.message || "Finalize failed" },
      { status: 500 }
    );
  }
}
