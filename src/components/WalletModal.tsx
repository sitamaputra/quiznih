"use client";
import { X, ChevronRight, Loader2, Wallet2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useConnect, useConnectors, useAccount } from "wagmi";
import { WALLET_LIST } from "@/lib/wagmi";
import { useState, useEffect } from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { lang } = useLanguage();
  const { connect, isPending } = useConnect();
  const connectors = useConnectors();
  const { isConnected } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Close when connected
  useEffect(() => {
    if (isConnected && connectingId) {
      setConnectingId(null);
      onClose();
    }
  }, [isConnected, connectingId, onClose]);

  const handleConnect = (walletId: string) => {
    setConnectingId(walletId);
    setError(null);

    const connectorMap: Record<string, number> = {
      metamask: 1,
      rabby: 2,
      okx: 3,
      bitget: 4,
      trust: 5,
    };

    const idx = connectorMap[walletId] ?? 0;

    if (connectors.length > idx) {
      connect(
        { connector: connectors[idx] },
        {
          onError: (err) => {
            setConnectingId(null);
            const installUrls: Record<string, string> = {
              metamask: "https://metamask.io/download/",
              rabby: "https://rabby.io/",
              okx: "https://www.okx.com/web3",
              bitget: "https://web3.bitget.com/",
              trust: "https://trustwallet.com/",
            };
            if (err.message?.includes("provider") || err.message?.includes("not found")) {
              window.open(installUrls[walletId] || "#", "_blank");
            } else {
              setError(err.message || "Connection failed");
            }
          },
        }
      );
    } else if (connectors.length > 0) {
      connect(
        { connector: connectors[0] },
        { onError: () => { setConnectingId(null); setError("Wallet not detected"); } }
      );
    }
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
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35D07F] to-[#FCFF52] flex items-center justify-center">
                  <Wallet2 className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
                </h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
              {lang === "ENG" 
                ? "Choose your preferred wallet to connect to the Celo network."
                : "Pilih dompet favorit Anda untuk terhubung ke jaringan Celo."}
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2.5">
              {WALLET_LIST.map((wallet, idx) => (
                <motion.button
                  key={wallet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPending && connectingId === wallet.id}
                  onClick={() => handleConnect(wallet.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/25 transition-all duration-200 group disabled:opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shadow-sm"
                      style={{ backgroundColor: `${wallet.color}18` }}
                    >
                      <img
                        src={wallet.icon}
                        alt={wallet.name}
                        className="w-7 h-7"
                      />
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-base text-black dark:text-white block group-hover:text-[#35D07F] transition-colors">
                        {wallet.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lang === "ENG" ? "Browser Extension" : "Ekstensi Browser"}
                      </span>
                    </div>
                  </div>
                  {connectingId === wallet.id ? (
                    <Loader2 className="w-5 h-5 text-[#35D07F] animate-spin" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-black/5 dark:border-white/10 text-center">
              <p className="text-xs text-gray-500">
                {lang === "ENG" ? "Don't have a wallet?" : "Belum punya dompet?"}{" "}
                <a 
                  href="https://metamask.io/download/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#35D07F] font-bold hover:underline inline-flex items-center gap-1"
                >
                  {lang === "ENG" ? "Get MetaMask" : "Dapatkan MetaMask"}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
