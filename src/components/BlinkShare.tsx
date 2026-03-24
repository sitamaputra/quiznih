"use client";
import { Twitter, Share2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

export default function BlinkShare() {
  const { lang } = useLanguage();

  const shareToX = () => {
    // This URL would point to the API route I just created, 
    // but formatted for Twitter to recognize it as a Blink if the domain is registered.
    const quizUrl = "https://quiznih.vercel.app/api/actions/quiz";
    const tweetText = lang === "ENG" 
      ? `Check out this Web3 quiz on Quiznih! Answer direct from the timeline. 🧠🔥`
      : `Ikuti kuis Web3 di Quiznih! Jawab langsung dari timeline X kamu. 🧠🔥`;
    
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(quizUrl)}`;
    window.open(xUrl, "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-10 rounded-[3rem] glass border border-[#9945FF]/30 bg-gradient-to-br from-[#9945FF]/5 to-transparent text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-3xl bg-black dark:bg-white flex items-center justify-center text-white dark:text-black">
          <Twitter className="w-8 h-8" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-3xl font-extrabold text-black dark:text-white">
          {lang === "ENG" ? "Solana " : "Aksi "}
          <span className="text-gradient">Blinks</span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          {lang === "ENG" 
            ? "Share your quiz to Twitter/X. Others can pay and play directly from their timeline without leaving X! Powered by Solana Actions."
            : "Bagikan kuis Anda ke Twitter/X. Orang lain bisa membayar dan bermain langsung dari timeline tanpa keluar dari X! Didukung oleh Solana Actions."}
        </p>
      </div>

      <button 
        onClick={shareToX}
        className="inline-flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-solana-purple hover:text-white transition-all duration-300 shadow-xl"
      >
        <Share2 className="w-5 h-5" />
        {lang === "ENG" ? "Share Quiz to X" : "Bagikan Kuis ke X"}
      </button>
    </motion.div>
  );
}
