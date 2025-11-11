import { wagmiConfig } from "@/services/wagmi";
import {
  getWalletClient as getWagmiWalletClient,
  getPublicClient as getWagmiPublicClient,
  getClient as getWagmiClient,
} from "@wagmi/core";

export const getClient = () => {
  return getWagmiClient(wagmiConfig);
};

export const getWalletClient = () => {
  return getWagmiWalletClient(wagmiConfig);
};

export const getPublicClient = () => {
  return getWagmiPublicClient(wagmiConfig);
};
