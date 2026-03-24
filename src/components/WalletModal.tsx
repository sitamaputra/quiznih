"use client";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const wallets = [
  { name: "Phantom", icon: "👻", color: "bg-[#AB9FF2]/20 border-[#AB9FF2]/50" },
  { name: "Backpack", icon: "🎒", color: "bg-[#E33E3F]/20 border-[#E33E3F]/50" },
  { name: "Jupiter", icon: "🪐", color: "bg-[#19FB9B]/20 border-[#19FB9B]/50" },
  { name: "Solflare", icon: "☀️", color: "bg-[#FCB017]/20 border-[#FCB017]/50" },
  { name: "Magic Eden", icon: "🪄", color: "bg-[#E33E3F]/20 border-[#E33E3F]/50" },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { lang } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md glass rounded-[2.5rem] border border-black/10 dark:border-white/20 overflow-hidden relative z-10 bg-white dark:bg-[#0A0A0A] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm leading-relaxed">
              {lang === "ENG" 
                ? "Choose your preferred wallet to join the kuisroom and start earning rewards."
                : "Pilih dompet favorit Anda untuk bergabung di ruang kuis dan mulai mengumpulkan hadiah."}
            </p>

            <div className="space-y-4">
              {wallets.map((wallet, idx) => (
                <motion.button
                  key={wallet.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border ${wallet.color} transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-300">{wallet.icon}</span>
                    <span className="font-bold text-lg text-black dark:text-white">
                      {wallet.name === "Jupiter" ? "Jupwallet" : wallet.name}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10 text-center">
              <p className="text-xs text-gray-500">
                {lang === "ENG" ? "New to Solana?" : "Baru di Solana?"}{" "}
                <button className="text-solana-purple font-bold hover:underline">
                  {lang === "ENG" ? "Learn More" : "Pelajari Lebih Lanjut"}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
