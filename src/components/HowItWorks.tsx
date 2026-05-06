"use client";
import { Link as LinkIcon, Users, Trophy } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const { lang } = useLanguage();

  const steps = [
    {
      icon: <span className="text-3xl">⚡️</span>,
      title: lang === "ENG" ? "Instant Payouts" : "Pembayaran Instan",
      description: lang === "ENG" 
        ? "Reward top players instantly via smart contracts using CELO or cUSD."
        : "Hadiah untuk pemain top dikirim langsung via smart contract menggunakan CELO atau cUSD.",
      color: "from-[#35D07F]/20 to-transparent",
      border: "border-[#35D07F]/30",
    },
    {
      icon: <span className="text-3xl">🛡️</span>,
      title: lang === "ENG" ? "On-Chain Verified" : "Terverifikasi On-Chain",
      description: lang === "ENG"
        ? "Immutable leaderboards. No more cheating, total transparency."
        : "Leaderboard tidak bisa diubah. Tidak ada kecurangan, transparansi total.",
      color: "from-cyan-500/20 to-transparent",
      border: "border-cyan-500/30",
    },
    {
      icon: <span className="text-3xl">🔗</span>,
      title: lang === "ENG" ? "MiniPay Ready" : "Siap MiniPay",
      description: lang === "ENG"
        ? "Play quizzes directly from MiniPay wallet with auto-connect and instant payouts."
        : "Mainkan kuis langsung dari dompet MiniPay dengan auto-connect dan pembayaran instan.",
      color: "from-[#FCFF52]/20 to-transparent",
      border: "border-[#FCFF52]/30",
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white">
            {lang === "ENG" ? "How " : "Cara "}
            <span className="text-gradient">
              {lang === "ENG" ? "It Works" : "Kerjanya"}
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            {lang === "ENG" 
              ? "Your journey to becoming a trivia champion in three simple steps." 
              : "Perjalananmu menjadi juara trivia hanya dalam tiga langkah sederhana."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.03 }}
              className={`glass rounded-3xl p-8 relative overflow-hidden group transition-transform duration-300 border ${step.border} shadow-[0_4px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.color} blur-[50px] rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
              
              <div className="bg-white dark:bg-[#0A0A0A] w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-black/10 dark:border-white/10 z-10 relative shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform">
                {step.icon}
              </div>
              
              <h3 className="text-2xl font-bold mb-4 relative z-10 text-black dark:text-white">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
