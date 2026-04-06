/**
 * API Route: POST /api/quiz/confirm-deposit
 * Confirms that a SOL deposit has been received in the escrow wallet.
 * 
 * Verifies the transaction on-chain and updates the quiz status.
 */

import { NextRequest, NextResponse } from "next/server";
import { confirmTransaction, getBalance } from "@/lib/solana";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, txSignature } = body;

    if (!quizId || !txSignature) {
      return NextResponse.json(
        { error: "Missing required fields: quizId, txSignature" },
        { status: 400 }
      );
    }

    // 1. Verify transaction on-chain
    const confirmed = await confirmTransaction(txSignature);
    if (!confirmed) {
      return NextResponse.json(
        { error: "Transaction not confirmed on-chain" },
        { status: 400 }
      );
    }

    // 2. Get quiz escrow info
    const { data: quiz, error: fetchError } = await supabase
      .from("quizzes")
      .select("escrow_pubkey, reward_pool_amount")
      .eq("id", quizId)
      .single();

    if (fetchError || !quiz) {
      return NextResponse.json(
        { error: "Quiz not found" },
        { status: 404 }
      );
    }

    // 3. Check escrow balance
    const balance = await getBalance(quiz.escrow_pubkey);

    // 4. Update deposit status
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        deposit_status: "confirmed",
        deposit_tx: txSignature,
        escrow_balance: balance,
      })
      .eq("id", quizId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      escrowBalance: balance,
      txSignature,
    });
  } catch (err) {
    console.error("Confirm deposit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
