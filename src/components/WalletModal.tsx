"use client";
import { X, ChevronRight, Loader2, Wallet2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useConnect, useAccount } from "wagmi";
import { WALLET_INSTALL_LIST } from "@/lib/wagmi";
import { useState, useEffect } from "react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { lang } = useLanguage();
  const { connectors, connect, isPending, error: connectError } = useConnect();
  const { isConnected } = useAccount();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Close when connected
  useEffect(() => {
    if (isConnected && connectingId) {
      setConnectingId(null);
      onClose();
    }
  }, [isConnected, connectingId, onClose]);

  // Reset connecting state on error
  useEffect(() => {
    if (connectError) setConnectingId(null);
  }, [connectError]);

  // Unique connectors (filter duplicates)
  const walletConnectors = connectors.filter((c, i, arr) =>
    arr.findIndex(x => x.name === c.name) === i
  );

  const detectedWallets = walletConnectors.filter(
    c => c.name !== "Injected" && c.id !== "injected"
  );

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
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#35D07F] to-[#FCFF52] flex items-center justify-center">
                  <Wallet2 className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-black dark:text-white">
                  {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
              {lang === "ENG" 
                ? "Choose your wallet to connect to the Celo network."
                : "Pilih dompet Anda untuk terhubung ke jaringan Celo."}
            </p>

            {/* Connection error */}
            {connectError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {connectError.message?.includes("rejected") 
                  ? (lang === "ENG" ? "Connection rejected by user" : "Koneksi ditolak pengguna")
                  : connectError.message || "Connection failed"}
              </div>
            )}

            {/* Detected wallets */}
            {detectedWallets.length > 0 ? (
              <div className="space-y-2.5">
                {detectedWallets.map((connector, idx) => (
                  <motion.button
                    key={connector.uid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isPending && connectingId === connector.uid}
                    onClick={() => {
                      setConnectingId(connector.uid);
                      connect({ connector });
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/[0.08] hover:border-[#35D07F]/40 transition-all duration-200 group disabled:opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-sm flex-shrink-0">
                        {connector.icon ? (
                          <img src={connector.icon} alt={connector.name} className="w-8 h-8 rounded-lg" />
                        ) : (
                          <Wallet2 className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-base text-black dark:text-white block group-hover:text-[#35D07F] transition-colors">
                          {connector.name}
                        </span>
                        <span className="text-xs text-green-500">
                          {lang === "ENG" ? "Detected" : "Terdeteksi"} ✓
                        </span>
                      </div>
                    </div>
                    {connectingId === connector.uid ? (
                      <Loader2 className="w-5 h-5 text-[#35D07F] animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              /* No wallets detected - show install links */
              <div className="space-y-2.5">
                <p className="text-xs text-gray-500 mb-3">
                  {lang === "ENG" 
                    ? "No wallet detected. Install one to get started:" 
                    : "Tidak ada wallet terdeteksi. Install salah satu:"}
                </p>
                {WALLET_INSTALL_LIST.map((wallet, idx) => (
                  <motion.a
                    key={wallet.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    href={wallet.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:border-white/25 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-sm flex-shrink-0">
                        <img src={wallet.icon} alt={wallet.name} className="w-8 h-8 rounded-lg" />
                      </div>
                      <span className="font-bold text-base text-black dark:text-white">
                        {wallet.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#35D07F]/10 text-[#35D07F] text-xs font-bold group-hover:bg-[#35D07F]/20 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                      Install
                    </div>
                  </motion.a>
                ))}
              </div>
            )}

            {/* Fallback: generic injected button */}
            {detectedWallets.length === 0 && walletConnectors.length > 0 && (
              <button
                onClick={() => {
                  const fallback = walletConnectors[0];
                  setConnectingId(fallback.uid);
                  connect({ connector: fallback });
                }}
                disabled={isPending}
                className="w-full mt-4 py-3.5 rounded-xl border-2 border-dashed border-white/20 text-gray-400 hover:text-white hover:border-[#35D07F]/50 font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet2 className="w-4 h-4" />}
                {lang === "ENG" ? "Try Browser Wallet" : "Coba Browser Wallet"}
              </button>
            )}

            <div className="mt-8 pt-5 border-t border-black/5 dark:border-white/10 text-center">
              <p className="text-xs text-gray-500">
                {lang === "ENG" ? "Supports Celo, Alfajores Testnet" : "Mendukung Celo, Alfajores Testnet"}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
