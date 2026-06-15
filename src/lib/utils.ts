import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const config = {
  // IPFS subdomain-gateway host. Content is served from
  // `https://<cid>.ipfs.<host>/` (subdomain form — each CID gets its own origin).
  ipfsGatewayHost: process.env.NEXT_PUBLIC_IPFS_GATEWAY_HOST ?? "inbrowser.link",
  dappId: process.env.NEXT_PUBLIC_DAPP_ID ?? "foc-upload-dapp",
};

export function scopeKey(address: string, chainId: number) {
  return `${address.toLowerCase()}-${chainId}`;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
