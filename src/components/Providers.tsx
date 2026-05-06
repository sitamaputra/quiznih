"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { CeloProvider } from "@/components/CeloProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CeloProvider>
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
    </CeloProvider>
  );
}
