/**
 * API Route: POST /api/quiz/deposit
 * Records a quiz reward pool deposit on Celo.
 * 
 * Flow:
 * 1. Receive quizId, hostWallet, amountCelo, and txHash from frontend
 * 2. Store the deposit info in Supabase
 * 3. The actual on-chain transaction is handled by the frontend via QuizEscrow contract
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, hostWallet, amountCelo, txHash, contractQuizId } = body;

    if (!quizId || !hostWallet || !amountCelo) {
      return NextResponse.json(
        { error: "Missing required fields: quizId, hostWallet, amountCelo" },
        { status: 400 }
      );
    }

    // Store deposit info in Supabase
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        reward_pool_amount: amountCelo,
        deposit_status: txHash ? "confirmed" : "pending",
        deposit_tx: txHash || null,
        contract_quiz_id: contractQuizId || null,
        escrow_balance: amountCelo,
      })
      .eq("id", quizId)
      .eq("host_wallet", hostWallet); // Ensure only host can update

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to store deposit info" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quizId,
      amountCelo,
      txHash,
      message: "Deposit recorded successfully",
    });
  } catch (err) {
    console.error("Deposit API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
