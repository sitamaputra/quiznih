/**
 * Wagmi configuration for Celo chain
 * Supports MiniPay (injected), MetaMask, Rabby, OKX, Bitget, Trust Wallet
 */

import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Wallet connector definitions
 * Each entry maps to a specific wallet extension via RDNS or provider flags
 */
export const WALLET_LIST = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/wallets/metamask.svg",
    color: "#F6851B",
    rdns: "io.metamask",
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: "/wallets/rabby.svg",
    color: "#7C7AF9",
    rdns: "io.rabby",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "/wallets/okx.svg",
    color: "#FFFFFF",
    rdns: "com.okex.wallet",
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    icon: "/wallets/bitget.svg",
    color: "#00D4AA",
    rdns: "com.bitget.web3",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "/wallets/trust.svg",
    color: "#3375BB",
    rdns: "com.trustwallet.app",
  },
] as const;

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    // MiniPay / generic injected (auto-detected)
    injected(),
    // MetaMask
    injected({ target: "metaMask" }),
    // Rabby
    injected({ target: { id: "rabby", name: "Rabby Wallet", provider: (w) => (w as any)?.rabby } }),
    // OKX Wallet
    injected({ target: { id: "okxwallet", name: "OKX Wallet", provider: (w) => (w as any)?.okxwallet } }),
    // Bitget Wallet
    injected({ target: { id: "bitkeep", name: "Bitget Wallet", provider: (w) => (w as any)?.bitkeep?.ethereum } }),
    // Trust Wallet
    injected({ target: { id: "trustwallet", name: "Trust Wallet", provider: (w) => (w as any)?.trustwallet } }),
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
