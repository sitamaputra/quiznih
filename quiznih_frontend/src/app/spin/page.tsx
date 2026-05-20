"use client";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Gift, RotateCcw, Sparkles, Trophy, Users, UserPlus, Clock, Camera, Video, VideoOff, Zap, Wallet, CheckCircle2, Loader2, X, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { useCapture } from "@/hooks/useCapture";
import TopBar from "@/components/layout/TopBar";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { useCeloQuiz } from "@/hooks/useCeloQuiz";
import { supabase } from "@/lib/supabase";

const WHEEL_COLORS = ["#35D07F","#FCFF52","#60A5FA","#F472B6","#A78BFA","#F59E0B","#EF4444","#10B981","#8B5CF6","#EC4899","#06B6D4","#F97316"];
const DURATIONS = [{ label: "5s", val: 5 },{ label: "10s", val: 10 },{ label: "15s", val: 15 }];

const DEFAULT_PRIZES = [
  { id: 1, label: "0.5 CELO", color: "#35D07F", emoji: "💰" },
  { id: 2, label: "Kaos", color: "#FCFF52", emoji: "👕" },
  { id: 3, label: "Tumbler", color: "#60A5FA", emoji: "☕" },
  { id: 4, label: "Sticker Pack", color: "#F472B6", emoji: "🎨" },
  { id: 5, label: "NFT Rare", color: "#A78BFA", emoji: "🖼️" },
  { id: 6, label: "Coba Lagi", color: "#6B7280", emoji: "🔄" },
];

const PRIZE_OPTIONS = [
  "0.1 CELO","0.5 CELO","1 CELO","Kaos Eksklusif","Tumbler","Sticker Pack","NFT Rare","Mystery Box","Pizza Party","Voucher 50K","Free Pass","Custom..."
];

interface Item { id: number; label: string; color: string; emoji: string; celoAmount?: number; }

