"use client";
import React, { useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useConnect, useConnectors } from "wagmi";
import { wagmiConfig } from "@/lib/wagmi";

const queryClient = new QueryClient();

/**
 * Auto-connect hook for MiniPay environment
 * MiniPay injects window.ethereum with isMiniPay=true
 * and expects auto-connection without user interaction
 */
function MiniPayAutoConnect() {
  const connectors = useConnectors();
  const { connect } = useConnect();

  useEffect(() => {
    let isMiniPay = false;
    try {
      isMiniPay = typeof window !== "undefined" && !!(window as any).ethereum?.isMiniPay;
    } catch {
      return;
    }

    if (!isMiniPay || connectors.length === 0) return;

    // Timeout guard: if wagmi never resolves, don't hang the UI
    const timeout = setTimeout(() => {}, 8000);

    try {
      connect(
        { connector: connectors[0] },
        { onError: () => clearTimeout(timeout) }
      );
    } catch {
      // Swallow synchronous connector errors (e.g. "Cannot redefine property: ethereum")
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [connectors, connect]);

  return null;
}

export function CeloProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniPayAutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
