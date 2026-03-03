import { calibration, mainnet } from "@filoz/synapse-sdk";

export const SUPPORTED_CHAINS = [calibration, mainnet];

export const CHAIN_NAMES: Record<number, string> = {
  [314]: "Mainnet",
  [314159]: "Calibration",
};
