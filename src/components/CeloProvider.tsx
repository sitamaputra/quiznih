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
    const isMiniPay =
      typeof window !== "undefined" && (window as any).ethereum?.isMiniPay;
    if (isMiniPay && connectors.length > 0) {
      // Auto-connect using the first available injected connector
      connect({ connector: connectors[0] });
    }
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
