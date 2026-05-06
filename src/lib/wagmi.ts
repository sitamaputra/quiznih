/**
 * Wagmi configuration for Celo chain
 * Supports both MiniPay (injected) and standard browser wallets
 */

import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(), // Generic injected (MiniPay, etc.)
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
