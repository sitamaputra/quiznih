"use client";
import { Flame, Twitter, Github, MessagesSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="w-full border-t border-black/10 dark:border-white/10 mt-24 py-12 relative px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#14F195] to-[#9945FF] flex items-center justify-center font-bold text-white dark:text-black text-xs">
            Q
          </div>
          <span className="font-bold text-lg text-black dark:text-white">
            Quiz<span className="text-gradient">nih</span>
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-500 text-center">
          &copy; 2026 Quiznih. {lang === "ENG" 
            ? "Built for Superteam Indonesia on Solana."
            : "Dibangun untuk Superteam Indonesia di atas Solana."}
        </p>

        <div className="flex gap-4">
          <button className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 hover:text-[#1DA1F2] dark:text-gray-400 dark:hover:text-[#1DA1F2] transition-colors">
            <Twitter className="w-5 h-5" />
          </button>
          <button className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 hover:text-[#5865F2] dark:text-gray-400 dark:hover:text-[#5865F2] transition-colors">
            <MessagesSquare className="w-5 h-5" />
          </button>
          <button className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
            <Github className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
