"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Users, Trophy, TrendingUp, Eye, Zap, Gift, Star,
  Timer, BarChart3, Crown, Target, Loader2, ChevronDown, Camera, Video, VideoOff
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { useCapture } from "@/hooks/useCapture";
import TopBar from "@/components/TopBar";
import { useSearchParams } from "next/navigation";

interface Player {
  user_wallet: string;
  player_name: string;
  final_score: number;
  avatar_emoji?: string;
}

interface Bet {
  playerWallet: string;
  playerName: string;
  amount: number;
  timestamp: number;
}

const PRIZE_POOL_TYPES = [
  { id: "celo", label: "CELO", icon: "💰", prizes: ["0.5 CELO", "0.3 CELO", "0.2 CELO"] },
  { id: "merch", label: "Merchandise", icon: "👕", prizes: ["Kaos Eksklusif", "Tumbler", "Sticker Pack"] },
  { id: "nft", label: "NFT", icon: "🖼️", prizes: ["NFT Legendary", "NFT Rare", "NFT Common"] },
  { id: "mixed", label: "Campuran", icon: "🎁", prizes: ["1 CELO + Kaos", "0.5 CELO + Sticker", "NFT + Tumbler"] },
  { id: "fun", label: "Fun Prizes", icon: "🎉", prizes: ["Pizza Party", "Skip Tugas", "Mystery Box"] },
  { id: "custom", label: "Custom", icon: "✏️", prizes: ["Hadiah 1", "Hadiah 2", "Hadiah 3"] },
];

const DEMO_PLAYERS: Player[] = [
  { user_wallet: "0xA1b2...C3d4", player_name: "CryptoNinja", final_score: 850, avatar_emoji: "🐱" },
  { user_wallet: "0xE5f6...G7h8", player_name: "DeFiKing", final_score: 780, avatar_emoji: "🦁" },
  { user_wallet: "0xI9j0...K1l2", player_name: "Web3Wizard", final_score: 720, avatar_emoji: "🧙" },
  { user_wallet: "0xM3n4...O5p6", player_name: "BlockHero", final_score: 650, avatar_emoji: "🦊" },
  { user_wallet: "0xQ7r8...S9t0", player_name: "ChainMaster", final_score: 580, avatar_emoji: "🐲" },
  { user_wallet: "0xU1v2...W3x4", player_name: "TokenFan", final_score: 490, avatar_emoji: "🐼" },
];

