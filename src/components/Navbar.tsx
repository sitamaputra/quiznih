"use client";
import { Wallet2, Menu, Globe2, Sun, Moon, LogOut } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import WalletDropdown from "./WalletDropdown";

export default function Navbar() {
  const { lang, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => setMounted(true), []);

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-black/10 dark:border-white/10 text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="Quiznih" className="w-9 h-9 rounded-xl" />
              <span className="font-extrabold text-xl tracking-wider">
                Quiz<span className="text-gradient">nih</span>
              </span>
            </a>
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

            <WalletDropdown />
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
