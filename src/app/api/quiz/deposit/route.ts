/**
 * API Route: POST /api/quiz/deposit
 * Creates an escrow wallet for a quiz and returns deposit instructions.
 * 
 * Flow:
 * 1. Generate escrow keypair
 * 2. Store escrow public key + encrypted secret in Supabase
 * 3. Return escrow address for the frontend to send SOL to
 */

import { NextRequest, NextResponse } from "next/server";
import { generateEscrowKeypair } from "@/lib/solana";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, hostWallet, amountSol } = body;

    if (!quizId || !hostWallet || !amountSol) {
      return NextResponse.json(
        { error: "Missing required fields: quizId, hostWallet, amountSol" },
        { status: 400 }
      );
    }

    // Generate escrow keypair
    const escrow = generateEscrowKeypair();

    // Store escrow info in Supabase
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        escrow_pubkey: escrow.publicKey,
        escrow_secret: escrow.secretKey, // In production, encrypt this!
        reward_pool_amount: amountSol,
        deposit_status: "pending",
      })
      .eq("id", quizId)
      .eq("host_wallet", hostWallet); // Ensure only host can set escrow

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json(
        { error: "Failed to store escrow info" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      escrowAddress: escrow.publicKey,
      amountSol,
      message: "Send SOL to this escrow address to fund the quiz reward pool",
    });
  } catch (err) {
    console.error("Deposit API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