export default function SpinWheelPage() {
  const { lang } = useLanguage();
  const [mode, setMode] = useState<"prize"|"name">("prize");
  const { takeScreenshot, startRecording, stopRecording, isRecording, recordingTime, formatRecTime } = useCapture();
  const captureRef = useRef<HTMLDivElement>(null);

  // Wallet & CELO
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { createSpinSession, closeSpinSession, claimSpin: claimSpinOnChain, isCreatingSession, isClosingSession, isClaimingSpin } = useCeloQuiz();

  // CELO Session state
  const [celoMode, setCeloMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionPool, setSessionPool] = useState("1");
  const [copiedLink, setCopiedLink] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionTx, setSessionTx] = useState<string | null>(null);
  // Claim state
  const [winnerCeloAmount, setWinnerCeloAmount] = useState(0);
  const [showClaimPanel, setShowClaimPanel] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimDone, setClaimDone] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  // Shared
  const [items, setItems] = useState<Item[]>(DEFAULT_PRIZES);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Item|null>(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState<{item:Item;prize?:string}[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Duration
  const [duration, setDuration] = useState(5);
  const [customDur, setCustomDur] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Name mode extras
  const [namesBulk, setNamesBulk] = useState("");
  const [selectedPrize, setSelectedPrize] = useState("0.5 CELO");
  const [customPrize, setCustomPrize] = useState("");

  const actualDuration = duration;
  const activePrize = selectedPrize === "Custom..." ? customPrize : selectedPrize;

  // Update CELO amount untuk satu irisan
  const updateItemCelo = (id: number, amount: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, celoAmount: amount } : item));
  };

  // CELO: Buat session on-chain + simpan ke Supabase via API (service role)
  const handleCreateSession = async () => {
    if (!address || !isConnected) { connect({ connector: connectors[0] }); return; }
    const newId = crypto.randomUUID();
    const result = await createSpinSession(newId, sessionPool);
    if (!result.success) { alert("Failed to create session: " + result.error); return; }
    const wheelConfig = items.map(({ id, label, color, emoji, celoAmount }) => ({ id, label, color, emoji, celoAmount: celoAmount ?? 0 }));
    const res = await fetch("/api/spin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: newId, hostAddress: address, prizePool: sessionPool, wheelConfig, txHash: result.txHash }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert("Session created on-chain but DB save failed: " + (data.error || "unknown error"));
      return;
    }
    setSessionId(newId);
    setSessionActive(true);
    setSessionTx(result.txHash || null);
    confetti({ particleCount: 100, spread: 70, colors: ["#35D07F","#FCFF52"] });
  };

  // CELO: Tutup session & kembalikan sisa pool ke host
  const handleCloseSession = async () => {
    if (!sessionId || !confirm("Close session and return remaining CELO to your wallet?")) return;
    const result = await closeSpinSession(sessionId);
    if (!result.success) { alert("Failed to close: " + result.error); return; }
    await fetch("/api/spin/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    setSessionActive(false);
    setSessionId(null);
  };

  // CELO: Minta signature lalu claim on-chain untuk pemenang
  const handleClaimPrize = async () => {
    if (!sessionId || !address || winnerCeloAmount <= 0) return;
    setIsSigning(true);
    setClaimError(null);
    try {
      const prizeWei = BigInt(Math.round(winnerCeloAmount * 1e18)).toString();
      const res = await fetch("/api/spin/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, playerAddress: address, prizeAmountWei: prizeWei }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal minta signature");
      const result = await claimSpinOnChain(sessionId, prizeWei, data.signature as `0x${string}`);
      if (!result.success) throw new Error(result.error || "Claim on-chain gagal");
      await supabase.from("spin_claims").update({ claimed_onchain: true, tx_hash: result.txHash })
        .eq("session_id", sessionId).eq("player_address", address.toLowerCase());
      setClaimDone(true);
      confetti({ particleCount: 200, spread: 90, colors: ["#35D07F","#FCFF52","#a78bfa"] });
    } catch (err: any) {
      setClaimError(err.message);
    } finally {
      setIsSigning(false);
    }
  };

  // Switch mode
  const switchMode = (m: "prize"|"name") => {
    setMode(m);
    setShowResult(false);
    setWinner(null);
    if (m === "name") {
      setItems([
        { id: 1, label: "Andi", color: WHEEL_COLORS[0], emoji: "👤" },
        { id: 2, label: "Budi", color: WHEEL_COLORS[1], emoji: "👤" },
        { id: 3, label: "Citra", color: WHEEL_COLORS[2], emoji: "👤" },
        { id: 4, label: "Dewi", color: WHEEL_COLORS[3], emoji: "👤" },
      ]);
    } else {
      setItems(DEFAULT_PRIZES);
    }
  };

  // Draw wheel
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width, center = size/2, radius = center-12;
    const sliceAngle = (2*Math.PI)/items.length;
    ctx.clearRect(0,0,size,size);

    ctx.save();
    ctx.shadowColor = "rgba(53,208,127,0.3)";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(center,center,radius,0,2*Math.PI);
    ctx.fill();
    ctx.restore();

    items.forEach((item, i) => {
      const sa = i*sliceAngle, ea = sa+sliceAngle;
      ctx.beginPath(); ctx.moveTo(center,center);
      ctx.arc(center,center,radius,sa,ea); ctx.closePath();
      ctx.fillStyle = item.color; ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 2; ctx.stroke();

      ctx.save(); ctx.translate(center,center);
      ctx.rotate(sa+sliceAngle/2); ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      const fs = Math.max(14, 26 - items.length);
      ctx.font = `bold ${fs}px 'Outfit', sans-serif`;
      const tr = radius*0.58;
      ctx.fillText(item.emoji, tr, -12);
      ctx.font = `bold ${Math.max(11, fs-4)}px 'Outfit', sans-serif`;
      const lbl = item.label.length > 12 ? item.label.slice(0,11)+"…" : item.label;
      ctx.fillText(lbl, tr, 12);
      ctx.restore();
    });

    ctx.beginPath(); ctx.arc(center,center,40,0,2*Math.PI);
    ctx.fillStyle = "#0A0A0A"; ctx.fill();
    ctx.strokeStyle = "#35D07F"; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = "#35D07F"; ctx.font = "bold 20px 'Outfit', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  }, [items]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  // Countdown timer
  useEffect(() => {
    if (!isSpinning || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSpinning, countdown]);

  // Spin
  const spin = () => {
    if (isSpinning || items.length < 2) return;
    setIsSpinning(true); setShowResult(false); setWinner(null);
    setCountdown(actualDuration);

    const winIdx = Math.floor(Math.random()*items.length);
    const sliceAng = 360/items.length;
    const extra = Math.max(5, Math.floor(actualDuration*1.2));
    const target = 360-(winIdx*sliceAng+sliceAng/2);
    setRotation(rotation + extra*360 + target);

    setTimeout(() => {
      setIsSpinning(false); setCountdown(0);
      const w = items[winIdx];
      setWinner(w); setShowResult(true);
      setHistory(prev => [{item:w, prize: mode==="name"?activePrize:undefined}, ...prev].slice(0,15));
      confetti({ particleCount: 180, spread: 90, origin:{y:0.45}, colors:["#35D07F","#FCFF52","#FDE047","#A78BFA"] });
      // Trigger claim panel jika CELO mode aktif, session ada, dan irisan ini punya CELO
      const cAmount = w.celoAmount ?? 0;
      if (celoMode && sessionActive && sessionId && cAmount > 0) {
        setWinnerCeloAmount(cAmount);
        setShowClaimPanel(true);
        setClaimDone(false);
        setClaimError(null);
      } else {
        setShowClaimPanel(false);
        setWinnerCeloAmount(0);
      }
    }, actualDuration*1000);
  };

  // Add single entry
  const addEntry = () => {
    if (!newEntry.trim()) return;
    const id = Date.now();
    const color = WHEEL_COLORS[items.length%WHEEL_COLORS.length];
    const emoji = mode === "name" ? "👤" : "🎁";
    setItems(p => [...p, {id, label: newEntry.trim(), color, emoji}]);
    setNewEntry("");
  };

  // Bulk add names
  const addBulkNames = () => {
    const names = namesBulk.split(/[\n,;]+/).map(n=>n.trim()).filter(Boolean);
    if (!names.length) return;
    const newItems = names.map((n,i) => ({
      id: Date.now()+i, label: n, color: WHEEL_COLORS[(items.length+i)%WHEEL_COLORS.length], emoji: "👤"
    }));
    setItems(p => [...p, ...newItems]);
    setNamesBulk("");
  };

  const removeItem = (id: number) => { if (items.length > 2) setItems(p => p.filter(x=>x.id!==id)); };

  const transStyle = isSpinning ? `transform ${actualDuration}s cubic-bezier(0.17,0.67,0.12,0.99)` : "none";

  return (
    <main className="min-h-screen w-full text-[#0a1a0f] relative overflow-x-hidden" style={{ background: '#e8fdf2' }}>
      {/* Soft glow orbs */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: '5%', top: '10%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(167,139,250,0.10)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', right: '0%', bottom: '5%', width: 450, height: 450, borderRadius: '50%', background: 'rgba(252,255,82,0.14)', filter: 'blur(120px)' }} />
      </div>

      <TopBar backHref="/dashboard" />

      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-4 flex items-center justify-end gap-2 flex-wrap" style={{ position: 'relative', zIndex: 1 }}>
          {/* Capture Controls */}
          <button onClick={() => captureRef.current && takeScreenshot(captureRef.current, "spin_wheel")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 text-gray-400 hover:text-[#FCFF52] hover:border-[#FCFF52]/40 transition-all text-xs font-bold"
            title={lang==="ENG"?"Screenshot":"Tangkapan Layar"}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">{lang==="ENG"?"Screenshot":"Screenshot"}</span>
          </button>
          {isRecording ? (
            <button onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-xs font-bold animate-pulse"
            >
              <VideoOff className="w-4 h-4" />
              <span className="font-mono">{formatRecTime(recordingTime)}</span>
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button onClick={startRecording}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 dark:bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-all text-xs font-bold"
              title={lang==="ENG"?"Record Screen":"Rekam Layar"}
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">{lang==="ENG"?"Record":"Rekam"}</span>
            </button>
          )}
          {/* Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ background: 'rgba(0,0,0,0.05)', borderColor: 'rgba(53,208,127,0.2)' }}>
            <button onClick={()=>switchMode("prize")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==="prize"?"bg-[#35D07F] text-white shadow-md":"text-[#4a6357] hover:text-[#1a9f5e]"}`}>
              <Gift className="w-4 h-4"/> {lang==="ENG"?"Prizes":"Hadiah"}
            </button>
            <button onClick={()=>switchMode("name")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==="name"?"bg-[#FCFF52] text-black shadow-md":"text-[#4a6357] hover:text-[#7a6e00]"}`}>
              <Users className="w-4 h-4"/> {lang==="ENG"?"Names":"Nama"}
            </button>
          </div>
      </header>

      <div ref={captureRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-24" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center mb-8 relative">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.3)', color: '#7c3aed', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            {mode==="prize" ? (lang==="ENG" ? "Spin & Win" : "Putar & Menang") : (lang==="ENG" ? "Random Picker" : "Pilih Acak")}
          </div>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0a1a0f', margin: '0 0 10px' }}>
            🎡 <span style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{mode==="prize"?(lang==="ENG"?"Spin Wheel":"Roda Putar"):(lang==="ENG"?"Random Picker":"Pilih Acak")}</span>
          </h1>
          <p style={{ fontSize: 15, color: '#4a6357', lineHeight: 1.6 }}>
            {mode==="prize"
              ?(lang==="ENG"?"Customize prizes and spin the wheel for a fair winner!":"Atur hadiah dan putar roda untuk pemenang yang adil!")
              :(lang==="ENG"?"Add participant names, select a prize, and spin to pick a winner!":"Tambahkan nama peserta, pilih hadiah, dan putar untuk pilih pemenang!")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT PANEL */}
          <div className="lg:col-span-2 space-y-5">
            {/* Duration Selector */}
            <div style={{ background: '#ffffff', border: '1.5px solid rgba(53,208,127,0.18)', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(53,208,127,0.06)' }}>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: '#4a6357', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Clock className="w-4 h-4"/> {lang==="ENG"?"Spin Duration":"Durasi Spin"}</h3>
              <div className="flex gap-2">
                {DURATIONS.map(d=>(
                  <button key={d.val} onClick={()=>{setDuration(d.val);setCustomDur("");}}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', background: duration===d.val&&!customDur?'#35D07F':'rgba(53,208,127,0.08)', color: duration===d.val&&!customDur?'#fff':'#1a9f5e', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                    {d.label}
                  </button>
                ))}
                <input value={customDur} onChange={e=>{setCustomDur(e.target.value);const v=parseInt(e.target.value);if(v>0&&v<=60)setDuration(v);}}
                  placeholder="Custom" type="number" min="1" max="60"
                  style={{ width: 80, padding: '8px 12px', borderRadius: 12, border: '1.5px solid rgba(53,208,127,0.2)', fontSize: 14, textAlign: 'center', fontFamily: 'monospace', color: '#0a1a0f', background: '#fff', outline: 'none' }}/>
              </div>
            </div>

            {/* Name mode: prize selector */}
            {mode==="name"&&(
              <div className="glass rounded-[2rem] border border-[#FCFF52]/30 p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Gift className="w-4 h-4 text-[#FCFF52]"/> {lang==="ENG"?"Prize for Winner":"Hadiah untuk Pemenang"}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {PRIZE_OPTIONS.map(p=>(
                    <button key={p} onClick={()=>setSelectedPrize(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedPrize===p?"bg-[#FCFF52]/20 border-[#FCFF52] text-[#FCFF52] border":"bg-white/5 border border-white/10 text-gray-400 hover:border-[#FCFF52]/40"}`}>
                      {p}
                    </button>
                  ))}
                </div>
                {selectedPrize==="Custom..."&&(
                  <input value={customPrize} onChange={e=>setCustomPrize(e.target.value)} placeholder={lang==="ENG"?"Enter custom prize...":"Tulis hadiah custom..."}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-[#FCFF52]/30 text-sm placeholder-gray-500 focus:outline-none focus:border-[#FCFF52]/50"/>
                )}
                <div className="px-4 py-2 rounded-xl bg-[#FCFF52]/10 text-[#FCFF52] text-sm font-bold text-center">
                  🎁 {activePrize || "—"}
                </div>
              </div>
            )}

            {/* Name mode: bulk add */}
            {mode==="name"&&(
              <div className="glass rounded-[2rem] border border-white/10 p-5 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#35D07F]"/> {lang==="ENG"?"Bulk Add Names":"Tambah Nama Massal"}</h3>
                <textarea value={namesBulk} onChange={e=>setNamesBulk(e.target.value)} rows={3}
                  placeholder={lang==="ENG"?"Enter names separated by comma or new line...\ne.g. Andi, Budi, Citra":"Masukkan nama dipisah koma atau baris baru...\ncontoh: Andi, Budi, Citra"}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-600 focus:outline-none focus:border-[#35D07F]/50 resize-none font-mono"/>
                <button onClick={addBulkNames}
                  className="w-full py-2 rounded-xl bg-[#35D07F]/20 text-[#35D07F] font-bold text-sm hover:bg-[#35D07F]/30 transition-all flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4"/> {lang==="ENG"?"Add All Names":"Tambahkan Semua"}
                </button>
              </div>
            )}

            {/* Item List */}
            <div style={{ background: '#ffffff', border: '1.5px solid rgba(53,208,127,0.18)', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(53,208,127,0.06)' }}>
              <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#0a1a0f' }}>
                {mode==="prize"?<Gift className="w-5 h-5" style={{color:'#7a6e00'}}/>:<Users className="w-5 h-5" style={{color:'#1a9f5e'}}/>}
                {mode==="prize"?(lang==="ENG"?"Prizes":"Hadiah"):(lang==="ENG"?"Names":"Daftar Nama")} ({items.length})
              </h3>
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {items.map(item=>(
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 12, background: 'rgba(53,208,127,0.05)', border: '1px solid rgba(53,208,127,0.12)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, background: item.color+'25', flexShrink: 0 }}>{item.emoji}</div>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: '#0a1a0f', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                    {celoMode && mode === "prize" && !sessionActive && (
                      <input
                        type="number"
                        value={item.celoAmount ?? 0}
                        onChange={e => updateItemCelo(item.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        step="0.001"
                        min="0"
                        title="CELO amount for this slice"
                        style={{ width: 68, padding: '3px 6px', borderRadius: 7, border: '1.5px solid rgba(167,139,250,0.35)', fontSize: 12, textAlign: 'center', fontFamily: 'monospace', color: '#7c3aed', background: '#f8f5ff', outline: 'none', flexShrink: 0 }}
                      />
                    )}
                    {celoMode && mode === "prize" && sessionActive && (
                      <span style={{ fontSize: 12, color: (item.celoAmount ?? 0) > 0 ? '#7c3aed' : '#9ca3af', fontWeight: 700, minWidth: 58, textAlign: 'right', flexShrink: 0 }}>
                        {(item.celoAmount ?? 0) > 0 ? `${item.celoAmount}⬡` : '—'}
                      </span>
                    )}
                    <button onClick={()=>removeItem(item.id)} disabled={items.length<=2 || sessionActive} style={{ padding: 4, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', opacity: items.length<=2||sessionActive?0.2:1, flexShrink: 0 }}>
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, paddingTop: 12, marginTop: 12, borderTop: '1px solid rgba(53,208,127,0.12)' }}>
                <input value={newEntry} onChange={e=>setNewEntry(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
                  placeholder={mode==="prize"?(lang==="ENG"?"Add prize...":"Tambah hadiah..."):(lang==="ENG"?"Add name...":"Tambah nama...")}
                  style={{ flex: 1, padding: '8px 14px', borderRadius: 12, border: '1.5px solid rgba(53,208,127,0.2)', fontSize: 14, color: '#0a1a0f', background: '#fff', outline: 'none', fontFamily: 'inherit' }}/>
                <button onClick={addEntry} style={{ padding: '8px 14px', borderRadius: 12, background: 'rgba(53,208,127,0.12)', border: 'none', color: '#1a9f5e', cursor: 'pointer' }}>
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* CELO Session Card */}
            <div style={{ background: '#fff', border: `1.5px solid ${celoMode ? 'rgba(167,139,250,0.5)' : 'rgba(167,139,250,0.2)'}`, borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(167,139,250,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: celoMode ? 16 : 0 }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: '#0a1a0f', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Zap style={{ width: 16, height: 16, color: '#7c3aed' }} />
                  CELO Prize Mode
                </h3>
                <button onClick={() => setCeloMode(v => !v)} style={{ position: 'relative', width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: celoMode ? '#35D07F' : '#e5e7eb', transition: 'background 0.2s', padding: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: celoMode ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {celoMode && !sessionActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#4a6357', fontWeight: 600, display: 'block', marginBottom: 4 }}>Total Pool (CELO)</label>
                    <input value={sessionPool} onChange={e => setSessionPool(e.target.value)} type="number" step="0.1" min="0.1"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px solid rgba(53,208,127,0.25)', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.2)', fontSize: 12, color: '#6b4fa8', lineHeight: 1.5 }}>
                    💡 Set a CELO amount per slice in the prize list above.
                    Slices with 0 = no CELO reward.
                  </div>
                  {mode === "prize" && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4a6357', padding: '4px 2px' }}>
                      <span>Rewarded slices:</span>
                      <span style={{ fontWeight: 700, color: '#7c3aed' }}>
                        {items.filter(i => (i.celoAmount ?? 0) > 0).length} / {items.length}
                      </span>
                    </div>
                  )}
                  {!isConnected ? (
                    <button onClick={() => connect({ connector: connectors[0] })}
                      style={{ width: '100%', padding: '10px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Wallet style={{ width: 16, height: 16 }} /> Connect Wallet
                    </button>
                  ) : (
                    <button onClick={handleCreateSession} disabled={isCreatingSession}
                      style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: isCreatingSession ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {isCreatingSession ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Creating...</> : <><Zap style={{ width: 16, height: 16 }} /> Create CELO Session</>}
                    </button>
                  )}
                </div>
              )}

              {celoMode && sessionActive && sessionId && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(53,208,127,0.08)', border: '1px solid rgba(53,208,127,0.2)' }}>
                    <div style={{ fontSize: 12, color: '#1a9f5e', fontWeight: 700, marginBottom: 6 }}>✅ Session Active</div>
                    <div style={{ fontSize: 13, color: '#0a1a0f', marginBottom: 6 }}>Pool: <strong>{sessionPool} CELO</strong></div>
                    <div style={{ fontSize: 11, color: '#4a6357', fontWeight: 600, marginBottom: 4 }}>Reward per slice:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 120, overflowY: 'auto' }}>
                      {items.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#0a1a0f' }}>
                          <span>{item.emoji} {item.label.length > 14 ? item.label.slice(0,13)+'…' : item.label}</span>
                          <span style={{ fontWeight: 700, color: (item.celoAmount ?? 0) > 0 ? '#7c3aed' : '#9ca3af' }}>
                            {(item.celoAmount ?? 0) > 0 ? `${item.celoAmount} ⬡` : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Share link untuk player */}
                  <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.07)', border: '1.5px solid rgba(167,139,250,0.25)' }}>
                    <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, marginBottom: 6 }}>🔗 Player Link</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <code style={{ flex: 1, fontSize: 10, color: '#4a4a6a', background: 'rgba(167,139,250,0.1)', padding: '5px 8px', borderRadius: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {typeof window !== 'undefined' ? `${window.location.origin}/spin/${sessionId}` : `/spin/${sessionId}`}
                      </code>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/spin/${sessionId}`;
                          navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        style={{ padding: '5px 8px', borderRadius: 8, background: copiedLink ? 'rgba(53,208,127,0.15)' : 'rgba(167,139,250,0.15)', border: 'none', cursor: 'pointer', color: copiedLink ? '#1a9f5e' : '#7c3aed', flexShrink: 0 }}
                        title="Copy link"
                      >
                        {copiedLink ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                      </button>
                      <a href={`/spin/${sessionId}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '5px 8px', borderRadius: 8, background: 'rgba(167,139,250,0.15)', color: '#7c3aed', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                        <ExternalLink style={{ width: 14, height: 14 }} />
                      </a>
                    </div>
                    <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 5 }}>Share with participants. Each wallet can spin once.</p>
                  </div>

                  <button onClick={handleCloseSession} disabled={isClosingSession}
                    style={{ width: '100%', padding: '8px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {isClosingSession ? "Closing..." : "🔒 Close Session & Reclaim CELO"}
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            {history.length>0&&(
              <div style={{ background: '#ffffff', border: '1.5px solid rgba(53,208,127,0.15)', borderRadius: 20, padding: 20, boxShadow: '0 2px 12px rgba(53,208,127,0.05)' }}>
                <h3 style={{ fontWeight: 700, fontSize: 14, color: '#4a6357', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Trophy className="w-4 h-4"/> {lang==="ENG"?"History":"Riwayat"}</h3>
                <div className="space-y-1">
                  {history.map((h,i)=>(
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '4px 0' }}>
                      <span style={{ color: '#4a6357', fontSize: 12, width: 20 }}>#{i+1}</span>
                      <span>{h.item.emoji}</span>
                      <span style={{ fontWeight: 600, flex: 1, color: '#0a1a0f' }}>{h.item.label}</span>
                      {h.prize&&<span style={{ fontSize: 11, color: '#7a6e00', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(252,255,82,0.15)' }}>🎁 {h.prize}</span>}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setHistory([])} style={{ fontSize: 12, color: '#4a6357', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}>
                  {lang==="ENG"?"Clear History":"Hapus Riwayat"}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: WHEEL (bigger) */}
          <div className="lg:col-span-3 flex flex-col items-center gap-6">
            {/* Countdown Timer */}
            <AnimatePresence>
              {isSpinning&&countdown>0&&(
                <motion.div initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                  className="flex flex-col items-center gap-2">
                  <div className="text-6xl font-black text-[#FCFF52] drop-shadow-[0_0_20px_rgba(252,255,82,0.5)]">{countdown}</div>
                  <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{width:"100%"}} animate={{width:"0%"}} transition={{duration:actualDuration,ease:"linear"}}
                      className="h-full bg-gradient-to-r from-[#35D07F] to-[#FCFF52] rounded-full"/>
                  </div>
                  <span className="text-xs text-gray-500 font-bold">{lang==="ENG"?"Spinning...":"Memutar..."}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wheel */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[32px] border-l-transparent border-r-transparent border-t-[#FCFF52] drop-shadow-[0_0_12px_rgba(252,255,82,0.6)]"/>
              </div>
              <div style={{transform:`rotate(${rotation}deg)`,transition:transStyle}}>
                <canvas ref={canvasRef} width={560} height={560} className="w-[min(360px,85vw)] h-[min(360px,85vw)] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px] max-w-full"/>
              </div>
              <div className={`absolute inset-0 rounded-full border-4 pointer-events-none transition-all duration-500 ${isSpinning?"border-[#FCFF52]/60 shadow-[0_0_50px_rgba(252,255,82,0.4)]":"border-[#35D07F]/20"}`}/>
            </div>

            {/* Spin Button */}
            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={spin} disabled={isSpinning||items.length<2}
              className="px-14 py-6 rounded-2xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-extrabold text-2xl hover:shadow-[0_0_50px_rgba(53,208,127,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3">
              {isSpinning
                ?<><RotateCcw className="w-7 h-7 animate-spin"/> {lang==="ENG"?"Spinning...":"Memutar..."}</>
                :<><Sparkles className="w-7 h-7"/> {lang==="ENG"?"SPIN!":"PUTAR!"}</>}
            </motion.button>
            <span className="text-xs text-gray-600">{lang==="ENG"?`Duration: ${actualDuration}s`:`Durasi: ${actualDuration} detik`}</span>
          </div>
        </div>
      </div>

      {/* Winner Popup - Centered Overlay */}
      <AnimatePresence>
        {showResult&&winner&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={()=>{setShowResult(false);setWinner(null);}}
            />
            <motion.div
              initial={{opacity:0,scale:0.5,y:40}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.5,y:40}}
              transition={{type:"spring",stiffness:300,damping:25}}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4"
            >
              <div className="rounded-[2.5rem] border-2 border-[#FCFF52]/50 p-10 text-center space-y-5 shadow-[0_0_100px_rgba(252,255,82,0.25)]" style={{ background: '#ffffff' }}>
                <motion.div
                  initial={{scale:0}} animate={{scale:1}} transition={{delay:0.2,type:"spring",stiffness:200}}
                  className="text-8xl"
                >{winner.emoji}</motion.div>
                <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                  className="text-4xl font-extrabold text-gradient"
                >
                  {mode==="name"?(lang==="ENG"?"🎉 Winner!":"🎉 Pemenang!"):(lang==="ENG"?"🎉 You Won!":"🎉 Kamu Menang!")}
                </motion.h2>
                <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.4}}
                  className="px-8 py-5 rounded-2xl text-3xl font-black mx-auto inline-block" style={{background:winner.color+"20",color:winner.color}}
                >
                  {winner.label}
                </motion.div>
                {mode==="name"&&activePrize&&(
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
                    className="px-6 py-3 rounded-xl bg-[#FCFF52]/10 border border-[#FCFF52]/30 text-[#FCFF52] font-bold text-xl"
                  >
                    🎁 {lang==="ENG"?"Prize":"Hadiah"}: {activePrize}
                  </motion.div>
                )}
                {/* CELO Claim Section */}
                {celoMode && sessionActive && showClaimPanel && winnerCeloAmount > 0 && (
                  <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
                    style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'rgba(167,139,250,0.08)', border: '1.5px solid rgba(167,139,250,0.3)', marginTop: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#7c3aed', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap style={{ width: 16, height: 16 }} />
                      Claim {winnerCeloAmount} CELO
                    </p>
                    {claimDone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1a9f5e', fontWeight: 700, fontSize: 14 }}>
                        <CheckCircle2 style={{ width: 18, height: 18 }} />
                        {winnerCeloAmount} CELO claimed successfully!
                      </div>
                    ) : (
                      <>
                        {!isConnected ? (
                          <button onClick={() => connect({ connector: connectors[0] })}
                            style={{ width: '100%', padding: '10px', borderRadius: 12, background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                            Connect Wallet to Claim
                          </button>
                        ) : (
                          <button onClick={handleClaimPrize} disabled={isSigning || isClaimingSpin}
                            style={{ width: '100%', padding: '10px', borderRadius: 12, background: 'linear-gradient(135deg,#35D07F,#FCFF52)', color: '#000', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSigning || isClaimingSpin ? 0.7 : 1 }}>
                            {isSigning || isClaimingSpin
                              ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Processing...</>
                              : <><Gift style={{ width: 16, height: 16 }} /> Claim {winnerCeloAmount} CELO</>}
                          </button>
                        )}
                        {claimError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{claimError}</p>}
                      </>
                    )}
                  </motion.div>
                )}

                <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
                  onClick={()=>{setShowResult(false);setWinner(null);setShowClaimPanel(false);}}
                  className="mt-4 px-8 py-3 rounded-xl bg-[#FCFF52]/10 border border-[#FCFF52]/30 text-[#FCFF52] font-bold hover:bg-[#FCFF52]/20 transition-all text-sm"
                >
                  {lang==="ENG"?"Close":"Tutup"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
