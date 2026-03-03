import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const config = {
  ipfsGatewayUrl: process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL ?? "https://ipfs.io/ipfs/",
  dappId: process.env.NEXT_PUBLIC_DAPP_ID ?? "fs-upload-dapp",
};

export function scopeKey(address: string, chainId: number) {
  return `${address.toLowerCase()}-${chainId}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
