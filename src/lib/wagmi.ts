/**
 * Wagmi configuration for Celo chain
 * Uses EIP-6963 multiInjectedProviderDiscovery (enabled by default)
 * to auto-detect all installed wallet extensions (MetaMask, Rabby, OKX, etc.)
 */

import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  // EIP-6963: auto-discover all injected wallets (MetaMask, Rabby, OKX, Bitget, Trust, etc.)
  multiInjectedProviderDiscovery: true,
  connectors: [
    // Fallback injected connector (for wallets that don't support EIP-6963 yet, including MiniPay)
    injected(),
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
});

/**
 * Static wallet list for display when no wallets are detected
 * These serve as "install" prompts with download links
 */
export const WALLET_INSTALL_LIST = [
  {
    name: "MetaMask",
    icon: "https://raw.githubusercontent.com/nicoolasbns/wallet-icons/refs/heads/main/metamask.png",
    downloadUrl: "https://metamask.io/download/",
    color: "#F6851B",
  },
  {
    name: "Rabby Wallet",
    icon: "https://raw.githubusercontent.com/nicoolasbns/wallet-icons/refs/heads/main/rabby.png",
    downloadUrl: "https://rabby.io/",
    color: "#7C7AF9",
  },
  {
    name: "OKX Wallet",
    icon: "https://raw.githubusercontent.com/nicoolasbns/wallet-icons/refs/heads/main/okx.png",
    downloadUrl: "https://www.okx.com/web3",
    color: "#000000",
  },
  {
    name: "Bitget Wallet",
    icon: "https://raw.githubusercontent.com/nicoolasbns/wallet-icons/refs/heads/main/bitget.png",
    downloadUrl: "https://web3.bitget.com/",
    color: "#00D4AA",
  },
  {
    name: "Trust Wallet",
    icon: "https://raw.githubusercontent.com/nicoolasbns/wallet-icons/refs/heads/main/trustwallet.png",
    downloadUrl: "https://trustwallet.com/",
    color: "#3375BB",
  },
] as const;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
