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
          className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white"
        >
          {lang === "ENG" ? (
            <>
              Decentralized Trivia. <br className="hidden md:block"/>
              <span className="text-gradient">Play, Win, Earn Instantly.</span>
            </>
          ) : (
            <>
              Trivia Terdesentralisasi. <br className="hidden md:block"/>
              <span className="text-gradient">Main, Menang, Hasilkan Instan.</span>
            </>
          )}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          {lang === "ENG"
            ? "The ultimate decentralized trivia experience. Host quizzes for your community and automatically distribute crypto rewards with zero friction."
            : "Pengalaman trivia terdesentralisasi terbaik. Host kuis untuk komunitasmu dan bagikan hadiah kripto secara otomatis tanpa hambatan."}
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
        >
          <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white px-12 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/25 group">
            <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            {lang === "ENG" ? "Play Now" : "Main Sekarang"}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
