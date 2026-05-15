"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { CeloProvider } from "@/components/providers/CeloProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CeloProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        nonce=""
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </NextThemesProvider>
    </CeloProvider>
  );
}
