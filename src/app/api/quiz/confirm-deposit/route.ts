/**
 * API Route: POST /api/quiz/confirm-deposit
 * Confirms that a CELO deposit has been made via the QuizEscrow contract.
 * 
 * Verifies the transaction hash and updates the quiz status.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { celoAlfajores, celo } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Use testnet or mainnet based on env
const IS_TESTNET = true;
const chain = IS_TESTNET ? celoAlfajores : celo;

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quizId, txHash } = body;

    if (!quizId || !txHash) {
      return NextResponse.json(
        { error: "Missing required fields: quizId, txHash" },
        { status: 400 }
      );
    }

    // 1. Verify transaction on-chain
    let receipt;
    try {
      receipt = await publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
    } catch (e) {
      return NextResponse.json(
        { error: "Transaction not found or not yet confirmed" },
        { status: 400 }
      );
    }

    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed on-chain" },
        { status: 400 }
      );
    }

    // 2. Update deposit status in Supabase
    const { error: updateError } = await supabase
      .from("quizzes")
      .update({
        deposit_status: "confirmed",
        deposit_tx: txHash,
      })
      .eq("id", quizId);

    if (updateError) {
      console.error("Update error:", updateError);
    }

    return NextResponse.json({
      success: true,
      confirmed: true,
      txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err) {
    console.error("Confirm deposit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
