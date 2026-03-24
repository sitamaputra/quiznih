"use client";
import { Rocket, PlayCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function HeroSection() {
  const { lang } = useLanguage();
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto space-y-8 z-10 relative"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 text-emerald-600 dark:text-[#14F195] text-sm font-medium mb-4 animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#14F195]"></span>
          {lang === "ENG" ? "Live on Solana Devnet" : "Aktif di Solana Devnet"}
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-black dark:text-white"
        >
          {lang === "ENG" ? (
            <>
              Test Your Knowledge, <br className="hidden md:block"/>
              <span className="text-gradient">Earn Crypto Rewards.</span>
            </>
          ) : (
            <>
              Uji Pengetahuanmu, <br className="hidden md:block"/>
              <span className="text-gradient">Dapatkan Hadiah Kripto.</span>
            </>
          )}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          {lang === "ENG"
            ? "The ultimate Web3 trivia experience. Join live games, answer fast, outsmart the competition, and win real Solana tokens."
            : "Pengalaman trivia Web3 terbaik. Ikuti permainan langsung, jawab dengan cepat, kalahkan lawan, dan menangkan token Solana asli."}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white dark:text-[#0A0A0A] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(20,241,149,0.3)] group">
            <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {lang === "ENG" ? "Enter Quiz Room" : "Masuk Ruang Kuis"}
          </Link>
          
          <button 
            onClick={handleWalletClick}
            className="w-full sm:w-auto flex items-center justify-center gap-3 glass hover:bg-black/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/20 text-black dark:text-white px-8 py-4 rounded-full font-bold text-lg transition-colors duration-300 group"
          >
            <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            {publicKey 
              ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
              : lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}
