"use client";
import { Twitter, Github, MessagesSquare } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="w-full border-t border-black/5 dark:border-[#FCFF52]/10 mt-24 py-12 relative px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-[#050508]">
      {/* Grid overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#FCFF52] flex items-center justify-center font-black text-black text-xs">Q</div>
          <span className="font-extrabold text-lg font-mono tracking-widest text-black dark:text-white">
            QUIZ<span className="text-[#c4a700] dark:text-[#FCFF52]">NIH</span>
          </span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-600 text-center font-mono">
          &copy; 2026 QUIZNIH // {lang === "ENG"
            ? "BUILT ON CELO FOR MINIPAY"
            : "DIBANGUN DI ATAS CELO UNTUK MINIPAY"}
        </p>

        <div className="flex gap-3">
          {[
            { icon: <Twitter className="w-4 h-4" />, color: "#1DA1F2" },
            { icon: <MessagesSquare className="w-4 h-4" />, color: "#5865F2" },
            { icon: <Github className="w-4 h-4" />, color: "#FCFF52" },
          ].map((s, i) => (
            <button key={i} className="p-2.5 rounded-lg border border-black/10 dark:border-[#FCFF52]/10 bg-black/5 dark:bg-[#FCFF52]/5 hover:bg-black/10 dark:hover:bg-[#FCFF52]/10 text-gray-500 hover:text-black dark:hover:text-[#FCFF52] transition-all">
              {s.icon}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
