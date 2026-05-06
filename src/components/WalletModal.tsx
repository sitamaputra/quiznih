"use client";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useConnect, useConnectors } from "wagmi";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletOptions = [
  { name: "MiniPay", icon: "💚", color: "bg-[#35D07F]/20 border-[#35D07F]/50", description: "Opera MiniPay Wallet" },
  { name: "MetaMask", icon: "🦊", color: "bg-[#F6851B]/20 border-[#F6851B]/50", description: "Popular browser wallet" },
  { name: "Valora", icon: "🟢", color: "bg-[#35D07F]/20 border-[#35D07F]/50", description: "Mobile-first Celo wallet" },
  { name: "WalletConnect", icon: "🔗", color: "bg-[#3B99FC]/20 border-[#3B99FC]/50", description: "Connect any wallet" },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { lang } = useLanguage();
  const { connect } = useConnect();
  const connectors = useConnectors();

  const handleConnect = (index: number) => {
    if (connectors.length > index) {
      connect({ connector: connectors[index] });
    } else if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
    onClose();
  };

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
                ? "Choose your preferred wallet to connect to Celo and start earning quiz rewards."
                : "Pilih dompet favorit Anda untuk terhubung ke Celo dan mulai mengumpulkan hadiah kuis."}
            </p>

            <div className="space-y-4">
              {walletOptions.map((wallet, idx) => (
                <motion.button
                  key={wallet.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConnect(idx)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border ${wallet.color} transition-all duration-300 group`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all duration-300">{wallet.icon}</span>
                    <div className="text-left">
                      <span className="font-bold text-lg text-black dark:text-white block">
                        {wallet.name}
                      </span>
                      <span className="text-xs text-gray-500">{wallet.description}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-black/5 dark:border-white/10 text-center">
              <p className="text-xs text-gray-500">
                {lang === "ENG" ? "New to Celo?" : "Baru di Celo?"}{" "}
                <a 
                  href="https://celo.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#35D07F] font-bold hover:underline"
                >
                  {lang === "ENG" ? "Learn More" : "Pelajari Lebih Lanjut"}
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
