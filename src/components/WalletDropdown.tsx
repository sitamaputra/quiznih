"use client";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect, useRef } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Wallet2, LogOut, Copy, CheckCircle2, ChevronDown, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function WalletDropdown() {
  const { lang } = useLanguage();
  const { publicKey, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [balance, setBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (publicKey) {
      connection.getBalance(publicKey).then((lamports) => {
        setBalance(lamports / LAMPORTS_PER_SOL);
      }).catch((e) => console.error("Error fetching balance:", e));
    } else {
      setBalance(null);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!publicKey) {
    return (
      <button 
        onClick={() => setVisible(true)}
        className="flex items-center gap-2 bg-[#9945FF]/10 dark:bg-[#9945FF]/20 hover:bg-[#9945FF]/30 dark:hover:bg-[#9945FF]/40 border border-[#9945FF] px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(153,69,255,0.2)] hover:shadow-[0_0_25px_rgba(153,69,255,0.4)]"
      >
        <Wallet2 className="w-4 h-4" />
        <span className="font-semibold text-sm">
          {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
        </span>
      </button>
    );
  }

  const shortAddress = `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#9945FF]/10 dark:bg-[#9945FF]/20 border border-[#9945FF] px-4 py-2 rounded-full shadow-[0_0_15px_rgba(153,69,255,0.2)] hover:bg-[#9945FF]/20 transition-all font-semibold text-sm text-[#9945FF] dark:text-[#E2C8FF]"
      >
        {wallet?.adapter.icon ? (
          <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-4 h-4" />
        ) : (
          <Wallet2 className="w-4 h-4" />
        )}
        <span>{shortAddress}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-black/10 dark:border-white/10 p-4 rounded-3xl shadow-2xl z-50 flex flex-col gap-4 text-black dark:text-white"
          >
            {/* Header / Account info */}
            <div className="flex flex-col gap-1 items-center pb-4 border-b border-black/5 dark:border-white/5">
              <div className="w-12 h-12 bg-gradient-to-br from-[#14F195] to-[#9945FF] rounded-full flex items-center justify-center p-0.5 shadow-lg mb-2">
                <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center">
                  {wallet?.adapter.icon ? (
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} className="w-7 h-7 rounded-sm" />
                  ) : (
                    <Wallet2 className="w-6 h-6 text-[#9945FF]" />
                  )}
                </div>
              </div>
              <span className="font-mono font-bold text-lg">{shortAddress}</span>
              <span className="text-xs text-gray-500 font-semibold">{wallet?.adapter.name}</span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-semibold">{lang === "ENG" ? "Balance" : "Saldo"}</span>
              </div>
              <span className="font-black text-[#14F195]">
                {balance !== null ? balance.toFixed(4) : "..."} SOL
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-semibold text-sm"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span>{lang === "ENG" ? "Copy Address" : "Salin Alamat"}</span>
                </div>
                {copied && <CheckCircle2 className="w-4 h-4 text-[#14F195]" />}
              </button>
              
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors font-semibold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{lang === "ENG" ? "Disconnect" : "Putuskan Koneksi"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
