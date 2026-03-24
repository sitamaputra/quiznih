"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Wallet2, Send, GripVertical, Copy, CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

// QR Code display component
function QRDisplay({ value }: { value: string }) {
  const size = 17;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      // Finder patterns (top-left, top-right, bottom-left)
      const inTL = r < 4 && c < 4;
      const inTR = r < 4 && c >= size - 4;
      const inBL = r >= size - 4 && c < 4;
      if (inTL || inTR || inBL) {
        const lr = r < 4 ? r : r - (size - 4);
        const lc = c < 4 ? c : c - (size - 4);
        grid[r][c] = lr === 0 || lr === 3 || lc === 0 || lc === 3 || (lr >= 1 && lr <= 2 && lc >= 1 && lc <= 2);
      } else {
        const code = value.charCodeAt((r * size + c) % value.length) || 42;
        grid[r][c] = ((code * (r + 1) * (c + 1)) % 5) > 1;
      }
    }
  }
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {grid.flat().map((filled, idx) => (
        <div
          key={idx}
          className={`w-[10px] h-[10px] sm:w-3 sm:h-3 rounded-[1px] ${filled ? "bg-black" : "bg-white"}`}
        />
      ))}
    </div>
  );
}

interface QuestionData {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
}

export default function CreateQuizPage() {
  const { lang } = useLanguage();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!publicKey) setVisible(true);
  }, [publicKey, setVisible]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardPool, setRewardPool] = useState("0");
  const [questions, setQuestions] = useState<QuestionData[]>([
    { id: 1, text: "", options: ["", "", "", ""], correctIndex: 0, timeLimit: 20 },
  ]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        timeLimit: 20,
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qId: number, optIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const [roomCode, setRoomCode] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

  // Simulate players joining
  useEffect(() => {
    if (!isPublished) return;
    const interval = setInterval(() => {
      setPlayerCount((prev) => {
        if (prev >= 8) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isPublished]);

  const handlePublish = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    setIsPublished(true);
  };

  const walletShort = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "";

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      {/* Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-[400px] h-[400px] bg-[#9945FF]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#14F195]/10 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Dashboard" : "Dasbor"}</span>
        </Link>
        {publicKey && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#9945FF]/30">
            <Wallet2 className="w-4 h-4 text-[#9945FF]" />
            <span className="text-sm font-mono font-semibold">{walletShort}</span>
          </div>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            {lang === "ENG" ? "Create " : "Buat "}
            <span className="text-gradient">{lang === "ENG" ? "Quiz" : "Kuis"}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {lang === "ENG"
              ? "Design your quiz, set rewards, and share with players."
              : "Rancang kuis, tentukan hadiah, dan bagikan ke pemain."}
          </p>
        </motion.div>

        {isPublished ? (
          /* Published State - Host Control Room */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Success Banner */}
            <div className="glass rounded-[2.5rem] border border-[#14F195]/40 p-10 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#14F195] to-[#0EC97F] flex items-center justify-center shadow-[0_0_40px_rgba(20,241,149,0.3)]">
                <Send className="w-10 h-10 text-black" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold">
                  {lang === "ENG" ? "Quiz Published!" : "Kuis Dipublikasikan!"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {lang === "ENG"
                    ? "Share the QR code or room code with your players"
                    : "Bagikan QR code atau kode ruangan ke pemain Anda"}
                </p>
              </div>
            </div>

            {/* QR Code + Room Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code Card */}
              <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 flex flex-col items-center space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  📱 {lang === "ENG" ? "QR Code" : "Kode QR"}
                </h3>
                {/* QR Code Visual */}
                <div className="bg-white p-5 rounded-2xl shadow-lg">
                  <QRDisplay value={`quiznih:${roomCode}`} />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {lang === "ENG" 
                    ? "Players can scan this to join instantly"
                    : "Pemain bisa scan ini untuk bergabung langsung"}
                </p>
              </div>

              {/* Room Code Card */}
              <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 flex flex-col items-center justify-center space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  🔑 {lang === "ENG" ? "Room Code" : "Kode Ruangan"}
                </h3>
                <div className="px-10 py-5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-mono text-4xl md:text-5xl font-extrabold tracking-[0.3em] shadow-[0_0_40px_rgba(153,69,255,0.2)]">
                  {roomCode}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#9945FF]/10 hover:bg-[#9945FF]/20 border border-[#9945FF]/30 text-[#9945FF] font-bold text-sm transition-all flex items-center gap-2"
                >
                  {copied 
                    ? <><CheckCircle className="w-4 h-4" /> {lang === "ENG" ? "Copied!" : "Tersalin!"}</> 
                    : <><Copy className="w-4 h-4" /> {lang === "ENG" ? "Copy Code" : "Salin Kode"}</>}
                </button>
              </div>
            </div>

            {/* Host Waiting Room */}
            <div className="glass rounded-[2rem] border border-black/10 dark:border-white/10 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  👥 {lang === "ENG" ? "Waiting Room" : "Ruang Tunggu"}
                </h3>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/30">
                  <div className="w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                  <span className="text-sm font-semibold text-[#14F195]">
                    {playerCount} {lang === "ENG" ? "players joined" : "pemain bergabung"}
                  </span>
                </div>
              </div>

              {/* Simulated Player List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: playerCount }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9945FF]/50 to-[#14F195]/50 flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm font-mono truncate">
                      {`${["8N", "Hk", "2d", "Fp", "Gz", "Jm", "Kp", "Lx"][idx % 8]}...${["3vJ", "Zq2", "9p1", "Kw9", "Mv5", "Rn7", "Tu3", "Wo8"][idx % 8]}`}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Quiz Summary */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="px-4 py-2 rounded-xl bg-[#9945FF]/10 text-sm font-semibold">
                  📝 {questions.length} {lang === "ENG" ? "Questions" : "Soal"}
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#14F195]/10 text-sm font-semibold">
                  💰 {rewardPool} SOL
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#FDE047]/10 text-sm font-semibold">
                  ⏱ {questions.reduce((a, q) => a + q.timeLimit, 0)}s {lang === "ENG" ? "total" : "total"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  // Simulate starting quiz
                  alert(lang === "ENG" ? "Quiz started! 🚀" : "Kuis dimulai! 🚀");
                }}
                className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all duration-300 flex items-center justify-center gap-3"
              >
                🚀 {lang === "ENG" ? "Start Quiz Now" : "Mulai Kuis Sekarang"}
              </button>
              <Link
                href="/dashboard"
                className="py-5 px-8 rounded-2xl glass border border-black/10 dark:border-white/20 font-bold text-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                {lang === "ENG" ? "Back to Dashboard" : "Kembali ke Dasbor"}
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Quiz Form */
          <div className="space-y-8">
            {/* Quiz Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-[2rem] p-8 border border-black/10 dark:border-white/10 space-y-6"
            >
              <h2 className="text-xl font-bold flex items-center gap-2">
                📝 {lang === "ENG" ? "Quiz Information" : "Informasi Kuis"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {lang === "ENG" ? "Quiz Title" : "Judul Kuis"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={lang === "ENG" ? "e.g. Solana Ecosystem Mastery" : "contoh: Penguasaan Ekosistem Solana"}
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {lang === "ENG" ? "Description" : "Deskripsi"}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder={lang === "ENG" ? "Brief description..." : "Deskripsi singkat..."}
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    {lang === "ENG" ? "Reward Pool (SOL)" : "Total Hadiah (SOL)"}
                  </label>
                  <input
                    type="number"
                    value={rewardPool}
                    onChange={(e) => setRewardPool(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14F195]/50 transition-all text-lg font-mono"
                  />
                </div>
              </div>
            </motion.div>

            {/* Questions */}
            {questions.map((q, qIdx) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + qIdx * 0.05 }}
                className="glass rounded-[2rem] p-8 border border-black/10 dark:border-white/10 space-y-5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-bold">
                      {lang === "ENG" ? `Question ${qIdx + 1}` : `Soal ${qIdx + 1}`}
                    </h3>
                  </div>
                  {questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                  placeholder={lang === "ENG" ? "Enter your question..." : "Tulis pertanyaanmu..."}
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9945FF]/50 transition-all"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="relative">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                        placeholder={`${lang === "ENG" ? "Option" : "Opsi"} ${String.fromCharCode(65 + optIdx)}`}
                        className={`w-full px-5 py-3 rounded-xl border transition-all focus:outline-none ${
                          q.correctIndex === optIdx
                            ? "bg-[#14F195]/10 border-[#14F195]/50 ring-2 ring-[#14F195]/30"
                            : "bg-white/50 dark:bg-white/5 border-black/10 dark:border-white/10"
                        } text-black dark:text-white placeholder-gray-400`}
                      />
                      <button
                        onClick={() => updateQuestion(q.id, "correctIndex", optIdx)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-0.5 rounded-md transition-all ${
                          q.correctIndex === optIdx
                            ? "bg-[#14F195] text-black"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-[#14F195]/50"
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-500 font-semibold">
                    ⏱ {lang === "ENG" ? "Time limit:" : "Batas waktu:"}
                  </label>
                  <select
                    value={q.timeLimit}
                    onChange={(e) => updateQuestion(q.id, "timeLimit", Number(e.target.value))}
                    className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white focus:outline-none"
                  >
                    <option value={10}>10s</option>
                    <option value={15}>15s</option>
                    <option value={20}>20s</option>
                    <option value={30}>30s</option>
                    <option value={60}>60s</option>
                  </select>
                </div>
              </motion.div>
            ))}

            {/* Add Question */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addQuestion}
              className="w-full py-5 rounded-2xl border-2 border-dashed border-[#9945FF]/30 hover:border-[#9945FF]/60 text-[#9945FF] font-bold flex items-center justify-center gap-2 hover:bg-[#9945FF]/5 transition-all"
            >
              <Plus className="w-5 h-5" />
              {lang === "ENG" ? "Add Question" : "Tambah Soal"}
            </motion.button>

            {/* Publish */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handlePublish}
              disabled={!title || questions.some((q) => !q.text || q.options.some((o) => !o))}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-black font-extrabold text-lg hover:shadow-[0_0_40px_rgba(153,69,255,0.4)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Send className="w-6 h-6" />
              {lang === "ENG" ? "Publish Quiz" : "Publikasikan Kuis"}
            </motion.button>
          </div>
        )}
      </div>
    </main>
  );
}
