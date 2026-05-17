/**
 * Wagmi configuration for Celo chain
 * Uses EIP-6963 multiInjectedProviderDiscovery (enabled by default)
 * to auto-detect all installed wallet extensions (MetaMask, Rabby, OKX, etc.)
 */

import { http, createConfig } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { injected } from "wagmi/connectors";

function createSafeConfig() {
  try {
    return createConfig({
      chains: [celo, celoAlfajores],
      multiInjectedProviderDiscovery: true,
      connectors: [injected()],
      transports: {
        [celo.id]: http(),
        [celoAlfajores.id]: http(),
      },
    });
  } catch {
    // Fallback when wallet extensions conflict (e.g. "Cannot redefine property: ethereum")
    return createConfig({
      chains: [celo, celoAlfajores],
      multiInjectedProviderDiscovery: false,
      connectors: [],
      transports: {
        [celo.id]: http(),
        [celoAlfajores.id]: http(),
      },
    });
  }
}

export const wagmiConfig = createSafeConfig();

/**
 * Static wallet list for display when no wallets are detected
 * These serve as "install" prompts with download links
 */
export const WALLET_INSTALL_LIST = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "https://res.cloudinary.com/dsichsufc/image/upload/Metamask_logo_xexpwo.png",
    downloadUrl: "https://metamask.io/download/",
    color: "#F6851B",
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    icon: "https://res.cloudinary.com/dsichsufc/image/upload/unnamed_3_ctzyrw.png",
    downloadUrl: "https://rabby.io/",
    color: "#7C7AF9",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    icon: "https://res.cloudinary.com/dsichsufc/image/upload/Okx_Logo_pb3gab.png",
    downloadUrl: "https://www.okx.com/web3",
    color: "#000000",
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    icon: "https://res.cloudinary.com/dsichsufc/image/upload/bitget_wallet_logo_jlus0t.webp",
    downloadUrl: "https://web3.bitget.com/",
    color: "#00D4AA",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    icon: "https://res.cloudinary.com/dsichsufc/image/upload/trust-wallet-icon_kqqr8j.webp",
    downloadUrl: "https://trustwallet.com/",
    color: "#3375BB",
  },
] as const;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
