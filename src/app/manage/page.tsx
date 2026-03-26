"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Wallet2, Plus, LayoutDashboard, Play, CheckCircle2, Trash2, Users, Trophy, ExternalLink, LogOut
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import WalletDropdown from "@/components/WalletDropdown";

export default function ManageQuizzesPage() {
  const { lang } = useLanguage();
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    const fetchMyQuizzes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*, questions(count)")
          .eq("host_wallet", publicKey.toString())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuizzes(data || []);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyQuizzes();
  }, [publicKey, setVisible]);

  const handleDelete = async (quizId: string) => {
    if (!confirm(lang === "ENG" ? "Are you sure you want to delete this quiz?" : "Anda yakin ingin menghapus kuis ini?")) return;
    
    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (err) {
      console.error("Error deleting quiz:", err);
      alert(lang === "ENG" ? "Failed to delete" : "Gagal menghapus");
    }
  };

  const walletShort = publicKey
    ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}`
    : "";

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-[#9945FF]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-[#14F195]/10 blur-[150px] rounded-full" />
      </div>

      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between relative z-50">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Dashboard" : "Dasbor"}</span>
        </Link>
        {publicKey && <WalletDropdown />}
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center gap-4">
              <LayoutDashboard className="w-10 h-10 text-[#9945FF]" />
              {lang === "ENG" ? "My " : "Kuis "}
              <span className="text-gradient">{lang === "ENG" ? "Quizzes" : "Saya"}</span>
            </h1>
            <p className="text-gray-500 max-w-lg">
              {lang === "ENG" 
                ? "Manage your active sessions and view past results" 
                : "Kelola sesi kuis Anda dan lihat hasil sebelumnya"}
            </p>
          </motion.div>

          <Link
            href="/create"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold hover:shadow-[0_0_30px_rgba(153,69,255,0.4)] transition-all"
          >
            <Plus className="w-5 h-5" />
            {lang === "ENG" ? "Create New" : "Buat Baru"}
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[280px] rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="glass rounded-[3rem] p-20 text-center border border-white/5">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {lang === "ENG" ? "No Quizzes Yet" : "Belum Ada Kuis"}
            </h3>
            <p className="text-gray-500 mb-8">
              {lang === "ENG" ? "You haven't created any quizzes." : "Anda belum membuat kuis apapun."}
            </p>
            <Link href="/create" className="text-[#9945FF] font-bold hover:underline">
              {lang === "ENG" ? "Start building now" : "Mulai buat sekarang"} →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz, idx) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group glass rounded-3xl p-6 border border-white/10 hover:border-[#9945FF]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quiz.status === "waiting" 
                        ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        : quiz.status === "playing"
                        ? "bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/30"
                        : "bg-gray-500/20 text-gray-400 border border-gray-500/20"
                    }`}>
                      {quiz.status}
                    </span>
                    <span className="text-xs font-mono text-gray-500">{quiz.room_code}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-2 truncate group-hover:text-gradient transition-all">
                    {quiz.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-6 h-10">
                    {quiz.description || (lang === "ENG" ? "No description" : "Tidak ada deskripsi")}
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 text-xs font-semibold">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {/* We'd normally fetch real count, but let's show prize pool for now */}
                      {quiz.reward_pool_amount} SOL
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/create/room/${quiz.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 font-bold transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {lang === "ENG" ? "Manage" : "Kelola"}
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500 group/del transition-all"
                  >
                    <Trash2 className="w-5 h-5 text-red-500 group-hover/del:text-white" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
