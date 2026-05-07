"use client";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Gift, RotateCcw, Sparkles, Volume2, VolumeX, Trophy
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

const DEFAULT_PRIZES = [
  { id: 1, label: "0.5 CELO", color: "#35D07F", emoji: "💰" },
  { id: 2, label: "Kaos Eksklusif", color: "#FCFF52", emoji: "👕" },
  { id: 3, label: "Tumbler", color: "#60A5FA", emoji: "☕" },
  { id: 4, label: "Sticker Pack", color: "#F472B6", emoji: "🎨" },
  { id: 5, label: "NFT Rare", color: "#A78BFA", emoji: "🖼️" },
  { id: 6, label: "Coba Lagi", color: "#6B7280", emoji: "🔄" },
];

const PRESET_PRIZES = [
  { label: "Crypto", items: [
    { label: "0.1 CELO", emoji: "💰" },
    { label: "0.5 CELO", emoji: "💎" },
    { label: "1 CELO", emoji: "🏆" },
    { label: "NFT Rare", emoji: "🖼️" },
    { label: "Coba Lagi", emoji: "🔄" },
  ]},
  { label: "Merchandise", items: [
    { label: "Kaos", emoji: "👕" },
    { label: "Tumbler", emoji: "☕" },
    { label: "Sticker", emoji: "🎨" },
    { label: "Topi", emoji: "🧢" },
    { label: "Tas Tote", emoji: "👜" },
  ]},
  { label: "Fun", items: [
    { label: "Pizza Party 🍕", emoji: "🍕" },
    { label: "Skip Tugas", emoji: "😎" },
    { label: "Jadi Host", emoji: "👑" },
    { label: "Spin Ulang", emoji: "🔄" },
    { label: "Mystery Box", emoji: "📦" },
  ]},
];

const WHEEL_COLORS = [
  "#35D07F", "#FCFF52", "#60A5FA", "#F472B6", "#A78BFA",
  "#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#EC4899",
  "#06B6D4", "#F97316",
];

interface Prize {
  id: number;
  label: string;
  color: string;
  emoji: string;
}

