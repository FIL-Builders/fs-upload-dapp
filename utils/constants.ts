import { Address } from "viem";

export const MAX_UINT256 = 2n ** 256n - 1n;

// 0.1 USDFC in wei (used for dataset creation fee)
export const DATA_SET_CREATION_FEE = BigInt(0.1 * 10 ** 18);

export const LEAF_SIZE = 32n;

export const getQueryKey = (
  type: "balances" | "datasets" | "upload" | "download",
  key: string | Address | undefined
) => {
  return [type, key];
};

/**
 * EIP-2612 typed data schema (Permit)
 */
export const EIP2612_PERMIT_TYPES: Record<
  string,
  { name: string; type: string }[]
> = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export const erc20PermitAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "nonces",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "version",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const paymentsAbi = [
  {
    type: "function",
    inputs: [
      { name: "token", internalType: "address", type: "address" },
      { name: "to", internalType: "address", type: "address" },
      { name: "amount", internalType: "uint256", type: "uint256" },
      { name: "deadline", internalType: "uint256", type: "uint256" },
      { name: "v", internalType: "uint8", type: "uint8" },
      { name: "r", internalType: "bytes32", type: "bytes32" },
      { name: "s", internalType: "bytes32", type: "bytes32" },
      { name: "operator", internalType: "address", type: "address" },
      { name: "rateAllowance", internalType: "uint256", type: "uint256" },
      { name: "lockupAllowance", internalType: "uint256", type: "uint256" },
      { name: "maxLockupPeriod", internalType: "uint256", type: "uint256" },
    ],
    name: "depositWithPermitAndApproveOperator",
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const USDFC_ADDRESS =
  "0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0" as Address;
export const MULTICALL_ADDRESS =
  "0xcA11bde05977b3631167028862bE2a173976CA11" as Address;
