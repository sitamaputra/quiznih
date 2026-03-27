"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Wallet2, Send, Copy, CheckCircle, Loader2, Users, Trophy, Trash2, ShieldX
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";



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
    // Optimistic update: set playing locally immediately so button is never stuck
    setQuizData((prev: any) => ({ ...prev, status: 'playing' }));
    try {
      const { error } = await supabase
        .from("quizzes")
        .update({ status: 'playing' })
        .eq("id", quizId);
      
      if (error) {
        console.warn("Supabase update failed, local state still updated:", error);
      }
    } catch (err) {
      console.warn("Error starting quiz (non-blocking):", err);
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
        {/* ===== LIVE LEADERBOARD VIEW (when playing) ===== */}
        {quizData.status === 'playing' ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Live Banner */}
            <div className="glass rounded-[2.5rem] p-8 border border-[#14F195]/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(20,241,149,0.15)]">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500 text-white text-xs font-extrabold uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping inline-block" />
                    LIVE
                  </span>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gradient">{quizData.title}</h1>
                </div>
                <p className="text-gray-500 text-sm">{lang === "ENG" ? "Real-time player scores" : "Skor pemain secara real-time"}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center px-5 py-3 rounded-2xl bg-[#14F195]/10 border border-[#14F195]/30">
                  <div className="text-2xl font-black text-[#14F195]">{participants.length}</div>
                  <div className="text-xs text-gray-500 font-bold">{lang === "ENG" ? "Players" : "Pemain"}</div>
                </div>
                <button
                  onClick={() => {
                    confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 }, colors: ['#9945FF','#14F195','#FDE047'] });
                  }}
                  className="px-4 py-3 rounded-2xl bg-[#FDE047]/10 border border-[#FDE047]/30 text-[#FDE047] font-bold text-sm hover:bg-[#FDE047]/20 transition-all"
                >
                  🎉 {lang === "ENG" ? "Celebrate!" : "Rayakan!"}
                </button>
              </div>
            </div>

            {/* Live Leaderboard */}
            <div className="glass rounded-[2.5rem] border border-white/10 p-8 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[#FDE047]" />
                  {lang === "ENG" ? "Live Leaderboard" : "Papan Peringkat Live"}
                </h2>
                <span className="text-xs text-gray-500 animate-pulse font-semibold">
                  {lang === "ENG" ? "Updates automatically" : "Update otomatis"}
                </span>
              </div>

              {participants.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic">
                  {lang === "ENG" ? "Waiting for players to answer..." : "Menunggu pemain menjawab..."}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...participants]
                    .sort((a, b) => (b.final_score || 0) - (a.final_score || 0))
                    .map((p, idx) => {
                      const MEDALS = ['🥇','🥈','🥉'];
                      const COLORS = ['#FDE047','#D1D5DB','#CD7C2F'];
                      return (
                        <motion.div
                          key={p.user_wallet}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          className="flex items-center gap-4 p-5 rounded-2xl border transition-all"
                          style={{
                            background: idx === 0 ? 'rgba(253,224,71,0.08)' : idx === 1 ? 'rgba(209,213,219,0.05)' : 'rgba(255,255,255,0.03)',
                            borderColor: idx < 3 ? `${COLORS[idx]}40` : 'rgba(255,255,255,0.08)'
                          }}
                        >
                          {/* Rank */}
                          <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-xl"
                            style={{ background: idx < 3 ? `${COLORS[idx]}25` : 'rgba(255,255,255,0.05)' }}
                          >
                            {idx < 3 ? MEDALS[idx] : `#${idx+1}`}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-lg truncate">{p.player_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500 font-mono">{`${p.user_wallet.slice(0,4)}...${p.user_wallet.slice(-4)}`}</p>
                          </div>

                          {/* Score */}
                          <div className="text-right">
                            <motion.div
                              key={p.final_score}
                              initial={{ scale: 1.3, color: '#14F195' }}
                              animate={{ scale: 1, color: idx === 0 ? '#FDE047' : '#14F195' }}
                              className="text-2xl font-black"
                            >
                              {p.final_score || 0}
                            </motion.div>
                            <div className="text-xs text-gray-500 font-semibold">pts</div>
                          </div>

                          {/* Kick */}
                          <button
                            onClick={() => {
                              const reason = prompt(
                                lang === "ENG" ? `Kick "${p.player_name}" for cheating?` : `Keluarkan "${p.player_name}" karena curang?`
                              );
                              if (reason !== null) kickPlayer(p.user_wallet);
                            }}
                            className="ml-2 p-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 transition-all"
                            title="Kick"
                          >
                            <ShieldX className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* End Quiz */}
            <button
              onClick={async () => {
                if (!confirm(lang === "ENG" ? "End the quiz and show final results?" : "Akhiri kuis dan tampilkan hasil akhir?")) return;
                await supabase.from("quizzes").update({ status: 'finished' }).eq("id", quizId);
                setQuizData((prev: any) => ({ ...prev, status: 'finished' }));
                confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 }, colors: ['#9945FF','#14F195','#FDE047'] });
              }}
              className="w-full py-5 rounded-2xl border-2 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-lg flex items-center justify-center gap-3 transition-all"
            >
              🏁 {lang === "ENG" ? "End Quiz & Show Results" : "Akhiri Kuis & Tampilkan Hasil"}
            </button>
          </motion.div>

        ) : quizData.status === 'finished' ? (
          /* ===== FINISHED / PODIUM VIEW ===== */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center"
          >
            <div className="glass rounded-[2.5rem] border border-[#FDE047]/40 p-10 space-y-6">
              <div className="text-7xl">🏆</div>
              <h2 className="text-4xl font-extrabold text-gradient">{lang === "ENG" ? "Quiz Finished!" : "Kuis Selesai!"}</h2>
              {participants.length > 0 && (
                <div className="space-y-3 pt-4">
                  {[...participants]
                    .sort((a,b) => (b.final_score||0)-(a.final_score||0))
                    .slice(0,3)
                    .map((p,idx) => (
                      <div key={p.user_wallet} className={`flex items-center justify-between p-4 rounded-2xl ${
                        idx===0?'bg-[#FDE047]/15 border border-[#FDE047]/40':idx===1?'bg-white/5 border border-white/10':'bg-white/3 border border-white/5'
                      }`}>
                        <span className="text-2xl">{['🥇','🥈','🥉'][idx]}</span>
                        <span className="font-extrabold text-lg">{p.player_name}</span>
                        <span className="font-black text-[#14F195] text-xl">{p.final_score||0} pts</span>
                      </div>
                    ))}
                </div>
              )}
              <Link href="/manage" className="inline-block mt-4 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold hover:shadow-[0_0_30px_rgba(153,69,255,0.4)] transition-all">
                {lang === "ENG" ? "Back to Dashboard" : "Kembali ke Dasbor"}
              </Link>
            </div>
          </motion.div>

        ) : (
          /* ===== WAITING / SETUP VIEW ===== */
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
              <h3 className="text-lg font-bold">📱 {lang === "ENG" ? "Scan to Join" : "Scan untuk Gabung"}</h3>
              <div className="bg-white p-4 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <QRCodeSVG value={`https://quiznih.vercel.app/play?code=${quizData.room_code}`} size={160} />
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://quiznih.vercel.app/play?code=${quizData.room_code}`);
                  alert(lang === "ENG" ? "Play Link Copied!" : "Tautan Kuis Disalin!");
                }}
                className="px-6 py-2.5 bg-[#14F195]/20 text-[#14F195] rounded-full font-bold border border-[#14F195]/50 hover:bg-[#14F195]/30 transition-all shadow-[0_0_15px_rgba(20,241,149,0.3)] w-full text-center"
              >
                🔗 {lang === "ENG" ? "Share Link" : "Bagikan Tautan"}
              </button>
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
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/20 transition-all group"
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
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[#14F195] font-bold">{p.final_score || 0} pts</span>
                          <button
                            onClick={() => {
                              const reason = prompt(
                                lang === "ENG"
                                  ? `Kick "${p.player_name}" for cheating?\nOptional: enter reason (or leave blank)`
                                  : `Keluarkan "${p.player_name}" karena dicurigai curang?\nOpsional: tulis alasan (atau biarkan kosong)`
                              );
                              if (reason !== null) kickPlayer(p.user_wallet);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-bold"
                            title={lang === "ENG" ? "Remove (Suspected Cheat)" : "Keluarkan (Dicurigai Curang)"}
                          >
                            <ShieldX className="w-3.5 h-3.5" />
                            {lang === "ENG" ? "Kick" : "Keluarkan"}
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
              disabled={isStarting}
              className="w-full py-6 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-extrabold text-xl hover:shadow-[0_0_50px_rgba(153,69,255,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isStarting ? (
                <><Loader2 className="w-8 h-8 animate-spin" /> {lang === "ENG" ? "Starting..." : "Memulai..."}</>
              ) : (
                <>🚀 {lang === "ENG" ? "Start Quiz Now" : "Mulai Kuis Sekarang"}</>
              )}
            </button>
          )}
        </motion.div>
        )}
      </div>
    </main>
  );
}