export default function SpinWheelPage() {
  const { lang } = useLanguage();
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [newPrize, setNewPrize] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [soundOn, setSoundOn] = useState(true);
  const [spinHistory, setSpinHistory] = useState<Prize[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const sliceAngle = (2 * Math.PI) / prizes.length;

    ctx.clearRect(0, 0, size, size);

    // Shadow
    ctx.save();
    ctx.shadowColor = "rgba(53,208,127,0.3)";
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    prizes.forEach((prize, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.font = `bold ${Math.max(10, 16 - prizes.length)}px 'Outfit', sans-serif`;
      const textR = radius * 0.62;
      ctx.fillText(prize.emoji, textR, -6);
      ctx.font = `bold ${Math.max(8, 12 - prizes.length)}px 'Outfit', sans-serif`;
      ctx.fillText(prize.label.length > 12 ? prize.label.slice(0, 11) + "…" : prize.label, textR, 10);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#0A0A0A";
    ctx.fill();
    ctx.strokeStyle = "#35D07F";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = "#35D07F";
    ctx.font = "bold 16px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", center, center);
  }, [prizes]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  const spin = () => {
    if (isSpinning || prizes.length < 2) return;
    setIsSpinning(true);
    setShowResult(false);
    setWinner(null);

    const winnerIdx = Math.floor(Math.random() * prizes.length);
    const sliceAngle = 360 / prizes.length;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - (winnerIdx * sliceAngle + sliceAngle / 2);
    const totalRotation = rotation + extraSpins * 360 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(prizes[winnerIdx]);
      setShowResult(true);
      setSpinHistory(prev => [prizes[winnerIdx], ...prev].slice(0, 10));
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#35D07F", "#FCFF52", "#FDE047", "#A78BFA"],
      });
    }, 4500);
  };

  const addPrize = () => {
    if (!newPrize.trim()) return;
    const id = Date.now();
    const color = WHEEL_COLORS[prizes.length % WHEEL_COLORS.length];
    setPrizes(prev => [...prev, { id, label: newPrize.trim(), color, emoji: newEmoji }]);
    setNewPrize("");
    setNewEmoji("🎁");
  };

  const removePrize = (id: number) => {
    if (prizes.length <= 2) return;
    setPrizes(prev => prev.filter(p => p.id !== id));
  };

  const applyPreset = (items: { label: string; emoji: string }[]) => {
    setPrizes(items.map((item, i) => ({
      id: Date.now() + i,
      label: item.label,
      color: WHEEL_COLORS[i % WHEEL_COLORS.length],
      emoji: item.emoji,
    })));
  };

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#35D07F]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#FCFF52]/10 blur-[150px] rounded-full" />
      </div>

      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Back" : "Kembali"}</span>
        </Link>
        <button onClick={() => setSoundOn(!soundOn)} className="p-2 rounded-xl glass border border-white/10">
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            🎡 <span className="text-gradient">{lang === "ENG" ? "Spin & Win" : "Putar & Menang"}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {lang === "ENG" ? "Customize prizes and spin the wheel!" : "Atur hadiah dan putar rodanya!"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT: Prize Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Presets */}
            <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-4">
              <h3 className="font-bold text-sm text-gray-500">{lang === "ENG" ? "Quick Presets" : "Preset Cepat"}</h3>
              <div className="flex flex-wrap gap-2">
                {PRESET_PRIZES.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.items)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:border-[#35D07F]/50 hover:text-[#35D07F] transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prize List */}
            <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#FCFF52]" />
                {lang === "ENG" ? "Prize List" : "Daftar Hadiah"} ({prizes.length})
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {prizes.map(prize => (
                  <div key={prize.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: prize.color + "30" }}>
                      {prize.emoji}
                    </div>
                    <span className="flex-1 font-semibold text-sm truncate">{prize.label}</span>
                    <button onClick={() => removePrize(prize.id)} disabled={prizes.length <= 2} className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all disabled:opacity-20">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Prize */}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <select value={newEmoji} onChange={e => setNewEmoji(e.target.value)} className="w-14 px-2 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                  {["🎁","💰","👕","☕","🎨","🖼️","🏆","📦","🧢","👜","🍕","😎","👑","🔄","💎","🎮"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <input
                  value={newPrize}
                  onChange={e => setNewPrize(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addPrize()}
                  placeholder={lang === "ENG" ? "Prize name..." : "Nama hadiah..."}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-[#35D07F]/50"
                />
                <button onClick={addPrize} className="px-4 py-2 rounded-xl bg-[#35D07F]/20 text-[#35D07F] font-bold text-sm hover:bg-[#35D07F]/30 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* History */}
            {spinHistory.length > 0 && (
              <div className="glass rounded-[2rem] border border-white/10 p-6 space-y-3">
                <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {lang === "ENG" ? "Spin History" : "Riwayat Spin"}
                </h3>
                <div className="space-y-1">
                  {spinHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-gray-500 text-xs w-5">#{i + 1}</span>
                      <span>{h.emoji}</span>
                      <span className="font-semibold">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Wheel */}
          <div className="lg:col-span-3 flex flex-col items-center gap-8">
            {/* Wheel Container */}
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
                <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-[#FCFF52] drop-shadow-[0_0_10px_rgba(252,255,82,0.6)]" />
              </div>

              {/* Wheel */}
              <div
                className="relative"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                }}
              >
                <canvas ref={canvasRef} width={380} height={380} className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]" />
              </div>

              {/* Glow ring */}
              <div className={`absolute inset-0 rounded-full border-4 pointer-events-none transition-all duration-500 ${isSpinning ? "border-[#FCFF52]/60 shadow-[0_0_40px_rgba(252,255,82,0.4)]" : "border-[#35D07F]/20"}`} />
            </div>

            {/* Spin Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={spin}
              disabled={isSpinning || prizes.length < 2}
              className="px-12 py-5 rounded-2xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-extrabold text-xl hover:shadow-[0_0_40px_rgba(53,208,127,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isSpinning ? (
                <><RotateCcw className="w-6 h-6 animate-spin" /> {lang === "ENG" ? "Spinning..." : "Memutar..."}</>
              ) : (
                <><Sparkles className="w-6 h-6" /> {lang === "ENG" ? "SPIN!" : "PUTAR!"}</>
              )}
            </motion.button>

            {/* Result Modal */}
            <AnimatePresence>
              {showResult && winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="glass rounded-[2.5rem] border border-[#FCFF52]/40 p-10 text-center space-y-4 w-full max-w-sm shadow-[0_0_60px_rgba(252,255,82,0.15)]"
                >
                  <div className="text-6xl">{winner.emoji}</div>
                  <h2 className="text-2xl font-extrabold text-gradient">
                    {lang === "ENG" ? "You Won!" : "Kamu Menang!"}
                  </h2>
                  <div className="px-6 py-4 rounded-2xl text-xl font-black" style={{ background: winner.color + "20", color: winner.color }}>
                    {winner.label}
                  </div>
                  <button
                    onClick={() => { setShowResult(false); setWinner(null); }}
                    className="text-sm text-gray-500 hover:text-white transition-colors"
                  >
                    {lang === "ENG" ? "Close" : "Tutup"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
