"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "ENG" | "ID";

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: "ENG", label: "English", flag: "🇺🇸" },
  { code: "ID", label: "Indonesia", flag: "🇮🇩" },
];

interface LanguageContextProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ENG");

  const toggleLang = () => setLang(lang === "ENG" ? "ID" : "ENG");

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
