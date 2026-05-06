/**
 * API Route: POST /api/quiz/claim-reward
 * Records reward claims from quiz winners on Celo.
 * 
 * On Celo, rewards are distributed directly through the QuizEscrow smart contract
 * by the quiz host calling distributeRewards(). This API records the claim in the DB.
 * 
 * Flow:
 * 1. Verify the user is a winner (in leaderboard, eligible rank)
 * 2. Calculate reward amount based on rank
 * 3. Record the claim in Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Reward distribution: top 3 get 50%, 30%, 20% of pool
const REWARD_DISTRIBUTION = [0.5, 0.3, 0.2];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, userWallet, txHash } = body;

    if (!quizId || !userWallet) {
      return NextResponse.json(
        { error: "Missing required fields: quizId, userWallet" },
        { status: 400 }
      );
    }

    // 1. Get quiz info
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.deposit_status !== "confirmed") {
      return NextResponse.json(
        { error: "Reward pool not yet deposited" },
        { status: 400 }
      );
    }

    // 2. Check if user already claimed
    const { data: leaderboardEntry, error: lbError } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("quiz_id", quizId)
      .eq("user_wallet", userWallet)
      .single();

    if (lbError || !leaderboardEntry) {
      return NextResponse.json(
        { error: "You are not a participant of this quiz" },
        { status: 403 }
      );
    }

    if (leaderboardEntry.claimed_reward) {
      return NextResponse.json(
        { error: "Reward already claimed" },
        { status: 400 }
      );
    }

    // 3. Get all participants sorted by score to determine rank
    const { data: allParticipants, error: allError } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("quiz_id", quizId)
      .order("final_score", { ascending: false });

    if (allError || !allParticipants) {
      return NextResponse.json(
        { error: "Failed to fetch leaderboard" },
        { status: 500 }
      );
    }

    // 4. Determine user's rank (0-indexed)
    const userRank = allParticipants.findIndex(
      (p) => p.user_wallet === userWallet
    );

    if (userRank < 0 || userRank >= REWARD_DISTRIBUTION.length) {
      return NextResponse.json(
        {
          error: `Only top ${REWARD_DISTRIBUTION.length} players receive rewards. Your rank: #${userRank + 1}`,
        },
        { status: 400 }
      );
    }

    // 5. Calculate reward amount
    const rewardPool = quiz.reward_pool_amount || 0;
    const rewardPortion = REWARD_DISTRIBUTION[userRank];
    const rewardAmount = rewardPool * rewardPortion;

    if (rewardAmount <= 0) {
      return NextResponse.json(
        { error: "No reward to distribute" },
        { status: 400 }
      );
    }

    // 6. Mark reward as claimed in DB
    // On Celo, the actual transfer is done via the QuizEscrow contract's distributeRewards()
    await supabase
      .from("leaderboard")
      .update({
        claimed_reward: true,
        claim_tx: txHash || null,
        reward_amount: rewardAmount,
      })
      .eq("quiz_id", quizId)
      .eq("user_wallet", userWallet);

    return NextResponse.json({
      success: true,
      rewardAmount,
      rank: userRank + 1,
      txHash: txHash || null,
    });
  } catch (err: any) {
    console.error("Claim reward error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to record reward claim" },
      { status: 500 }
    );
  }
}
