"use client";
import { Twitter, Share2, Smartphone } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

export default function BlinkShare() {
  const { lang } = useLanguage();

  const shareToX = () => {
    const quizUrl = "https://quiznih.vercel.app";
    const tweetText = lang === "ENG" 
      ? `Check out Quiznih - the Web3 quiz platform on Celo! Play quizzes, win CELO rewards. 🧠🔥 Built for @MiniPay`
      : `Cek Quiznih - platform kuis Web3 di Celo! Main kuis, menangkan hadiah CELO. 🧠🔥 Dibangun untuk @MiniPay`;
    
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(quizUrl)}`;
    window.open(xUrl, "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-10 rounded-[3rem] glass border border-[#35D07F]/30 bg-gradient-to-br from-[#35D07F]/5 to-transparent text-center space-y-6"
    >
      <div className="flex justify-center gap-4">
        <div className="w-16 h-16 rounded-3xl bg-[#35D07F] flex items-center justify-center text-white">
          <Smartphone className="w-8 h-8" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-3xl font-extrabold text-black dark:text-white">
          {lang === "ENG" ? "Celo " : "Aplikasi "}
          <span className="text-gradient">MiniPay</span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          {lang === "ENG" 
            ? "Quiznih is optimized as a MiniPay mini app. Open directly from MiniPay wallet to play quizzes with auto-connect and instant CELO payouts."
            : "Quiznih dioptimalkan sebagai mini app MiniPay. Buka langsung dari dompet MiniPay untuk main kuis dengan auto-connect dan pembayaran CELO instan."}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button 
          onClick={shareToX}
          className="inline-flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-[#35D07F] hover:text-white transition-all duration-300 shadow-xl"
        >
          <Share2 className="w-5 h-5" />
          {lang === "ENG" ? "Share to X" : "Bagikan ke X"}
        </button>
        <a
          href="https://www.opera.com/products/minipay"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#35D07F] text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-[#2bb86e] transition-all duration-300 shadow-xl"
        >
          <Smartphone className="w-5 h-5" />
          {lang === "ENG" ? "Get MiniPay" : "Unduh MiniPay"}
        </a>
      </div>
    </motion.div>
  );
}
