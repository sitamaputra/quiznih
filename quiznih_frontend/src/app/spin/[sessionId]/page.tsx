"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Loader2, CheckCircle2, Gift, Sparkles, RotateCcw, Zap, AlertCircle, Trophy, ExternalLink } from "lucide-react";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { useCeloQuiz } from "@/hooks/useCeloQuiz";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import TopBar from "@/components/layout/TopBar";

const WHEEL_COLORS = ["#35D07F","#FCFF52","#60A5FA","#F472B6","#A78BFA","#F59E0B","#EF4444","#10B981","#8B5CF6","#EC4899","#06B6D4","#F97316"];

interface WheelItem { id: number; label: string; color: string; emoji: string; celoAmount?: number; }
interface Session { id: string; host_address: string; prize_pool: number; is_active: boolean; wheel_config: WheelItem[] | null; }

export default function PlayerSpinPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { claimSpin: claimSpinOnChain, isClaimingSpin } = useCeloQuiz();

  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<WheelItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Spin state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Claim state
  const [winnerCeloAmount, setWinnerCeloAmount] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const [claimDone, setClaimDone] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Load session dari Supabase
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("spin_sessions")
        .select("id, host_address, prize_pool, is_active, wheel_config")
        .eq("id", sessionId)
        .single();

      if (error || !data) { setLoadError("Session not found."); setIsLoading(false); return; }
      if (!data.is_active) { setLoadError("This session has been closed by the host."); setIsLoading(false); return; }

      setSession(data as Session);
      const cfg = (data.wheel_config as WheelItem[]) || [];
      setItems(cfg.length > 0 ? cfg : []);
      setIsLoading(false);
    };
    load();
  }, [sessionId]);

  // Cek apakah wallet ini sudah pernah claim di session ini
  useEffect(() => {
    if (!address || !sessionId) return;
    const check = async () => {
      const { data } = await supabase
        .from("spin_claims")
        .select("id, claimed_onchain")
        .eq("session_id", sessionId)
        .eq("player_address", address.toLowerCase())
        .maybeSingle();
      if (data) setAlreadyClaimed(true);
    };
    check();
  }, [address, sessionId]);

  // Draw wheel
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width, center = size / 2, radius = center - 12;
    const sliceAngle = (2 * Math.PI) / items.length;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.shadowColor = "rgba(53,208,127,0.3)";
    ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(center, center, radius, 0, 2 * Math.PI); ctx.fill();
    ctx.restore();

    items.forEach((item, i) => {
      const sa = i * sliceAngle, ea = sa + sliceAngle;
      ctx.beginPath(); ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sa, ea); ctx.closePath();
      ctx.fillStyle = item.color; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 2; ctx.stroke();

      ctx.save(); ctx.translate(center, center);
      ctx.rotate(sa + sliceAngle / 2); ctx.textAlign = "center";
      const fs = Math.max(13, 26 - items.length);
      ctx.font = `bold ${fs}px 'Outfit', sans-serif`;
      const tr = radius * 0.58;
      ctx.fillStyle = "#000";
      ctx.fillText(item.emoji, tr, -12);
      ctx.font = `bold ${Math.max(10, fs - 4)}px 'Outfit', sans-serif`;
      const lbl = item.label.length > 12 ? item.label.slice(0, 11) + "…" : item.label;
      ctx.fillText(lbl, tr, 8);
      // Tampilkan celoAmount di irisan jika ada
      if ((item.celoAmount ?? 0) > 0) {
        ctx.font = `bold ${Math.max(9, fs - 6)}px 'Outfit', sans-serif`;
        ctx.fillStyle = "#1a1a1a";
        ctx.fillText(`${item.celoAmount}⬡`, tr, 22);
      }
      ctx.restore();
    });

    ctx.beginPath(); ctx.arc(center, center, 38, 0, 2 * Math.PI);
    ctx.fillStyle = "#0A0A0A"; ctx.fill();
    ctx.strokeStyle = "#35D07F"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#35D07F"; ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  }, [items]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  // Countdown
  useEffect(() => {
    if (!isSpinning || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSpinning, countdown]);

  const spin = () => {
    if (isSpinning || items.length < 2 || hasSpun) return;
    setIsSpinning(true); setShowResult(false); setWinner(null);
    setCountdown(5);

    const winIdx = Math.floor(Math.random() * items.length);
    const sliceAng = 360 / items.length;
    const target = 360 - (winIdx * sliceAng + sliceAng / 2);
    setRotation(prev => prev + 8 * 360 + target);

    setTimeout(() => {
      setIsSpinning(false); setCountdown(0);
      const w = items[winIdx];
      setWinner(w); setShowResult(true); setHasSpun(true);
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.45 }, colors: ["#35D07F", "#FCFF52", "#A78BFA"] });
      setWinnerCeloAmount(w.celoAmount ?? 0);
    }, 5000);
  };

  const handleClaim = async () => {
    if (!sessionId || !address || winnerCeloAmount <= 0) return;
    setIsSigning(true); setClaimError(null);
    try {
      const prizeWei = BigInt(Math.round(winnerCeloAmount * 1e18)).toString();
      // Minta signature dari backend
      const res = await fetch("/api/spin/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, playerAddress: address, prizeAmountWei: prizeWei }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get signature");

      // User call claimSpin() dari wallet mereka sendiri (user bayar gas)
      const result = await claimSpinOnChain(sessionId, prizeWei, data.signature as `0x${string}`);
      if (!result.success) throw new Error(result.error || "Claim failed");

      setClaimTxHash(result.txHash ?? null);
      setClaimDone(true);
      setAlreadyClaimed(true);
      confetti({ particleCount: 250, spread: 100, colors: ["#35D07F", "#FCFF52", "#a78bfa"] });
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setIsSigning(false);
    }
  };

  const transStyle = isSpinning ? `transform 5s cubic-bezier(0.17,0.67,0.12,0.99)` : "none";

  // ── Loading / Error ──
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#e8fdf2' }}>
        <TopBar backHref="/dashboard" />
        <div className="flex flex-col items-center gap-4 mt-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#35D07F]" />
          <p className="text-[#4a6357] font-semibold">Loading session...</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#e8fdf2' }}>
        <TopBar backHref="/dashboard" />
        <div className="flex flex-col items-center gap-4 mt-20 text-center px-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-xl font-bold text-[#0a1a0f]">{loadError}</p>
          <p className="text-sm text-[#4a6357]">Double-check the link you received from the host.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full text-[#0a1a0f]" style={{ background: '#e8fdf2' }}>
      {/* Glow orbs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '5%', top: '10%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(167,139,250,0.10)', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', right: '0%', bottom: '10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(252,255,82,0.12)', filter: 'blur(100px)' }} />
      </div>

      <TopBar backHref="/dashboard" />

      <div className="max-w-2xl mx-auto px-4 pt-20 pb-24 flex flex-col items-center gap-8" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.3)', color: '#7c3aed', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
            🎡 Spin & Win CELO
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: '#0a1a0f', margin: '0 0 8px' }}>
            Spin the Wheel!
          </h1>
          <p style={{ fontSize: 14, color: '#4a6357' }}>
            Pool: <strong>{session?.prize_pool} CELO</strong> · {items.filter(i => (i.celoAmount ?? 0) > 0).length} rewarded slices
          </p>
        </motion.div>

        {/* Wallet connect */}
        {!isConnected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: '100%', padding: '16px 20px', borderRadius: 16, background: '#fff', border: '1.5px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0f', marginBottom: 2 }}>Connect your wallet first</p>
              <p style={{ fontSize: 12, color: '#4a6357' }}>Required to spin & claim your reward</p>
            </div>
            <button onClick={() => connect({ connector: connectors[0] })}
              style={{ padding: '10px 18px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
              <Wallet style={{ width: 15, height: 15 }} /> Connect
            </button>
          </motion.div>
        )}

        {/* Already claimed banner */}
        {isConnected && alreadyClaimed && !claimDone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: 'rgba(53,208,127,0.08)', border: '1.5px solid rgba(53,208,127,0.3)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 style={{ width: 20, height: 20, color: '#1a9f5e', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1a9f5e' }}>You already claimed in this session</p>
              <p style={{ fontSize: 12, color: '#4a6357' }}>Each wallet can only spin once per session.</p>
            </div>
          </motion.div>
        )}

        {/* Wheel */}
        <div className="relative">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-[#FCFF52] drop-shadow-[0_0_10px_rgba(252,255,82,0.6)]" />
          </div>
          <div style={{ transform: `rotate(${rotation}deg)`, transition: transStyle }}>
            <canvas ref={canvasRef} width={480} height={480} className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px]" />
          </div>
          <div className={`absolute inset-0 rounded-full border-4 pointer-events-none transition-all duration-500 ${isSpinning ? "border-[#FCFF52]/60 shadow-[0_0_50px_rgba(252,255,82,0.4)]" : "border-[#35D07F]/20"}`} />
        </div>

        {/* Countdown */}
        <AnimatePresence>
          {isSpinning && countdown > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2">
              <div className="text-5xl font-black text-[#FCFF52] drop-shadow-[0_0_20px_rgba(252,255,82,0.5)]">{countdown}</div>
              <div className="w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 5, ease: "linear" }} className="h-full bg-gradient-to-r from-[#35D07F] to-[#FCFF52] rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Spin button */}
        {!hasSpun && (
          <motion.button
            whileHover={{ scale: isConnected && !alreadyClaimed ? 1.05 : 1 }}
            whileTap={{ scale: isConnected && !alreadyClaimed ? 0.95 : 1 }}
            onClick={spin}
            disabled={isSpinning || !isConnected || alreadyClaimed || items.length < 2}
            style={{
              padding: '18px 52px', borderRadius: 18,
              background: isConnected && !alreadyClaimed
                ? 'linear-gradient(135deg, #35D07F, #FCFF52)'
                : 'rgba(0,0,0,0.08)',
              color: isConnected && !alreadyClaimed ? '#000' : '#9ca3af',
              fontWeight: 800, fontSize: 22, border: 'none', cursor: isConnected && !alreadyClaimed ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: isConnected && !alreadyClaimed ? '0 0 40px rgba(53,208,127,0.35)' : 'none',
              transition: 'all 0.2s',
            }}>
            {isSpinning
              ? <><RotateCcw style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} /> Spinning...</>
              : <><Sparkles style={{ width: 24, height: 24 }} /> SPIN!</>}
          </motion.button>
        )}

        {/* Hadiah items preview */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ width: '100%', background: '#fff', borderRadius: 20, padding: '18px 20px', border: '1.5px solid rgba(53,208,127,0.18)' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#4a6357', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy style={{ width: 15, height: 15 }} /> Prize List
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 10, background: 'rgba(53,208,127,0.04)' }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: item.color + '28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{item.emoji}</div>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#0a1a0f' }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: (item.celoAmount ?? 0) > 0 ? '#7c3aed' : '#9ca3af' }}>
                  {(item.celoAmount ?? 0) > 0 ? `${item.celoAmount} ⬡ CELO` : '—'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Winner Popup */}
      <AnimatePresence>
        {showResult && winner && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.65)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4"
            >
              <div style={{ background: '#fff', borderRadius: 32, border: '2px solid rgba(252,255,82,0.5)', padding: '36px 32px', textAlign: 'center', boxShadow: '0 0 80px rgba(252,255,82,0.2)' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring" }} className="text-7xl mb-4">
                  {winner.emoji}
                </motion.div>
                <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  style={{ fontSize: 28, fontWeight: 800, color: '#0a1a0f', marginBottom: 12 }}>
                  🎉 You Won!
                </motion.h2>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
                  style={{ padding: '14px 28px', borderRadius: 16, background: winner.color + '22', color: winner.color, fontSize: 24, fontWeight: 800, display: 'inline-block', marginBottom: 20 }}>
                  {winner.label}
                </motion.div>

                {/* Klaim CELO */}
                {(winnerCeloAmount ?? 0) > 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    style={{ padding: '16px', borderRadius: 16, background: 'rgba(167,139,250,0.08)', border: '1.5px solid rgba(167,139,250,0.3)', marginBottom: 16 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Zap style={{ width: 16, height: 16 }} />
                      Your prize: {winnerCeloAmount} CELO
                    </p>
                    {claimDone ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a9f5e', fontWeight: 700, fontSize: 15 }}>
                          <CheckCircle2 style={{ width: 20, height: 20 }} />
                          {winnerCeloAmount} CELO claimed!
                        </div>
                        {claimTxHash && (
                          <a href={`https://sepolia.celoscan.io/tx/${claimTxHash}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7c3aed', textDecoration: 'none' }}>
                            <ExternalLink style={{ width: 12, height: 12 }} /> View transaction
                          </a>
                        )}
                      </div>
                    ) : !isConnected ? (
                      <button onClick={() => connect({ connector: connectors[0] })}
                        style={{ width: '100%', padding: '11px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Wallet style={{ width: 15, height: 15 }} /> Connect Wallet to Claim
                      </button>
                    ) : (
                      <>
                        <button onClick={handleClaim} disabled={isSigning || isClaimingSpin}
                          style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'linear-gradient(135deg,#35D07F,#FCFF52)', color: '#000', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSigning || isClaimingSpin ? 0.7 : 1 }}>
                          {isSigning || isClaimingSpin
                            ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Processing...</>
                            : <><Gift style={{ width: 16, height: 16 }} /> Claim {winnerCeloAmount} CELO</>}
                        </button>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Gas fee paid by your wallet.</p>
                        {claimError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{claimError}</p>}
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)', marginBottom: 16 }}>
                    <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>No CELO reward for this slice 😅</p>
                  </motion.div>
                )}

                <button onClick={() => setShowResult(false)}
                  style={{ padding: '10px 28px', borderRadius: 12, background: 'rgba(252,255,82,0.1)', border: '1px solid rgba(252,255,82,0.3)', color: '#7a6e00', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
