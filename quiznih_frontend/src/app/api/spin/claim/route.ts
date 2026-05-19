/**
 * POST /api/spin/claim
 *
 * Gasless spin wheel claim — backend pays gas, CELO goes to player wallet.
 * Flow:
 *  1. Validasi session aktif & amount valid (dari wheel_config)
 *  2. Cek player belum pernah claim
 *  3. Sign: keccak256(chainId, sessionId, recipient, amount, contractAddress)
 *  4. Call claimSpinFor() on-chain — backend wallet pays gas
 *  5. Catat di spin_claims
 *  6. Return txHash
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createWalletClient,
  http,
  keccak256,
  encodePacked,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

function uuidToBytes32(uuid: string): `0x${string}` {
  return `0x${uuid.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, playerAddress, prizeAmountWei } = await req.json();

    if (!sessionId || !playerAddress || !prizeAmountWei) {
      return NextResponse.json(
        { error: "sessionId, playerAddress, prizeAmountWei required" },
        { status: 400 }
      );
    }

    const signerKey = process.env.SIGNER_PRIVATE_KEY!;
    const contractAddress = process.env.NEXT_PUBLIC_SPIN_WHEEL_ADDRESS as Address;

    if (!signerKey || !contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ error: "Signer or contract not configured" }, { status: 500 });
    }

    const supabase = getSupabase();

    // ── 1. Validasi session ──
    const { data: session, error } = await supabase
      .from("spin_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("is_active", true)
      .single();

    if (error || !session) {
      return NextResponse.json({ error: "Session not found or inactive" }, { status: 404 });
    }

    // ── 2. Validasi amount cocok dengan wheel_config ──
    const wheelConfig = session.wheel_config as Array<{ celoAmount?: number }> | null;
    if (wheelConfig && Array.isArray(wheelConfig)) {
      const validAmounts = wheelConfig
        .map(item => BigInt(Math.round((item.celoAmount ?? 0) * 1e18)))
        .filter(amt => amt > 0n);

      const requested = BigInt(prizeAmountWei);
      if (requested === 0n || !validAmounts.some(v => v === requested)) {
        return NextResponse.json({ error: "Invalid prize amount for this session" }, { status: 400 });
      }
    }

    // ── 3. Cek sudah pernah claim ──
    const { data: existing } = await supabase
      .from("spin_claims")
      .select("id, claimed_onchain")
      .eq("session_id", sessionId)
      .eq("player_address", playerAddress.toLowerCase())
      .maybeSingle();

    if (existing?.claimed_onchain) {
      return NextResponse.json({ error: "Already claimed for this session" }, { status: 400 });
    }

    const { ACTIVE_CHAIN } = await import("@/lib/celo");
    const { SPIN_WHEEL_ABI } = await import("@/lib/abi/SpinWheel");

    const chainId = BigInt(ACTIVE_CHAIN.id);
    const sessionIdBytes32 = uuidToBytes32(sessionId);
    const amount = BigInt(prizeAmountWei);
    const recipient = playerAddress as Address;

    const privateKey = signerKey.startsWith("0x")
      ? (signerKey as `0x${string}`)
      : (`0x${signerKey}` as `0x${string}`);

    const account = privateKeyToAccount(privateKey);

    // ── 4. Sign (recipient bukan msg.sender) ──
    const msgHash = keccak256(
      encodePacked(
        ["uint256", "bytes32", "address", "uint256", "address"],
        [chainId, sessionIdBytes32, recipient, amount, contractAddress]
      )
    );
    const signature = await account.signMessage({
      message: { raw: msgHash as `0x${string}` },
    });

    // ── 5. Eksekusi claimSpinFor on-chain (backend bayar gas) ──
    const walletClient = createWalletClient({
      account,
      chain: ACTIVE_CHAIN,
      transport: http(),
    });

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: SPIN_WHEEL_ABI,
      functionName: "claimSpinFor",
      args: [sessionIdBytes32, amount, recipient, signature],
    });

    // ── 6. Catat di DB ──
    if (existing) {
      await supabase
        .from("spin_claims")
        .update({ claimed_onchain: true, tx_hash: txHash })
        .eq("id", existing.id);
    } else {
      await supabase.from("spin_claims").insert({
        session_id: sessionId,
        player_address: playerAddress.toLowerCase(),
        amount_wei: prizeAmountWei,
        signature,
        claimed_onchain: true,
        tx_hash: txHash,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, txHash });
  } catch (err: any) {
    console.error("Gasless spin claim error:", err);
    const msg: string = err.shortMessage || err.message || "Claim failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
