"use client";
import { Clock, Users, ShieldCheck, Play } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const quizzes = [
  {
    id: 1,
    title: "Celo Ecosystem Mastery",
    title_id: "Penguasaan Ekosistem Celo",
    participants: "2.4k",
    startsIn: "15:30",
    reward: "50 CELO",
    difficulty: "Advanced",
    difficulty_id: "Lanjutan",
  },
  {
    id: 2,
    title: "NFT History & Utilities",
    title_id: "Sejarah & Kegunaan NFT",
    participants: "1.2k",
    startsIn: "Next Room",
    reward: "Exclusive NFT",
    difficulty: "Beginner",
    difficulty_id: "Pemula",
  },
  {
    id: 3,
    title: "DeFi Protocols 101",
    title_id: "Protokol DeFi 101",
    participants: "850",
    startsIn: "Scheduled",
    reward: "100 cUSD",
    difficulty: "Intermediate",
    difficulty_id: "Menengah",
  }
];

export default function UpcomingQuizzes() {
  const { lang } = useLanguage();

  return (
    <section className="py-24 w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-4 text-black dark:text-white">
              <Clock className="w-10 h-10 text-celo-green" />
              {lang === "ENG" ? "Upcoming " : "Kuis "}
              <span className="text-gradient">
                {lang === "ENG" ? "Quizzes" : "Mendatang"}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {lang === "ENG"
                ? "Join these live sessions and win prizes straight to your wallet."
                : "Ikuti sesi kuis ini dan menangkan hadiah langsung ke dompetmu."}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="glass rounded-3xl p-8 relative overflow-hidden group border border-black/10 dark:border-white/10"
            >
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-celo-green/10 blur-[60px] rounded-full group-hover:bg-celo-green/20 transition-all duration-500"></div>
              
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  {lang === "ENG" ? quiz.difficulty : quiz.difficulty_id}
                </span>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Users className="w-4 h-4" />
                  {quiz.participants}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 text-black dark:text-white">
                {lang === "ENG" ? quiz.title : quiz.title_id}
              </h3>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <ShieldCheck className="w-5 h-5 text-celo-green" />
                  <span className="font-semibold">{quiz.reward}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <Clock className="w-5 h-5" />
                  <span>{lang === "ENG" ? "Starts in " : "Mulai dalam "} 
                    <span className="text-celo-green font-bold">
                      {lang === "ID" && quiz.startsIn === "Next Room" ? "Sesi Berikutnya" : 
                       lang === "ID" && quiz.startsIn === "Scheduled" ? "Terjadwal" : 
                       quiz.startsIn}
                    </span>
                  </span>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold group-hover:shadow-[0_0_20px_rgba(53,208,127,0.4)] transition-all duration-300">
                <Play className="w-4 h-4 fill-current" />
                {lang === "ENG" ? "Join Waitlist" : "Gabung Antrean"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
