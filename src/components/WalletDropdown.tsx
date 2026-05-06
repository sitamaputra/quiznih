"use client";
import { useAccount, useBalance, useConnect, useDisconnect, useConnectors } from "wagmi";
import { useState, useEffect, useRef } from "react";
import { Wallet2, LogOut, Copy, CheckCircle2, ChevronDown, Coins, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { shortenAddress, getExplorerAddressUrl, IS_TESTNET, isMiniPayEnvironment } from "@/lib/celo";

export default function WalletDropdown({ hideIfDisconnected = false }: { hideIfDisconnected?: boolean }) {
  const { lang } = useLanguage();
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const connectors = useConnectors();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMiniPay = isMiniPayEnvironment();

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
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  if (!isConnected || !address) {
    if (hideIfDisconnected) return null;
    // In MiniPay, don't show connect button (auto-connect handles it)
    if (isMiniPay) return null;
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 bg-[#35D07F]/10 dark:bg-[#35D07F]/20 hover:bg-[#35D07F]/30 dark:hover:bg-[#35D07F]/40 border border-[#35D07F] px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(53,208,127,0.2)] hover:shadow-[0_0_25px_rgba(53,208,127,0.4)] text-[#35D07F]"
      >
        <Wallet2 className="w-4 h-4" />
        <span className="font-semibold text-sm">
          {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
        </span>
      </button>
    );
  }

  const shortAddr = shortenAddress(address);
  const balance = balanceData ? parseFloat(balanceData.formatted).toFixed(4) : "...";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#35D07F]/10 dark:bg-[#35D07F]/20 border border-[#35D07F] px-4 py-2 rounded-full shadow-[0_0_15px_rgba(53,208,127,0.2)] hover:bg-[#35D07F]/20 transition-all font-semibold text-sm text-[#35D07F] dark:text-[#7DFCB4]"
      >
        <Wallet2 className="w-4 h-4" />
        <span>{shortAddr}</span>
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
              <div className="w-12 h-12 bg-gradient-to-br from-[#FCFF52] to-[#35D07F] rounded-full flex items-center justify-center p-0.5 shadow-lg mb-2">
                <div className="w-full h-full bg-white dark:bg-black rounded-full flex items-center justify-center">
                  <Wallet2 className="w-6 h-6 text-[#35D07F]" />
                </div>
              </div>
              <span className="font-mono font-bold text-lg">{shortAddr}</span>
              <span className="text-xs text-gray-500 font-semibold">
                {isMiniPay ? "MiniPay" : "Celo Wallet"}
                {IS_TESTNET && " (Alfajores)"}
              </span>
            </div>

            {/* Balance */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Coins className="w-4 h-4" />
                <span className="text-sm font-semibold">{lang === "ENG" ? "Balance" : "Saldo"}</span>
              </div>
              <span className="font-black text-[#35D07F]">
                {balance} CELO
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
                {copied && <CheckCircle2 className="w-4 h-4 text-[#35D07F]" />}
              </button>

              <a
                href={getExplorerAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors font-semibold text-sm"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <span>{lang === "ENG" ? "View on Explorer" : "Lihat di Explorer"}</span>
              </a>

              {!isMiniPay && (
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors font-semibold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{lang === "ENG" ? "Disconnect" : "Putuskan Koneksi"}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
