"use client";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Gift, RotateCcw, Sparkles, Trophy, Users, UserPlus, Clock, Camera, Video, VideoOff, Download } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { useCapture } from "@/hooks/useCapture";
import TopBar from "@/components/TopBar";

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

interface Item { id: number; label: string; color: string; emoji: string; }

export default function SpinWheelPage() {
  const { lang } = useLanguage();
  // Mode: "prize" = spin prizes, "name" = spin names
  const [mode, setMode] = useState<"prize"|"name">("prize");
  const { takeScreenshot, startRecording, stopRecording, isRecording, recordingTime, formatRecTime } = useCapture();
  const captureRef = useRef<HTMLDivElement>(null);

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
      setWinner(items[winIdx]); setShowResult(true);
      setHistory(prev => [{item:items[winIdx], prize: mode==="name"?activePrize:undefined}, ...prev].slice(0,15));
      confetti({ particleCount: 180, spread: 90, origin:{y:0.45}, colors:["#35D07F","#FCFF52","#FDE047","#A78BFA"] });
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
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#35D07F]/10 blur-[150px] rounded-full"/>
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#FCFF52]/10 blur-[150px] rounded-full"/>
      </div>

      <TopBar backHref="/dashboard" />

      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-4 flex items-center justify-end gap-2 flex-wrap">
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
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/20 dark:bg-white/5 border border-white/10">
            <button onClick={()=>switchMode("prize")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==="prize"?"bg-[#35D07F] text-white shadow-md":"text-gray-400 hover:text-white"}`}>
              <Gift className="w-4 h-4"/> {lang==="ENG"?"Prizes":"Hadiah"}
            </button>
            <button onClick={()=>switchMode("name")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode==="name"?"bg-[#FCFF52] text-black shadow-md":"text-gray-400 hover:text-white"}`}>
              <Users className="w-4 h-4"/> {lang==="ENG"?"Names":"Nama"}
            </button>
          </div>
      </header>

      <div ref={captureRef} className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            🎡 <span className="text-gradient">{mode==="prize"?(lang==="ENG"?"Spin & Win":"Putar & Menang"):(lang==="ENG"?"Random Picker":"Pilih Acak")}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode==="prize"
              ?(lang==="ENG"?"Customize prizes and spin!":"Atur hadiah dan putar!")
              :(lang==="ENG"?"Add names, pick a prize, spin to choose!":"Masukkan nama, pilih hadiah, putar untuk memilih!")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* LEFT PANEL */}
          <div className="lg:col-span-2 space-y-5">
            {/* Duration Selector */}
            <div className="glass rounded-[2rem] border border-white/10 p-5 space-y-3">
              <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4"/> {lang==="ENG"?"Spin Duration":"Durasi Spin"}</h3>
              <div className="flex gap-2">
                {DURATIONS.map(d=>(
                  <button key={d.val} onClick={()=>{setDuration(d.val);setCustomDur("");}}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${duration===d.val&&!customDur?"bg-[#35D07F] text-white":"bg-white/5 border border-white/10 text-gray-400 hover:border-[#35D07F]/50"}`}>
                    {d.label}
                  </button>
                ))}
                <input value={customDur} onChange={e=>{setCustomDur(e.target.value);const v=parseInt(e.target.value);if(v>0&&v<=60)setDuration(v);}}
                  placeholder="Custom" type="number" min="1" max="60"
                  className="w-20 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-center font-mono placeholder-gray-600 focus:outline-none focus:border-[#35D07F]/50"/>
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
            <div className="glass rounded-[2rem] border border-white/10 p-5 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                {mode==="prize"?<Gift className="w-5 h-5 text-[#FCFF52]"/>:<Users className="w-5 h-5 text-[#35D07F]"/>}
                {mode==="prize"?(lang==="ENG"?"Prizes":"Hadiah"):(lang==="ENG"?"Names":"Daftar Nama")} ({items.length})
              </h3>
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {items.map(item=>(
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{background:item.color+"30"}}>{item.emoji}</div>
                    <span className="flex-1 font-semibold text-sm truncate">{item.label}</span>
                    <button onClick={()=>removeItem(item.id)} disabled={items.length<=2} className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all disabled:opacity-20">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <input value={newEntry} onChange={e=>setNewEntry(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEntry()}
                  placeholder={mode==="prize"?(lang==="ENG"?"Add prize...":"Tambah hadiah..."):(lang==="ENG"?"Add name...":"Tambah nama...")}
                  className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-gray-500 focus:outline-none focus:border-[#35D07F]/50"/>
                <button onClick={addEntry} className="px-4 py-2 rounded-xl bg-[#35D07F]/20 text-[#35D07F] font-bold text-sm hover:bg-[#35D07F]/30 transition-all">
                  <Plus className="w-4 h-4"/>
                </button>
              </div>
            </div>

            {/* History */}
            {history.length>0&&(
              <div className="glass rounded-[2rem] border border-white/10 p-5 space-y-3">
                <h3 className="font-bold text-sm text-gray-500 flex items-center gap-2"><Trophy className="w-4 h-4"/> {lang==="ENG"?"History":"Riwayat"}</h3>
                <div className="space-y-1">
                  {history.map((h,i)=>(
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-gray-500 text-xs w-5">#{i+1}</span>
                      <span>{h.item.emoji}</span>
                      <span className="font-semibold flex-1">{h.item.label}</span>
                      {h.prize&&<span className="text-xs text-[#FCFF52] font-bold px-2 py-0.5 rounded-full bg-[#FCFF52]/10">🎁 {h.prize}</span>}
                    </div>
                  ))}
                </div>
                <button onClick={()=>setHistory([])} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
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
                <canvas ref={canvasRef} width={560} height={560} className="w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] md:w-[560px] md:h-[560px]"/>
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
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
              onClick={()=>{setShowResult(false);setWinner(null);}}
            />
            <motion.div
              initial={{opacity:0,scale:0.5,y:40}}
              animate={{opacity:1,scale:1,y:0}}
              exit={{opacity:0,scale:0.5,y:40}}
              transition={{type:"spring",stiffness:300,damping:25}}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg p-4"
            >
              <div className="rounded-[2.5rem] border-2 border-[#FCFF52]/50 p-10 text-center space-y-5 shadow-[0_0_100px_rgba(252,255,82,0.25)] bg-[#0a0a12]/95 backdrop-blur-xl">
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
                <motion.button initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
                  onClick={()=>{setShowResult(false);setWinner(null);}}
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
