"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Wallet2, Plus, LayoutDashboard, Play, CheckCircle2, Trash2, Users, Trophy, ExternalLink, LogOut
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import WalletDropdown from "@/components/WalletDropdown";
import TopBar from "@/components/TopBar";

export default function ManageQuizzesPage() {
  const { lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!address && connectors.length > 0) {
      connect({ connector: connectors[0] });
      return;
    }

    if (!address) return;

    const fetchMyQuizzes = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("quizzes")
          .select("*, questions(count)")
          .eq("host_wallet", address)
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
  }, [address, connectors, connect]);

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

  const walletShort = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  return (
    <main className="min-h-screen w-full text-black dark:text-white relative">
      {/* Cyberpunk AI Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#35D07F10_1px,transparent_1px),linear-gradient(to_bottom,#35D07F10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-[#35D07F]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[20%] left-[5%] w-[350px] h-[350px] bg-[#FCFF52]/20 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <TopBar backHref="/dashboard" />

      {isConnected && (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-2 flex justify-end relative z-40">
          <WalletDropdown />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35D07F]/10 border border-[#35D07F]/30 text-[#35D07F] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35D07F] animate-pulse" />
              DATABASE_ACCESS
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center gap-4 font-mono uppercase tracking-tight">
              <LayoutDashboard className="w-10 h-10 text-[#35D07F]" />
              {lang === "ENG" ? "Manage " : "Kelola "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35D07F] to-[#FCFF52]">
                {lang === "ENG" ? "Quizzes" : "Kuis"}
              </span>
            </h1>
            <p className="text-gray-400 max-w-lg font-mono text-sm">
              {lang === "ENG" 
                ? "Track your active games, review player results, and manage your live rooms." 
                : "Pantau kuis aktifmu, periksa hasil pemain, dan kelola ruangan live-mu."}
            </p>
          </motion.div>

          <Link
            href="/create"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#35D07F] to-[#FCFF52] text-black font-bold hover:shadow-[0_0_30px_rgba(53,208,127,0.4)] transition-all"
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
          <div className="bg-black/50 backdrop-blur-md rounded-[3rem] p-20 text-center border border-white/10 shadow-[0_0_40px_rgba(53,208,127,0.1)]">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-[#35D07F]" />
            </div>
            <h3 className="text-2xl font-bold mb-2 font-mono text-white">
              {lang === "ENG" ? "NO QUIZZES FOUND" : "TIDAK ADA KUIS"}
            </h3>
            <p className="text-gray-400 mb-8 font-mono text-sm">
              {lang === "ENG" ? "You haven't hosted any interactive games yet. Ready to start?" : "Kamu belum membuat permainan interaktif apapun. Siap untuk mulai?"}
            </p>
            <Link href="/create" className="text-[#35D07F] font-bold hover:underline font-mono uppercase tracking-widest text-sm">
              {lang === "ENG" ? "Create Your First Quiz" : "Buat Kuis Pertama Anda"} →
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
                className="group relative bg-black/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 hover:border-[#35D07F]/50 hover:shadow-[0_0_30px_rgba(53,208,127,0.2)] transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(53,208,127,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      quiz.status === "waiting" 
                        ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                        : quiz.status === "playing"
                        ? "bg-[#FCFF52]/20 text-[#FCFF52] border border-[#FCFF52]/30"
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
                      {quiz.reward_pool_amount} CELO
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
