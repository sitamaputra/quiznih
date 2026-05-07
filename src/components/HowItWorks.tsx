"use client";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

export default function HowItWorks() {
  const { lang } = useLanguage();

  const steps = [
    {
      icon: "⚡",
      tag: "01",
      title: lang === "ENG" ? "Instant Payouts" : "Pembayaran Instan",
      description: lang === "ENG"
        ? "Reward top players instantly via smart contracts using CELO or cUSD."
        : "Hadiah untuk pemain top dikirim langsung via smart contract menggunakan CELO atau cUSD.",
      accent: "#FCFF52",
    },
    {
      icon: "🛡️",
      tag: "02",
      title: lang === "ENG" ? "On-Chain Verified" : "Terverifikasi On-Chain",
      description: lang === "ENG"
        ? "Immutable leaderboards. No more cheating, total transparency."
        : "Leaderboard tidak bisa diubah. Tidak ada kecurangan, transparansi total.",
      accent: "#35D07F",
    },
    {
      icon: "🔗",
      tag: "03",
      title: lang === "ENG" ? "MiniPay Ready" : "Siap MiniPay",
      description: lang === "ENG"
        ? "Play quizzes directly from MiniPay wallet with auto-connect and instant payouts."
        : "Mainkan kuis langsung dari dompet MiniPay dengan auto-connect dan pembayaran instan.",
      accent: "#FCFF52",
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative w-full px-4 sm:px-6 lg:px-8 cyber-scanline">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded border border-[#35D07F]/20 dark:border-[#FCFF52]/20 bg-[#35D07F]/5 dark:bg-[#FCFF52]/5 text-[#1a8a4e] dark:text-[#FCFF52] text-xs font-mono tracking-widest uppercase mb-4">
            // {lang === "ENG" ? "PROTOCOL" : "PROTOKOL"}
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white cyber-glitch">
            {lang === "ENG" ? "HOW IT " : "CARA "}
            <span className="text-gradient">{lang === "ENG" ? "WORKS_" : "KERJA_"}</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {lang === "ENG"
              ? "Three modules to trivia domination."
              : "Tiga modul menuju dominasi trivia."}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="relative group rounded-2xl p-8 bg-white dark:bg-[#0a0a10] border border-black/5 dark:border-white/5 hover:border-[#35D07F]/30 dark:hover:border-[#FCFF52]/30 transition-all duration-500 overflow-hidden shadow-sm dark:shadow-none"
            >
              {/* Top line accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ color: step.accent }} />
              {/* Corner glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-500" style={{ background: step.accent }} />

              {/* Tag */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono tracking-widest text-gray-600">{`[${step.tag}]`}</span>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl bg-white/5 border border-white/5 group-hover:border-[#FCFF52]/20 group-hover:scale-110 transition-all">
                  {step.icon}
                </div>
              </div>

              <h3 className="text-xl font-extrabold mb-3 text-black dark:text-white group-hover:text-[#35D07F] dark:group-hover:text-[#FCFF52] transition-colors">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>

              {/* Bottom decoration */}
              <div className="mt-6 flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                <span className="text-[10px] font-mono text-gray-700 tracking-widest">MODULE_{step.tag}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
