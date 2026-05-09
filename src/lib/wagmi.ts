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
    name: "MetaMask",
    icon: "/wallets/metamask.svg",
    downloadUrl: "https://metamask.io/download/",
    color: "#F6851B",
  },
  {
    name: "Rabby Wallet",
    icon: "/wallets/rabby.svg",
    downloadUrl: "https://rabby.io/",
    color: "#7C7AF9",
  },
  {
    name: "OKX Wallet",
    icon: "/wallets/okx.svg",
    downloadUrl: "https://www.okx.com/web3",
    color: "#000000",
  },
  {
    name: "Bitget Wallet",
    icon: "/wallets/bitget.svg",
    downloadUrl: "https://web3.bitget.com/",
    color: "#00D4AA",
  },
  {
    name: "Trust Wallet",
    icon: "/wallets/trust.svg",
    downloadUrl: "https://trustwallet.com/",
    color: "#3375BB",
  },
] as const;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
