"use client";
import { PlayCircle, Zap, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAccount } from "wagmi";
import { IS_TESTNET, isMiniPayEnvironment } from "@/lib/celo";

export default function HeroSection() {
  const { lang } = useLanguage();
  const { isConnected } = useAccount();
  const isMiniPay = isMiniPayEnvironment();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 cyber-scanline">
      {/* Cyberpunk background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Diagonal lines */}
        <div className="absolute top-0 left-0 w-full h-full cyber-grid opacity-60" />
        {/* Glow orbs */}
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-[#FCFF52]/8 blur-[180px] rounded-full" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#35D07F]/6 blur-[160px] rounded-full" />
        {/* Corner accents */}
        <div className="absolute top-20 left-8 w-24 h-[1px] bg-gradient-to-r from-[#FCFF52]/50 to-transparent" />
        <div className="absolute top-20 left-8 w-[1px] h-24 bg-gradient-to-b from-[#FCFF52]/50 to-transparent" />
        <div className="absolute bottom-20 right-8 w-24 h-[1px] bg-gradient-to-l from-[#FCFF52]/50 to-transparent" />
        <div className="absolute bottom-20 right-8 w-[1px] h-24 bg-gradient-to-t from-[#FCFF52]/50 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-5xl mx-auto space-y-8 z-10 relative"
      >
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#35D07F]/30 dark:border-[#FCFF52]/30 bg-[#35D07F]/5 dark:bg-[#FCFF52]/5 text-[#1a8a4e] dark:text-[#FCFF52] text-sm font-mono font-bold tracking-wider"
        >
          <span className="w-2 h-2 rounded-full bg-[#35D07F] dark:bg-[#FCFF52] neon-pulse" />
          <span className="uppercase text-xs">{`[ ${IS_TESTNET ? "TESTNET::ALFAJORES" : "MAINNET::CELO"} ]`}</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-5xl md:text-8xl font-extrabold tracking-tight leading-[0.95] text-gray-900 dark:text-white cyber-glitch"
        >
          {lang === "ENG" ? (
            <>
              DECENTRALIZED<br className="hidden md:block" />
              <span className="text-gradient">TRIVIA_</span>
            </>
          ) : (
            <>
              TRIVIA<br className="hidden md:block" />
              <span className="text-gradient">TERDESENTRALISASI_</span>
            </>
          )}
        </motion.h1>

        {/* Subtitle with cyber feel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
            {lang === "ENG"
              ? "Host quizzes on Celo blockchain. Auto-distribute crypto rewards. Zero friction. Maximum fun."
              : "Host kuis di blockchain Celo. Distribusi hadiah kripto otomatis. Tanpa hambatan. Maksimal seru."}
          </p>
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#35D07F]/40 dark:to-[#FCFF52]/40" />
            <Zap className="w-4 h-4 text-[#35D07F]/60 dark:text-[#FCFF52]/60" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#35D07F]/40 dark:to-[#FCFF52]/40" />
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="flex items-center justify-center gap-6 md:gap-10 font-mono text-sm"
        >
          {[
            { label: "PLAYERS", value: "2.4K+" },
            { label: "QUIZZES", value: "180+" },
            { label: "REWARDS", value: "500+ CELO" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[#c4a700] dark:text-[#FCFF52] font-black text-xl md:text-2xl">{s.value}</div>
              <div className="text-gray-500 dark:text-gray-600 text-[10px] tracking-[0.2em] uppercase">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <Link href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#FCFF52] text-black px-14 py-5 rounded-lg font-extrabold text-xl hover:shadow-[0_0_40px_rgba(252,255,82,0.4)] hover:scale-105 transition-all duration-300 group uppercase tracking-wider"
          >
            <PlayCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
            {lang === "ENG" ? "PLAY NOW" : "MAIN SEKARANG"}
          </Link>
          <Link href="/live"
            className="w-full sm:w-auto flex items-center justify-center gap-3 border border-[#FCFF52]/30 text-[#FCFF52] px-10 py-5 rounded-lg font-bold text-lg hover:bg-[#FCFF52]/10 hover:border-[#FCFF52]/60 transition-all duration-300 group uppercase tracking-wider"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {lang === "ENG" ? "WATCH LIVE" : "TONTON LIVE"}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {isMiniPay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded border border-[#35D07F]/30 bg-[#35D07F]/5 text-[#35D07F] text-xs font-mono"
          >
            ⚡ MINIPAY::CONNECTED
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
