import { http, createConfig } from "wagmi";
import { celo } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { celoSepolia } from "./celo";

function createSafeConfig() {
  try {
    return createConfig({
      chains: [celo, celoSepolia],
      multiInjectedProviderDiscovery: true,
      connectors: [injected()],
      transports: {
        [celo.id]: http(),
        [celoSepolia.id]: http("https://celo-sepolia.drpc.org"),
      },
    });
  } catch {
    // Fallback ketika wallet extension konflik (e.g. "Cannot redefine property: ethereum")
    return createConfig({
      chains: [celo, celoSepolia],
      multiInjectedProviderDiscovery: false,
      connectors: [],
      transports: {
        [celo.id]: http(),
        [celoSepolia.id]: http("https://celo-sepolia.drpc.org"),
      },
    });
  }
}

export const wagmiConfig = createSafeConfig();

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
