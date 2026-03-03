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
      projectId: "filecoin-onchain-cloud-dapp",
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
