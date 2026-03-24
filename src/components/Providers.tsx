"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { SolanaProvider } from "@/components/SolanaProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </NextThemesProvider>
    </SolanaProvider>
  );
}
