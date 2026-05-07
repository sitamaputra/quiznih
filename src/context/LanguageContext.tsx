"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ENG" | "ID" | "JP" | "CN" | "KR" | "FR";

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "ENG", label: "English", flag: "🇺🇸" },
  { code: "ID", label: "Indonesia", flag: "🇮🇩" },
  { code: "JP", label: "日本語", flag: "🇯🇵" },
  { code: "CN", label: "中文", flag: "🇨🇳" },
  { code: "KR", label: "한국어", flag: "🇰🇷" },
  { code: "FR", label: "Français", flag: "🇫🇷" },
];

interface LanguageContextProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ENG");

  const toggleLang = () => {
    const idx = LANGUAGES.findIndex(l => l.code === lang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLang(next.code);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
