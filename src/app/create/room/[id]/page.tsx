"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Wallet2, Send, Copy, CheckCircle, Loader2, Users, Trophy, Trash2 
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// QR Code display component
function QRDisplay({ value }: { value: string }) {
  const size = 17;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
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
          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px] ${filled ? "bg-black" : "bg-white"}`}
        />
      ))}
    </div>
  );
}

export default function QuizControlRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const { lang } = useLanguage();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const [quizData, setQuizData] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch Quiz
        const { data: qData, error: qError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (qError || !qData) throw qError || new Error("Quiz not found");
        
        // Security: Ensure the user is the host
        if (qData.host_wallet !== publicKey.toString()) {
          alert("Unauthorized");
          router.push("/dashboard");
          return;
        }

        setQuizData(qData);

        // Fetch Initial Participants
        const { data: pData } = await supabase
          .from("leaderboard")
          .select("*")
          .eq("quiz_id", quizId);
        
        setParticipants(pData || []);
      } catch (err) {
        console.error("Error loading quiz:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to Participants (Leaderboard Changes)
    const channel = supabase
      .channel(`room-${quizId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leaderboard',
        filter: `quiz_id=eq.${quizId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => prev.map(p => p.user_wallet === payload.new.user_wallet ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quizId, publicKey, setVisible, router]);

  const handleStartQuiz = async () => {
    setIsStarting(true);
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ status: 'playing' })
        .eq("id", quizId);
      
      if (error) throw error;
      setQuizData(prev => ({ ...prev, status: 'playing' }));
    } catch (err) {
      console.error("Error starting quiz:", err);
      alert("Failed to start quiz.");
    } finally {
      setIsStarting(false);
    }
  };

  const kickPlayer = async (wallet: string) => {
    if (!confirm(lang === "ENG" ? "Remove this player?" : "Hapus pemain ini?")) return;
    try {
      const { error } = await supabase
        .from("leaderboard")
        .delete()
        .eq("quiz_id", quizId)
        .eq("user_wallet", wallet);
      if (error) throw error;
    } catch (err) {
      console.error("Error kicking:", err);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-[#9945FF]">Loading Room...</div>;
  if (!quizData) return <div className="min-h-screen flex items-center justify-center">Quiz not found</div>;

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-[#9945FF]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-[#14F195]/10 blur-[150px] rounded-full" />
      </div>

      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/manage" className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Back to Management" : "Kembali ke Manajemen"}</span>
        </Link>
        <div className="px-4 py-2 rounded-full glass border border-[#9945FF]/30 text-sm font-mono font-bold">
          {quizData.room_code}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 pt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Header Info */}
          <div className="glass rounded-[2.5rem] p-10 border border-white/5 space-y-4">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gradient">{quizData.title}</h1>
            <p className="text-gray-500">{quizData.description}</p>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-[#9945FF]">
                {quizData.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* QR Card */}
            <div className="glass rounded-[2rem] border border-white/5 p-8 flex flex-col items-center space-y-6">
              <h3 className="text-lg font-bold">📱 {lang === "ENG" ? "QR Code" : "Kode QR"}</h3>
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <QRDisplay value={`quiznih:${quizData.room_code}`} />
              </div>
            </div>

            {/* Room Code Card */}
            <div className="glass rounded-[2rem] border border-white/5 p-8 flex flex-col items-center justify-center space-y-6">
              <h3 className="text-lg font-bold">🔑 {lang === "ENG" ? "Room Code" : "Kode Ruangan"}</h3>
              <div className="px-8 py-4 rounded-xl bg-black dark:bg-white text-white dark:text-black font-mono text-3xl font-extrabold tracking-widest">
                {quizData.room_code}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(quizData.room_code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-sm font-bold text-[#9945FF] hover:underline"
              >
                {copied ? (lang === "ENG" ? "Copied!" : "Tersalin!") : (lang === "ENG" ? "Copy Code" : "Salin Kode")}
              </button>
            </div>
          </div>

          {/* Waiting Room / Leaderboard */}
          <div className="glass rounded-[2rem] border border-white/5 p-8 space-y-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Users className="w-6 h-6 text-[#14F195]" />
                {lang === "ENG" ? "Participants" : "Peserta"}
              </h3>
              <div className="px-4 py-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/30 text-[#14F195] font-bold text-sm">
                {participants.length} {lang === "ENG" ? "Players Online" : "Pemain Online"}
              </div>
            </div>

            <div className="space-y-3">
              {participants.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic">
                  {lang === "ENG" ? "No players joined yet..." : "Belum ada pemain yang bergabung..."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {participants
                    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
                    .map((p, idx) => (
                      <motion.div
                        key={p.user_wallet}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 group"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                            idx === 0 ? "bg-[#FDE047] text-black" : "bg-white/10 text-gray-400"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold">{p.player_name || "Anonymous"}</p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {`${p.user_wallet.slice(0, 4)}...${p.user_wallet.slice(-4)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[#14F195] font-bold">{p.final_score} pts</span>
                          <button
                            onClick={() => kickPlayer(p.user_wallet)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Start Quiz Action */}
          {quizData.status !== "finished" && (
            <button
              onClick={handleStartQuiz}
              disabled={isStarting || participants.length === 0 || quizData.status === 'playing'}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-extrabold text-xl hover:shadow-[0_0_50px_rgba(153,69,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isStarting ? (
                <><Loader2 className="w-8 h-8 animate-spin" /> {lang === "ENG" ? "Starting..." : "Memulai..."}</>
              ) : quizData.status === 'playing' ? (
                <>🚀 {lang === "ENG" ? "Quiz Live!" : "Kuis Sedang Berlangsung!"}</>
              ) : (
                <>🚀 {lang === "ENG" ? "Start Quiz Now" : "Mulai Kuis Sekarang"}</>
              )}
            </button>
          )}
        </motion.div>
      </div>
    </main>
  );
}
