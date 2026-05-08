"use client";
import { ArrowLeft, Sun, Moon, Globe2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

interface TopBarProps {
  /** Override back destination. If not provided, uses router.back() */
  backHref?: string;
  /** Hide back button (e.g. on landing page) */
  hideBack?: boolean;
}

export default function TopBar({ backHref, hideBack = false }: TopBarProps) {
  const router = useRouter();
  const { lang, setLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#050508]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-12">
        {/* Left: Back */}
        <div className="flex items-center gap-3">
          {!hideBack && (
            <button onClick={handleBack}
              className="flex items-center gap-1.5 text-gray-500 hover:text-black dark:hover:text-white transition-colors group text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
        </div>

        {/* Right: Theme + Language */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-500 hover:text-black dark:hover:text-white"
              title={theme === "dark" ? "Light Mode" : "Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs font-bold text-gray-600 dark:text-gray-400"
            >
              <span>{currentLang.flag}</span>
              <span className="font-mono">{lang}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#0a0a12] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                      lang === l.code
                        ? "bg-[#06B6D4]/10 text-[#06B6D4] dark:bg-[#FCFF52]/10 dark:text-[#FCFF52]"
                        : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <span>{l.label}</span>
                    <span className="ml-auto font-mono text-[10px] text-gray-400">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
