/**
 * POST /api/spin/session
 * Simpan session ke DB pakai service role key (anon key tidak bisa INSERT karena RLS).
 * Dipanggil dari frontend setelah on-chain createSession() berhasil.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, hostAddress, prizePool, wheelConfig, txHash } = await req.json();

    if (!sessionId || !hostAddress || !prizePool) {
      return NextResponse.json({ error: "sessionId, hostAddress, prizePool required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase.from("spin_sessions").insert({
      id: sessionId,
      host_address: hostAddress.toLowerCase(),
      prize_pool: parseFloat(prizePool),
      prize_per_spin: 0,
      wheel_config: wheelConfig ?? null,
      is_active: true,
      contract_session_id: sessionId,
      tx_hash: txHash ?? null,
    });

    if (error) {
      console.error("spin session insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("spin session error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/spin/session
 * Tutup session (set is_active = false). Juga pakai service role.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const supabase = getSupabase();

    const { error } = await supabase
      .from("spin_sessions")
      .update({ is_active: false, closed_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
