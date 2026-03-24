"use client";
import { Flame, Medal, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const players = [
  { rank: 1, name: "CryptoKing.sol", score: 9850, wallet: "8N...3vJ", trend: "up" },
  { rank: 2, name: "Satoshi_Fan", score: 9200, wallet: "Hk...Zq2", trend: "up" },
  { rank: 3, name: "DiamondHands", score: 8750, wallet: "2d...9p1", trend: "down" },
  { rank: 4, name: "Degenerate Ape", score: 8100, wallet: "Fp...Kw9", trend: "same" },
  { rank: 5, name: "NFT_Collector", score: 7900, wallet: "Gz...Mv5", trend: "up" },
];

export default function Leaderboard() {
  const { lang } = useLanguage();

  return (
    <section id="leaderboard" className="py-24 relative w-full px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-black/5 dark:to-[#0A0A0A]/50">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
        >
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold flex items-center gap-4 text-black dark:text-white">
              <Flame className="w-10 h-10 text-[#FF4500]" />
              {lang === "ENG" ? "Live Leaderboard" : "Papan Peringkat"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {lang === "ENG"
                ? "Top trivia hunters fetching real rewards this season."
                : "Pemburu trivia teratas yang mendapatkan hadiah nyata musim ini."}
            </p>
          </div>
          <button className="whitespace-nowrap px-6 py-3 rounded-full border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm font-semibold text-black dark:text-white">
            {lang === "ENG" ? "View All Ranks" : "Lihat Semua Peringkat"}
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl border border-black/10 dark:border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.05)] dark:shadow-[0_0_50px_rgba(153,69,255,0.1)]"
        >
          <div className="grid grid-cols-12 gap-4 p-6 bg-black/5 dark:bg-white/5 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-black/5 dark:border-white/5">
            <div className="col-span-2 text-center">{lang === "ENG" ? "Rank" : "Peringkat"}</div>
            <div className="col-span-5">{lang === "ENG" ? "Player" : "Pemain"}</div>
            <div className="col-span-3 text-right">{lang === "ENG" ? "Score" : "Skor"}</div>
            <div className="col-span-2 text-right">{lang === "ENG" ? "Wallet" : "Dompet"}</div>
          </div>

          <div className="divide-y divide-black/5 dark:divide-white/5">
            {players.map((player, idx) => (
              <motion.div 
                key={player.rank} 
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`grid grid-cols-12 gap-4 p-6 items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                  player.rank === 1 ? 'bg-[#9945FF]/5 dark:bg-[#9945FF]/10' : ''
                }`}
              >
                <div className="col-span-2 flex justify-center">
                  {player.rank === 1 ? (
                    <Award className="w-8 h-8 text-[#FDE047]" />
                  ) : player.rank === 2 ? (
                    <Medal className="w-7 h-7 text-gray-400" />
                  ) : player.rank === 3 ? (
                    <Medal className="w-6 h-6 text-[#CD7F32]" />
                  ) : (
                    <span className="text-xl font-bold text-gray-500">#{player.rank}</span>
                  )}
                </div>

                <div className="col-span-5 font-bold text-lg flex items-center gap-3 text-black dark:text-white">
                  <span>{player.name}</span>
                  {player.rank === 1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#FDE047]/20 text-[#FDE047] border border-[#FDE047]/50 uppercase">
                      Top
                    </span>
                  )}
                </div>

                <div className="col-span-3 text-right font-mono text-xl text-emerald-600 dark:text-[#14F195]">
                  {player.score.toLocaleString()}
                </div>

                <div className="col-span-2 text-right font-mono text-sm text-gray-500">
                  {player.wallet}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
