"use client";
import { Wallet2, Menu, Globe2, Sun, Moon, LogOut } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => setMounted(true), []);

  const handleWalletClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-black/10 dark:border-white/10 text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#14F195] to-[#9945FF] flex items-center justify-center font-bold text-white dark:text-black">
              Q
            </div>
            <span className="font-bold text-xl tracking-wider">
              Quiz<span className="text-gradient">nih</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              {lang === "ENG" ? "How it Works" : "Cara Kerja"}
            </a>
            <a href="#leaderboard" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              {lang === "ENG" ? "Leaderboard" : "Papan Peringkat"}
            </a>
            
            <div className="flex items-center gap-2 border-l border-black/10 dark:border-white/10 pl-6">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              )}

              <button 
                onClick={toggleLang}
                className="flex items-center gap-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/10 dark:border-white/20 px-3 py-1.5 rounded-full transition-colors text-xs font-bold"
              >
                <Globe2 className="w-3 h-3" />
                {lang}
              </button>
            </div>

            {publicKey ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#9945FF]/10 dark:bg-[#9945FF]/20 border border-[#9945FF] px-4 py-2 rounded-full shadow-[0_0_15px_rgba(153,69,255,0.2)]">
                  <Wallet2 className="w-4 h-4 text-[#9945FF] dark:text-[#E2C8FF]" />
                  <span className="font-semibold text-sm text-[#9945FF] dark:text-[#E2C8FF]">
                    {`${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`}
                  </span>
                </div>
                <button
                  onClick={handleWalletClick}
                  className="p-2.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  title={lang === "ENG" ? "Disconnect Wallet" : "Putuskan Dompet"}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleWalletClick}
                className="flex items-center gap-2 bg-[#9945FF]/10 dark:bg-[#9945FF]/20 hover:bg-[#9945FF]/30 dark:hover:bg-[#9945FF]/40 border border-[#9945FF] px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(153,69,255,0.2)] hover:shadow-[0_0_25px_rgba(153,69,255,0.4)]"
              >
                <Wallet2 className="w-4 h-4" />
                <span className="font-semibold text-sm">
                  {lang === "ENG" ? "Connect Wallet" : "Hubungkan Dompet"}
                </span>
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/20 text-black dark:text-white px-2 py-1 rounded text-xs"
            >
              <Globe2 className="w-3 h-3" />
              {lang}
            </button>
            <button className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
