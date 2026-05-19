/**
 * POST /api/spin/request
 *
 * Dipanggil oleh player (atau bot) setelah wheel berhenti.
 * Flow:
 *  1. Validasi session masih aktif di DB
 *  2. Tentukan prize amount berdasarkan hasil spin
 *  3. Sign: keccak256(chainId, sessionId, playerAddress, amount, contractAddress)
 *  4. Return signature → player call claimSpin() di contract
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { keccak256, encodePacked, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

function uuidToBytes32(uuid: string): `0x${string}` {
  return `0x${uuid.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerAddress, prizeAmountWei } = await req.json();

    if (!sessionId || !playerAddress || !prizeAmountWei) {
      return NextResponse.json({ error: "sessionId, playerAddress, prizeAmountWei required" }, { status: 400 });
    }

    const signerKey      = process.env.SIGNER_PRIVATE_KEY!;
    const contractAddress = process.env.NEXT_PUBLIC_SPIN_WHEEL_ADDRESS as Address;

    if (!signerKey || !contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "Signer or contract not configured" }, { status: 500 });
    }

    const supabase = getSupabase();

    // Validasi session aktif
    const { data: session, error } = await supabase
      .from("spin_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("is_active", true)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 });
    }

    // Validasi prizeAmountWei cocok dengan salah satu irisan di wheel_config
    const wheelConfig = session.wheel_config as Array<{ celoAmount?: number }> | null;
    if (wheelConfig && Array.isArray(wheelConfig)) {
      const validAmountsWei = wheelConfig
        .map(item => BigInt(Math.round((item.celoAmount ?? 0) * 1e18)))
        .filter(amt => amt > 0n);

      const requestedAmount = BigInt(prizeAmountWei);
      if (requestedAmount === 0n || !validAmountsWei.some(v => v === requestedAmount)) {
        return NextResponse.json({ error: "Prize amount tidak valid untuk session ini" }, { status: 400 });
      }
    }

    // Cek apakah player sudah pernah spin di session ini
    const { data: existing } = await supabase
      .from("spin_claims")
      .select("id")
      .eq("session_id", sessionId)
      .eq("player_address", playerAddress.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already claimed for this session" }, { status: 400 });
    }

    const { ACTIVE_CHAIN } = await import("@/lib/celo");
    const chainId    = BigInt(ACTIVE_CHAIN.id);
    const sessionIdBytes32 = uuidToBytes32(sessionId);
    const amount     = BigInt(prizeAmountWei);

    const privateKey = signerKey.startsWith("0x")
      ? (signerKey as `0x${string}`)
      : (`0x${signerKey}` as `0x${string}`);

    const account = privateKeyToAccount(privateKey);

    const msgHash = keccak256(
      encodePacked(
        ["uint256", "bytes32", "address", "uint256", "address"],
        [chainId, sessionIdBytes32, playerAddress as Address, amount, contractAddress]
      )
    );

    const signature = await account.signMessage({
      message: { raw: msgHash as `0x${string}` },
    });

    // Catat di DB supaya bisa track activity
    await supabase.from("spin_claims").insert({
      session_id:     sessionId,
      player_address: playerAddress.toLowerCase(),
      amount_wei:     prizeAmountWei,
      signature,
      claimed_onchain: false,
      created_at:     new Date().toISOString(),
    });

    return NextResponse.json({ success: true, signature, amountWei: prizeAmountWei });
  } catch (err: any) {
    console.error("Spin request error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
