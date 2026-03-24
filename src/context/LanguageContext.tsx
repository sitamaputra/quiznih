"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Lang = "ENG" | "ID";

interface LanguageContextProps {
  lang: Lang;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ENG");

  const toggleLang = () => {
    setLang((prev) => (prev === "ENG" ? "ID" : "ENG"));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
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