function LiveReportContent() {
  const { lang } = useLanguage();
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  
  const [roomCode, setRoomCode] = useState(initialCode);
  const [isWatching, setIsWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [quizInfo, setQuizInfo] = useState<any>(null);
  const [selectedPrizePool, setSelectedPrizePool] = useState(PRIZE_POOL_TYPES[0]);
  const [customPrizes, setCustomPrizes] = useState(["", "", ""]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [myBet, setMyBet] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("0.1");
  const [showBetPanel, setShowBetPanel] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [liveTime, setLiveTime] = useState(0);
  const { takeScreenshot, startRecording, stopRecording, isRecording, recordingTime, formatRecTime } = useCapture();
  const captureRef = useRef<HTMLDivElement>(null);
  const [scoreHistory, setScoreHistory] = useState<{time:number;scores:{[wallet:string]:number}}[]>([]);
  const [showWinner, setShowWinner] = useState(false);
  const CHART_COLORS = ["#FDE047","#35D07F","#60A5FA","#F472B6","#A78BFA","#F59E0B"];

  // Live timer
  useEffect(() => {
    if (!isWatching) return;
    const t = setInterval(() => setLiveTime(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [isWatching]);

  // Simulate score updates in demo mode
  useEffect(() => {
    if (!isDemo || !isWatching) return;
    const t = setInterval(() => {
      setPlayers(prev =>
        prev.map(p => ({
          ...p,
          final_score: p.final_score + Math.floor(Math.random() * 50),
        }))
      );
    }, 3000);
    return () => clearInterval(t);
  }, [isDemo, isWatching]);

  // Record score history for chart
  useEffect(() => {
    if (!isWatching || players.length === 0) return;
    const t = setInterval(() => {
      setScoreHistory(prev => {
        const entry: {time:number;scores:{[w:string]:number}} = { time: Date.now(), scores: {} };
        players.forEach(p => { entry.scores[p.user_wallet] = p.final_score || 0; });
        return [...prev.slice(-30), entry]; // keep last 30 data points
      });
    }, 2000);
    return () => clearInterval(t);
  }, [isWatching, players]);

  const handleFinish = () => {
    setShowWinner(true);
    confetti({ particleCount: 250, spread: 100, origin: { y: 0.4 }, colors: ["#35D07F","#FCFF52","#FDE047","#A78BFA"] });
  };

  const handleWatch = async () => {
    if (!roomCode.trim()) return;
    setIsLoading(true);

    try {
      // Try Supabase first
      if (isSupabaseConfigured) {
        const { data: quiz } = await supabase
          .from("quizzes").select("*").eq("room_code", roomCode).single();

        if (quiz) {
          setQuizInfo(quiz);
          const { data: lb } = await supabase
            .from("leaderboard").select("*").eq("quiz_id", quiz.id);
          if (lb) setPlayers(lb);

          // Subscribe to live updates
          supabase
            .channel(`live-${quiz.id}`)
            .on("postgres_changes", {
              event: "*", schema: "public", table: "leaderboard",
              filter: `quiz_id=eq.${quiz.id}`,
            }, (payload) => {
              if (payload.eventType === "INSERT") {
                setPlayers(prev => [...prev, payload.new as Player]);
              } else if (payload.eventType === "UPDATE") {
                setPlayers(prev =>
                  prev.map(p => p.user_wallet === (payload.new as Player).user_wallet ? payload.new as Player : p)
                );
              }
            })
            .subscribe();

          setIsWatching(true);
          setIsDemo(false);
          return;
        }
      }

      // Demo fallback
      if (roomCode === "123456" || roomCode.toLowerCase() === "demo") {
        setPlayers(DEMO_PLAYERS);
        setQuizInfo({ title: "Web3 & Celo Trivia", status: "playing", reward_pool_amount: 1.5 });
        setIsWatching(true);
        setIsDemo(true);
      } else {
        alert(lang === "ENG" ? "Quiz not found. Try code: 123456" : "Kuis tidak ditemukan. Coba kode: 123456");
      }
    } catch (err) {
      console.error(err);
      alert(lang === "ENG" ? "Error loading quiz" : "Gagal memuat kuis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBet = (playerWallet: string, playerName: string) => {
    if (myBet) return;
    setMyBet(playerWallet);
    setBets(prev => [...prev, {
      playerWallet, playerName,
      amount: parseFloat(betAmount) || 0.1,
      timestamp: Date.now(),
    }]);
    setShowBetPanel(false);
  };

  const sortedPlayers = [...players].sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
  const MEDALS = ["🥇", "🥈", "🥉"];
  const RANK_COLORS = ["#FDE047", "#D1D5DB", "#CD7C2F"];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const activePrizes = selectedPrizePool.id === "custom"
    ? customPrizes.filter(p => p.trim())
    : selectedPrizePool.prizes;

  // ====== JOIN / ROOM CODE SCREEN ======
  if (!isWatching) {
    return (
      <main className="min-h-screen w-full text-black dark:text-white flex flex-col relative">
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#35D07F]/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#FCFF52]/10 blur-[150px] rounded-full" />
        </div>

        <TopBar backHref="/dashboard" />

        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 space-y-3">
            <h1 className="text-4xl md:text-5xl font-extrabold">
              📺 <span className="text-gradient">{lang === "ENG" ? "Live Report" : "Laporan Live"}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {lang === "ENG"
                ? "Watch quiz players live, place bets, and set prize variations!"
                : "Tonton pemain kuis secara live, pasang taruhan, dan atur variasi hadiah!"}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass rounded-[2.5rem] border border-[#35D07F]/30 p-10 max-w-md w-full space-y-6"
          >
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-500">
                {lang === "ENG" ? "Enter Room Code" : "Masukkan Kode Ruangan"}
              </label>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-center text-2xl font-mono font-bold tracking-widest placeholder-gray-600 focus:outline-none focus:border-[#35D07F]/50 transition-all"
              />
            </div>

            {/* Prize Pool Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-500">
                {lang === "ENG" ? "Prize Variation" : "Variasi Hadiah"}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRIZE_POOL_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => setSelectedPrizePool(pt)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      selectedPrizePool.id === pt.id
                        ? "border-[#FCFF52] bg-[#FCFF52]/10 text-[#FCFF52]"
                        : "border-white/10 bg-white/5 text-gray-500 hover:border-[#FCFF52]/40"
                    }`}
                  >
                    <span className="text-xl">{pt.icon}</span>
                    <span>{pt.label}</span>
                  </button>
                ))}
              </div>
              {selectedPrizePool.id === "custom" && (
                <div className="space-y-2 pt-2">
                  {customPrizes.map((cp, i) => (
                    <input key={i} value={cp} onChange={e => {
                      const n = [...customPrizes]; n[i] = e.target.value; setCustomPrizes(n);
                    }}
                      placeholder={`${lang === "ENG" ? "Prize" : "Hadiah"} #${i + 1}`}
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-[#FCFF52]/50"
                    />
                  ))}
                </div>
              )}
              {selectedPrizePool.id !== "custom" && (
                <div className="flex flex-wrap gap-1">
                  {selectedPrizePool.prizes.map((p, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-[#FCFF52]/10 text-[#FCFF52] text-xs font-bold">
                      {MEDALS[i]} {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleWatch} disabled={!roomCode.trim() || isLoading}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(53,208,127,0.5)] transition-all disabled:opacity-40 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Loading...</>
              ) : (
                <><Eye className="w-6 h-6" /> {lang === "ENG" ? "Watch Live" : "Tonton Live"}</>
              )}
            </button>

            <p className="text-center text-xs text-gray-600">
              {lang === "ENG" ? 'Try demo code: "123456"' : 'Coba kode demo: "123456"'}
            </p>
          </motion.div>
        </div>
      </main>
    );
  }

  // ====== LIVE REPORT VIEW ======
  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#35D07F]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#FCFF52]/10 blur-[150px] rounded-full" />
      </div>

      <TopBar />

      {/* Sub-header with live info */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-4 flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => { setIsWatching(false); setLiveTime(0); }}
          className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {lang === "ENG" ? "Leave" : "Keluar"}
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-extrabold uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" /> LIVE
          </span>
          <span className="px-3 py-1.5 rounded-full glass border border-white/10 text-xs font-mono font-bold">
            <Timer className="w-3.5 h-3.5 inline mr-1" />{formatTime(liveTime)}
          </span>
          <span className="px-3 py-1.5 rounded-full glass border border-white/10 text-xs font-bold">
            {players.length} <Users className="w-3.5 h-3.5 inline ml-1" />
          </span>
          {/* Capture Controls */}
          <button onClick={() => captureRef.current && takeScreenshot(captureRef.current, "live_report")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[#FCFF52] hover:border-[#FCFF52]/40 transition-all text-xs font-bold"
            title={lang==="ENG"?"Screenshot":"Tangkapan Layar"}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screenshot</span>
          </button>
          {isRecording ? (
            <button onClick={stopRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all text-xs font-bold animate-pulse"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span className="font-mono">{formatRecTime(recordingTime)}</span>
            </button>
          ) : (
            <button onClick={startRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-all text-xs font-bold"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang==="ENG"?"Record":"Rekam"}</span>
            </button>
          )}
        </div>
      </header>

      <div ref={captureRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        {/* Quiz Title Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[2rem] border border-[#FCFF52]/30 p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-gradient">{quizInfo?.title || "Live Quiz"}</h1>
            <p className="text-gray-500 text-sm">{lang === "ENG" ? "Real-time scoreboard & betting" : "Papan skor & taruhan real-time"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowBetPanel(!showBetPanel)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                showBetPanel ? "bg-[#FCFF52] text-black" : "bg-[#FCFF52]/15 text-[#FCFF52] border border-[#FCFF52]/40 hover:bg-[#FCFF52]/25"
              }`}
            >
              <Target className="w-4 h-4" />
              {lang === "ENG" ? "Bet Panel" : "Panel Taruhan"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showBetPanel ? "rotate-180" : ""}`} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Leaderboard */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#35D07F]" />
              {lang === "ENG" ? "Live Leaderboard" : "Papan Peringkat Live"}
            </h2>
            <div className="space-y-3">
              {sortedPlayers.map((p, idx) => (
                <motion.div
                  key={p.user_wallet}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="flex items-center gap-4 p-5 rounded-2xl border transition-all"
                  style={{
                    background: idx === 0 ? "rgba(253,224,71,0.08)" : idx === 1 ? "rgba(209,213,219,0.05)" : "rgba(255,255,255,0.03)",
                    borderColor: idx < 3 ? `${RANK_COLORS[idx]}40` : "rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl"
                    style={{ background: idx < 3 ? `${RANK_COLORS[idx]}25` : "rgba(255,255,255,0.05)" }}
                  >
                    {idx < 3 ? MEDALS[idx] : `#${idx + 1}`}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                    {p.avatar_emoji || "👤"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-lg truncate">{p.player_name || "Anonymous"}</p>
                    <p className="text-xs text-gray-500 font-mono">{p.user_wallet}</p>
                  </div>
                  {myBet === p.user_wallet && (
                    <span className="px-3 py-1 rounded-full bg-[#FCFF52]/20 text-[#FCFF52] text-xs font-bold">
                      🎯 {lang === "ENG" ? "Your Bet" : "Taruhanmu"}
                    </span>
                  )}
                  {bets.filter(b => b.playerWallet === p.user_wallet).length > 0 && myBet !== p.user_wallet && (
                    <span className="px-2 py-1 rounded-full bg-white/5 text-gray-400 text-xs font-bold">
                      {bets.filter(b => b.playerWallet === p.user_wallet).length} bet
                    </span>
                  )}
                  <motion.div key={p.final_score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-right">
                    <div className="text-2xl font-black" style={{ color: idx === 0 ? "#FDE047" : "#FCFF52" }}>
                      {p.final_score || 0}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold">pts</div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* Real-time Trading Chart */}
            {scoreHistory.length > 1 && (
              <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-3">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-[#35D07F]" />
                  {lang === "ENG" ? "Score Chart (Real-time)" : "Grafik Skor (Real-time)"}
                </h3>
                {/* Player Legend */}
                <div className="flex flex-wrap gap-2">
                  {sortedPlayers.slice(0, 6).map((p, i) => (
                    <div key={p.user_wallet} className="flex items-center gap-1.5 text-xs">
                      <div className="w-3 h-3 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-gray-400 font-mono">{p.player_name?.slice(0, 8) || "Anon"}</span>
                    </div>
                  ))}
                </div>
                {/* SVG Chart */}
                <div className="w-full h-[200px] relative">
                  <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 50, 100, 150, 200].map(y => (
                      <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}
                    {/* Player lines */}
                    {sortedPlayers.slice(0, 6).map((player, pIdx) => {
                      const maxScore = Math.max(...players.map(p => p.final_score || 1), 1);
                      const points = scoreHistory.map((entry, i) => {
                        const x = (i / Math.max(scoreHistory.length - 1, 1)) * 600;
                        const score = entry.scores[player.user_wallet] || 0;
                        const y = 190 - (score / maxScore) * 180;
                        return `${x},${y}`;
                      }).join(" ");
                      const color = CHART_COLORS[pIdx % CHART_COLORS.length];
                      return (
                        <g key={player.user_wallet}>
                          {/* Glow area */}
                          <polyline points={points + ` 600,200 0,200`} fill={`${color}10`} stroke="none" />
                          {/* Line */}
                          <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          {/* Current dot */}
                          {scoreHistory.length > 0 && (
                            <circle
                              cx="600"
                              cy={190 - ((scoreHistory[scoreHistory.length - 1]?.scores[player.user_wallet] || 0) / maxScore) * 180}
                              r="4" fill={color}
                            >
                              <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] text-gray-600 font-mono">
                    <span>{Math.max(...players.map(p => p.final_score || 0))}</span>
                    <span>{Math.floor(Math.max(...players.map(p => p.final_score || 0)) / 2)}</span>
                    <span>0</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-6">
            {/* Prizes */}
            <div className="glass rounded-[2rem] border border-[#FCFF52]/30 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-lg">
                <Gift className="w-5 h-5 text-[#FCFF52]" />
                {lang === "ENG" ? "Prize Pool" : "Hadiah"}
              </h3>
              <div className="space-y-2">
                {activePrizes.map((prize, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-xl">{MEDALS[i] || "🎁"}</span>
                    <span className="font-bold text-sm flex-1">{prize}</span>
                    <span className="text-xs text-gray-500 font-mono">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Betting Panel */}
            <AnimatePresence>
              {showBetPanel && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-[2rem] border border-[#35D07F]/30 p-6 space-y-4 overflow-hidden"
                >
                  <h3 className="font-bold flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#35D07F]" />
                    {lang === "ENG" ? "Place Your Bet" : "Pasang Taruhan"}
                  </h3>
                  {myBet ? (
                    <div className="text-center py-4 space-y-2">
                      <p className="text-[#35D07F] font-bold">✅ {lang === "ENG" ? "Bet placed!" : "Taruhan dipasang!"}</p>
                      <p className="text-sm text-gray-500">
                        {lang === "ENG" ? "You bet on" : "Kamu bertaruh pada"}: <strong>{bets.find(b => b.playerWallet === myBet)?.playerName}</strong>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <input value={betAmount} onChange={e => setBetAmount(e.target.value)} type="number" step="0.01" min="0.01"
                          className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono focus:outline-none focus:border-[#35D07F]/50"
                        />
                        <span className="text-sm font-bold text-[#FCFF52]">CELO</span>
                      </div>
                      <p className="text-xs text-gray-500">{lang === "ENG" ? "Pick a player to bet on:" : "Pilih pemain untuk taruhan:"}</p>
                      <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {sortedPlayers.map(p => (
                          <button key={p.user_wallet} onClick={() => handleBet(p.user_wallet, p.player_name)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#35D07F]/50 hover:bg-[#35D07F]/5 transition-all text-left"
                          >
                            <span className="text-lg">{p.avatar_emoji || "👤"}</span>
                            <span className="font-bold text-sm flex-1">{p.player_name}</span>
                            <span className="text-xs text-[#FCFF52] font-mono">{p.final_score} pts</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#35D07F]" />
                {lang === "ENG" ? "Live Stats" : "Statistik Live"}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-xl font-black text-[#35D07F]">{players.length}</div>
                  <div className="text-[10px] text-gray-500 font-bold">{lang === "ENG" ? "Players" : "Pemain"}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-xl font-black text-[#FCFF52]">{bets.length}</div>
                  <div className="text-[10px] text-gray-500 font-bold">{lang === "ENG" ? "Bets" : "Taruhan"}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-xl font-black text-[#FDE047]">
                    {sortedPlayers[0]?.final_score || 0}
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold">{lang === "ENG" ? "Top Score" : "Skor Teratas"}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 text-center">
                  <div className="text-xl font-black text-white">{formatTime(liveTime)}</div>
                  <div className="text-[10px] text-gray-500 font-bold">{lang === "ENG" ? "Duration" : "Durasi"}</div>
                </div>
              </div>
            </div>

            {/* Finish & Celebrate */}
            <button onClick={handleFinish}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-extrabold hover:shadow-[0_0_40px_rgba(53,208,127,0.4)] transition-all flex items-center justify-center gap-2 text-lg"
            >
              🏆 {lang === "ENG" ? "Finish & Show Winner" : "Selesai & Tampilkan Pemenang"}
            </button>
          </div>
        </div>
      </div>

      {/* Winner Popup - Centered Overlay */}
      <AnimatePresence>
        {showWinner && sortedPlayers.length > 0 && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              onClick={() => setShowWinner(false)}
            />
            <motion.div
              initial={{opacity:0,scale:0.5,y:40}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.5,y:40}}
              transition={{type:"spring",stiffness:300,damping:25}}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4"
            >
              <div className="rounded-[2.5rem] border-2 border-[#FCFF52]/50 p-10 text-center space-y-5 shadow-[0_0_100px_rgba(252,255,82,0.3)] bg-[#0a0a12]/95 backdrop-blur-xl">
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.2,type:"spring",stiffness:200}}
                  className="text-7xl"
                >{sortedPlayers[0]?.avatar_emoji || "🏆"}</motion.div>
                <motion.h2 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                  className="text-4xl font-extrabold text-gradient"
                >
                  🎉 {lang === "ENG" ? "Winner!" : "Pemenang!"}
                </motion.h2>
                <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.4}}
                  className="px-8 py-5 rounded-2xl bg-[#FDE047]/10 border border-[#FDE047]/30 inline-block"
                >
                  <div className="text-3xl font-black text-[#FDE047]">{sortedPlayers[0]?.player_name}</div>
                  <div className="text-lg font-mono text-[#FCFF52] mt-1">{sortedPlayers[0]?.final_score || 0} pts</div>
                </motion.div>

                {/* Top 3 */}
                <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
                  className="flex items-center justify-center gap-4 pt-2"
                >
                  {sortedPlayers.slice(0, 3).map((p, i) => (
                    <div key={p.user_wallet} className="text-center">
                      <div className="text-2xl">{MEDALS[i]}</div>
                      <div className="text-sm font-bold text-white truncate max-w-[100px]">{p.player_name}</div>
                      <div className="text-xs font-mono text-gray-400">{p.final_score} pts</div>
                      {activePrizes[i] && (
                        <div className="text-xs text-[#FCFF52] font-bold mt-1">🎁 {activePrizes[i]}</div>
                      )}
                    </div>
                  ))}
                </motion.div>

                <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
                  onClick={() => setShowWinner(false)}
                  className="mt-4 px-8 py-3 rounded-xl bg-[#FCFF52]/10 border border-[#FCFF52]/30 text-[#FCFF52] font-bold hover:bg-[#FCFF52]/20 transition-all text-sm"
                >
                  {lang === "ENG" ? "Close" : "Tutup"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function LiveReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Loading...</div>}>
      <LiveReportContent />
    </Suspense>
  );
}
