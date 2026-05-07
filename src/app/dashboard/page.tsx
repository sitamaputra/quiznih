"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useAccount, useConnect, useConnectors } from "wagmi";
import { motion } from "framer-motion";
import { PlusCircle, Gamepad2, Wallet2, ArrowLeft, Crown, Users, LayoutDashboard, LogOut, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WalletDropdown from "@/components/WalletDropdown";
import { isMiniPayEnvironment } from "@/lib/celo";
import TopBar from "@/components/TopBar";

export default function DashboardPage() {
  const { lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();
  const isMiniPay = isMiniPayEnvironment();

  useEffect(() => {
    // Auto-connect in MiniPay, or prompt connect on desktop
    if (!isConnected && connectors.length > 0) {
      if (isMiniPay) {
        connect({ connector: connectors[0] });
      }
    }
  }, [isConnected, connectors, connect, isMiniPay]);

  const walletAddress = address || "";
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center text-black dark:text-white relative overflow-hidden">
      {/* Cyberpunk AI Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none bg-[#050505]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#35D07F10_1px,transparent_1px),linear-gradient(to_bottom,#35D07F10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#35D07F]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#FCFF52]/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] bg-[#06B6D4]/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <TopBar backHref="/" />

      {/* Wallet Row */}
      {isConnected && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-2 flex justify-end relative z-40">
          <WalletDropdown />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl -mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 space-y-4 relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FCFF52]/10 border border-[#FCFF52]/30 text-[#FCFF52] text-xs font-mono font-bold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FCFF52] animate-pulse" />
            AI-Powered Nexus
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight uppercase font-mono">
            {lang === "ENG" ? "System " : "Sistem "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#35D07F] via-[#FCFF52] to-[#06B6D4] animate-pulse">
              {lang === "ENG" ? "Initialized" : "Diinisialisasi"}
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto font-mono text-sm">
            {lang === "ENG"
              ? "Select operational parameter. Host a neural-quiz or interface as a player."
              : "Pilih parameter operasional. Buat kuis-neural atau masuk sebagai pemain."}
          </p>
        </motion.div>

        {/* Main 2-col: Creator + Player */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mb-8">
          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/create")}
            className="cursor-pointer group relative bg-black/60 backdrop-blur-xl rounded-[2.5rem] p-10 border-2 border-[#35D07F]/40 hover:border-[#35D07F] hover:shadow-[0_0_40px_rgba(53,208,127,0.3)] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(53,208,127,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#35D07F]/20 blur-[60px] rounded-full group-hover:bg-[#35D07F]/40 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-black border border-[#35D07F] flex items-center justify-center shadow-[0_0_30px_rgba(53,208,127,0.3)] group-hover:shadow-[0_0_50px_rgba(53,208,127,0.5)] transition-shadow">
                <Crown className="w-10 h-10 text-[#35D07F]" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2 font-mono text-white tracking-tight">
                  {lang === "ENG" ? "Create Quiz" : "Buat Kuis"} <span className="text-[#35D07F] text-sm align-top">[HOST]</span>
                </h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {lang === "ENG"
                    ? "Initialize smart-contract assessments and distribute CELO tokens to participants."
                    : "Inisialisasi asesmen smart-contract dan distribusikan token CELO ke peserta."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#35D07F] font-bold group-hover:gap-3 transition-all">
                  <PlusCircle className="w-5 h-5" />
                  <span className="font-mono uppercase tracking-wide">{lang === "ENG" ? "Init Sequence" : "Mulai Sekuens"}</span>
                </div>
                <Link 
                  href="/manage"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#35D07F] text-xs font-mono uppercase transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{lang === "ENG" ? "Access Database" : "Akses Database"}</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Player Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/play")}
            className="cursor-pointer group relative bg-black/60 backdrop-blur-xl rounded-[2.5rem] p-10 border-2 border-[#FCFF52]/40 hover:border-[#FCFF52] hover:shadow-[0_0_40px_rgba(252,255,82,0.2)] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(252,255,82,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] group-hover:animate-[shimmer_3s_infinite]" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FCFF52]/20 blur-[60px] rounded-full group-hover:bg-[#FCFF52]/40 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-black border border-[#FCFF52] flex items-center justify-center shadow-[0_0_30px_rgba(252,255,82,0.3)] group-hover:shadow-[0_0_50px_rgba(252,255,82,0.5)] transition-shadow">
                <Users className="w-10 h-10 text-[#FCFF52]" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2 font-mono text-white tracking-tight">
                  {lang === "ENG" ? "Play Quiz" : "Main Kuis"} <span className="text-[#FCFF52] text-sm align-top">[CLIENT]</span>
                </h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {lang === "ENG"
                    ? "Connect to an active host node, compete in real-time, and extract rewards."
                    : "Koneksi ke host aktif, bersaing secara real-time, dan ekstrak hadiah CELO."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#FCFF52] font-bold group-hover:gap-3 transition-all">
                <Gamepad2 className="w-5 h-5" />
                <span className="font-mono uppercase tracking-wide">{lang === "ENG" ? "Establish Uplink" : "Buat Uplink"}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* Spin Wheel Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/spin")}
            className="cursor-pointer group relative bg-black/50 backdrop-blur-md rounded-[2rem] p-7 border border-[#06B6D4]/30 hover:border-[#06B6D4] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#06B6D4]/10 blur-[60px] rounded-full group-hover:bg-[#06B6D4]/30 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-black border border-[#06B6D4] flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow">
                <span className="text-2xl filter hue-rotate-[180deg]">🎡</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1 font-mono text-white">
                  {lang === "ENG" ? "Spin Wheel" : "Roda Putar"} <span className="text-[#06B6D4] text-[10px] ml-1">[RND_SEED]</span>
                </h2>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Cryptographic random selection protocol for fair prize distribution."
                    : "Protokol seleksi acak kriptografik untuk distribusi hadiah yang adil."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#06B6D4] font-mono font-bold uppercase text-xs group-hover:gap-3 transition-all">
                <span>⚡</span>
                <span>{lang === "ENG" ? "Execute" : "Eksekusi"}</span>
              </div>
            </div>
          </motion.div>

          {/* Live Report Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/live")}
            className="cursor-pointer group relative bg-black/50 backdrop-blur-md rounded-[2rem] p-7 border border-[#35D07F]/30 hover:border-[#35D07F] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#35D07F]/10 blur-[60px] rounded-full group-hover:bg-[#35D07F]/30 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-black border border-[#35D07F] flex items-center justify-center shadow-[0_0_25px_rgba(53,208,127,0.3)] group-hover:shadow-[0_0_40px_rgba(53,208,127,0.5)] transition-shadow">
                <span className="text-2xl filter sepia hue-rotate-[90deg] saturate-200">📺</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1 font-mono text-white">
                  {lang === "ENG" ? "Live Report" : "Laporan Live"} <span className="text-[#35D07F] text-[10px] ml-1">[TELEMETRY]</span>
                </h2>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Monitor quiz activity in real-time and place spectator predictions."
                    : "Pantau aktivitas kuis real-time dan pasang prediksi penonton."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#35D07F] font-mono font-bold uppercase text-xs group-hover:gap-3 transition-all">
                <span className="w-2 h-2 rounded-full bg-[#35D07F] animate-pulse inline-block" />
                <span>{lang === "ENG" ? "Monitor" : "Monitor"}</span>
              </div>
            </div>
          </motion.div>

          {/* Q&A Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/qa")}
            className="cursor-pointer group relative bg-black/50 backdrop-blur-md rounded-[2rem] p-7 border border-[#FCFF52]/30 hover:border-[#FCFF52] transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FCFF52]/10 blur-[60px] rounded-full group-hover:bg-[#FCFF52]/30 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-black border border-[#FCFF52] flex items-center justify-center shadow-[0_0_25px_rgba(252,255,82,0.3)] group-hover:shadow-[0_0_40px_rgba(252,255,82,0.5)] transition-shadow">
                <MessageCircle className="w-7 h-7 text-[#FCFF52]" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1 font-mono text-white">
                  {lang === "ENG" ? "Live Q&A" : "Tanya Jawab"} <span className="text-[#FCFF52] text-[10px] ml-1">[COMMS]</span>
                </h2>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Create interactive Q&A rooms or join existing ones for secure peer consensus."
                    : "Buat ruang tanya jawab interaktif atau gabung untuk konsensus peserta."}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#FCFF52] font-mono font-bold uppercase text-xs group-hover:gap-3 transition-all">
                  <span>🚀</span>
                  <span>{lang === "ENG" ? "Create / Join Q&A" : "Buat / Gabung Q&A"}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
