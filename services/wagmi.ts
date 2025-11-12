import { filecoinCalibration, filecoin } from "viem/chains";
import { createConfig, http } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, rainbowWallet, metaMaskWallet, rabbyWallet } from "@rainbow-me/rainbowkit/wallets";

// Only initialize connectors on the client side
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
        wallets: [rainbowWallet, rabbyWallet],
      },
    ],
    {
      appName: "Filecoin Onchain Cloud dApp",
      projectId: "filecoin-onchain-cloud-dapp",
    },
  );
};

export const config = createConfig({
  connectors: getConnectors(),
  chains: [{ ...filecoinCalibration, name: "Filecoin testnet" }, { ...filecoin, name: "Filecoin" }],
  transports: {
    [filecoin.id]: http(undefined, {
      batch: true,
    }),
    [filecoinCalibration.id]: http(undefined, {
      batch: true,
    }),
  },
  batch: {
    multicall: false,
  },
});