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
      {/* Background Glow */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#35D07F]/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#FCFF52]/15 blur-[150px] rounded-full" />
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
          className="text-center mb-12 space-y-4"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            {lang === "ENG" ? "Choose Your " : "Pilih "}
            <span className="text-gradient">{lang === "ENG" ? "Role" : "Peranmu"}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-lg mx-auto">
            {lang === "ENG"
              ? "Create a quiz to challenge others, or join as a player to compete and earn rewards."
              : "Buat kuis untuk menantang yang lain, atau bergabung sebagai pemain untuk bersaing dan dapatkan hadiah."}
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
            className="cursor-pointer group relative glass rounded-[2.5rem] p-10 border border-[#35D07F]/30 hover:border-[#35D07F]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#35D07F]/10 blur-[60px] rounded-full group-hover:bg-[#35D07F]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#35D07F] to-[#2bb86e] flex items-center justify-center shadow-[0_0_30px_rgba(53,208,127,0.3)] group-hover:shadow-[0_0_50px_rgba(53,208,127,0.5)] transition-shadow">
                <Crown className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2">
                  {lang === "ENG" ? "Quiz Creator" : "Pembuat Kuis"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "ENG"
                    ? "Design your own quiz, set rewards in CELO, and invite players with a unique code."
                    : "Rancang kuis sendiri, tentukan hadiah dalam CELO, dan undang pemain dengan kode unik."}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-[#35D07F] font-bold group-hover:gap-3 transition-all">
                  <PlusCircle className="w-5 h-5" />
                  <span>{lang === "ENG" ? "Create New Quiz" : "Buat Kuis Baru"}</span>
                </div>
                <Link 
                  href="/manage"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-gray-500 hover:text-[#35D07F] text-sm font-semibold transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{lang === "ENG" ? "Manage My Quizzes" : "Kelola Kuis Saya"}</span>
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
            className="cursor-pointer group relative glass rounded-[2.5rem] p-10 border border-[#FCFF52]/30 hover:border-[#FCFF52]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#FCFF52]/10 blur-[60px] rounded-full group-hover:bg-[#FCFF52]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FCFF52] to-[#e6e84a] flex items-center justify-center shadow-[0_0_30px_rgba(252,255,82,0.3)] group-hover:shadow-[0_0_50px_rgba(252,255,82,0.5)] transition-shadow">
                <Users className="w-10 h-10 text-black" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2">
                  {lang === "ENG" ? "Join as Player" : "Gabung Sebagai Pemain"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "ENG"
                    ? "Scan QR code or enter a room code to join a live quiz and compete for CELO prizes."
                    : "Scan QR code atau masukkan kode ruangan untuk bergabung kuis dan bersaing hadiah CELO."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#FCFF52] font-bold group-hover:gap-3 transition-all">
                <Gamepad2 className="w-5 h-5" />
                <span>{lang === "ENG" ? "Join Quiz" : "Gabung Kuis"}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom row: Spin Wheel + Live Report + Q&A */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {/* Spin Wheel Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => handleNavigate("/spin")}
            className="cursor-pointer group relative glass rounded-[2rem] p-7 border border-[#A78BFA]/30 hover:border-[#A78BFA]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#A78BFA]/10 blur-[60px] rounded-full group-hover:bg-[#A78BFA]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#7C3AED] flex items-center justify-center shadow-[0_0_25px_rgba(167,139,250,0.3)] group-hover:shadow-[0_0_40px_rgba(167,139,250,0.5)] transition-shadow">
                <span className="text-2xl">🎡</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1">
                  {lang === "ENG" ? "Spin Wheel" : "Roda Putar"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Random prize picker. Spin the wheel to pick a winner!"
                    : "Pemilih hadiah acak. Putar roda untuk pilih pemenang!"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#A78BFA] font-bold group-hover:gap-3 transition-all text-sm">
                <span>🎰</span>
                <span>{lang === "ENG" ? "Spin & Win" : "Putar & Menang"}</span>
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
            className="cursor-pointer group relative glass rounded-[2rem] p-7 border border-[#F472B6]/30 hover:border-[#F472B6]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#F472B6]/10 blur-[60px] rounded-full group-hover:bg-[#F472B6]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F472B6] to-[#EC4899] flex items-center justify-center shadow-[0_0_25px_rgba(244,114,182,0.3)] group-hover:shadow-[0_0_40px_rgba(244,114,182,0.5)] transition-shadow">
                <span className="text-2xl">📺</span>
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1">
                  {lang === "ENG" ? "Live Report" : "Laporan Live"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Watch players live, bet on winners, set prizes!"
                    : "Tonton pemain live, taruhan pemenang, atur hadiah!"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#F472B6] font-bold group-hover:gap-3 transition-all text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                <span>{lang === "ENG" ? "Watch & Bet" : "Tonton & Taruhan"}</span>
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
            className="cursor-pointer group relative glass rounded-[2rem] p-7 border border-[#06B6D4]/30 hover:border-[#06B6D4]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#06B6D4]/10 blur-[60px] rounded-full group-hover:bg-[#06B6D4]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold mb-1">
                  {lang === "ENG" ? "Live Q&A" : "Tanya Jawab"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {lang === "ENG"
                    ? "Ask questions, vote & reply. Anonymous mode available!"
                    : "Ajukan pertanyaan, vote & balas. Bisa anonim!"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#06B6D4] font-bold group-hover:gap-3 transition-all text-sm">
                <span>💬</span>
                <span>{lang === "ENG" ? "Ask & Vote" : "Tanya & Vote"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
