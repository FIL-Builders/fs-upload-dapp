"use client";

import { calibration, mainnet } from "@filoz/synapse-sdk";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";

// Obtain a real project ID at https://cloud.walletconnect.com and set it in
// .env.local as NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID to enable WalletConnect,
// Rainbow, and Rabby. MetaMask works without it.
const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "filecoin-onchain-cloud-dapp";

const getConnectors = () => {
  if (typeof window === "undefined") {
    return [];
  }

  return connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [metaMaskWallet, injectedWallet],
      },
      {
        groupName: "Popular",
        wallets: [rainbowWallet, rabbyWallet, walletConnectWallet],
      },
    ],
    {
      appName: "Filecoin Onchain Cloud",
      projectId,
    },
  );
};

export const wagmiConfig = createConfig({
  connectors: getConnectors(),
  chains: [
    { ...calibration, name: "Calibration" },
    { ...mainnet, name: "Mainnet" },
  ],
  transports: {
    [mainnet.id]: http(undefined, { batch: true }),
    [calibration.id]: http(undefined, { batch: true }),
  },
  batch: {
    multicall: false,
  },
});
