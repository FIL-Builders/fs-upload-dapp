import { Address } from "viem";

export const MAX_UINT256 = 2n ** 256n - 1n;

// 0.1 USDFC in wei (used for dataset creation fee)
export const DATA_SET_CREATION_FEE = BigInt(0.1 * 10 ** 18);

export const getQueryKey = (
  type: "balances" | "datasets" | "upload" | "download",
  address: string | Address | undefined
) => {
  return [type, address];
};

export const getAllQueryKeys = (address: string | Address | undefined) => {
  return [
    getQueryKey("balances", address),
    getQueryKey("datasets", address),
    getQueryKey("upload", address),
    getQueryKey("download", address),
  ];
};
