import type { StorageConfig } from "@/providers/storage-config";

export const queryKeys = {
  // ─── Queries ──────────────────────────────────────────────────────────────
  balances: (
    address: `0x${string}` | undefined,
    config: StorageConfig,
    chainId: number | undefined,
  ) => ["balances", address, config, chainId] as const,

  /** Mirrors the internal key used by @filoz/synapse-react useDataSets */
  datasets: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["synapse-warm-storage-data-sets", address, chainId] as const,

  session: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["sessionValidation", address, chainId] as const,

  // ─── Mutations ────────────────────────────────────────────────────────────
  download: (pieceCid: string) => ["download", pieceCid] as const,

  deletePiece: (
    address: `0x${string}` | undefined,
    chainId: number | undefined,
    dataSetId: string,
    pieceId: string,
  ) => ["deletePiece", address, chainId, dataSetId, pieceId] as const,

  deleteDataset: (
    address: `0x${string}` | undefined,
    chainId: number | undefined,
    dataSetId: string,
  ) => ["deleteDataset", address, chainId, dataSetId] as const,

  upload: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["upload", address, chainId] as const,

  pinUpload: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["pin-upload", address, chainId] as const,

  loginSession: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["loginSession", address, chainId] as const,

  revokeSession: (address: `0x${string}` | undefined, chainId: number | undefined) =>
    ["revokeSession", address, chainId] as const,
} as const;
