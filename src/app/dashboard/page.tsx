"use client";
import { useLanguage } from "@/context/LanguageContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { PlusCircle, Gamepad2, Wallet2, ArrowLeft, Crown, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { lang } = useLanguage();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();

  useEffect(() => {
    if (!publicKey) {
      setVisible(true);
    }
  }, [publicKey, setVisible]);

  const walletAddress = publicKey?.toString() || "";
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  return (
    <main className="min-h-screen w-full flex flex-col items-center text-black dark:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 z-[-1] pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-[#9945FF]/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#14F195]/15 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">{lang === "ENG" ? "Back" : "Kembali"}</span>
        </Link>
        {publicKey && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#9945FF]/30">
            <Wallet2 className="w-4 h-4 text-[#9945FF]" />
            <span className="text-sm font-mono font-semibold">{shortAddress}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 w-full max-w-5xl -mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Creator Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => publicKey ? router.push("/create") : setVisible(true)}
            className="cursor-pointer group relative glass rounded-[2.5rem] p-10 border border-[#9945FF]/30 hover:border-[#9945FF]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#9945FF]/10 blur-[60px] rounded-full group-hover:bg-[#9945FF]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#9945FF] to-[#7B3FE4] flex items-center justify-center shadow-[0_0_30px_rgba(153,69,255,0.3)] group-hover:shadow-[0_0_50px_rgba(153,69,255,0.5)] transition-shadow">
                <Crown className="w-10 h-10 text-white" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2">
                  {lang === "ENG" ? "Quiz Creator" : "Pembuat Kuis"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "ENG"
                    ? "Design your own quiz, set rewards, and invite players with a unique code."
                    : "Rancang kuis sendiri, tentukan hadiah, dan undang pemain dengan kode unik."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#9945FF] font-bold group-hover:gap-3 transition-all">
                <PlusCircle className="w-5 h-5" />
                <span>{lang === "ENG" ? "Create Quiz" : "Buat Kuis"}</span>
              </div>
            </div>
          </motion.div>

          {/* Player Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
            onClick={() => publicKey ? router.push("/play") : setVisible(true)}
            className="cursor-pointer group relative glass rounded-[2.5rem] p-10 border border-[#14F195]/30 hover:border-[#14F195]/60 transition-all duration-500 overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#14F195]/10 blur-[60px] rounded-full group-hover:bg-[#14F195]/25 transition-all duration-500" />

            <div className="relative z-10 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#14F195] to-[#0EC97F] flex items-center justify-center shadow-[0_0_30px_rgba(20,241,149,0.3)] group-hover:shadow-[0_0_50px_rgba(20,241,149,0.5)] transition-shadow">
                <Users className="w-10 h-10 text-black" />
              </div>

              <div>
                <h2 className="text-3xl font-extrabold mb-2">
                  {lang === "ENG" ? "Join as Player" : "Gabung Sebagai Pemain"}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === "ENG"
                    ? "Scan QR code or enter a room code to join a live quiz and compete for prizes."
                    : "Scan QR code atau masukkan kode ruangan untuk bergabung kuis dan bersaing."}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[#14F195] font-bold group-hover:gap-3 transition-all">
                <Gamepad2 className="w-5 h-5" />
                <span>{lang === "ENG" ? "Join Quiz" : "Gabung Kuis"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
