import {
  ProviderInfo,
  DataSetData,
  EnhancedDataSetInfo,
} from "@filoz/synapse-sdk";

/**
 * Unified size interface that consolidates storage size calculations
 * Standardizes on consistent naming patterns and supports both dataset and piece contexts
 * All calculations use GiB (1024^3) for internal consistency, GB (1000^3) for user display
 */
export interface UnifiedSizeInfo {
  /** Size in bytes - primary measurement */
  sizeBytes: bigint;
  /** Size in KiB (1024 bytes) */
  sizeKiB: number;
  /** Size in MiB (1024^2 bytes) */
  sizeMiB: number;
  /** Size in GiB (1024^3 bytes) - standardized for calculations */
  sizeGiB: number;
  /** Whether CDN storage is enabled for this item */
  withCDN?: boolean;
  /** Number of merkle tree leaves */
  leafCount?: number;
  /** Number of pieces */
  pieceCount?: number;
  /** User-friendly size message */
  message?: string;
}

/**
 * Dataset-specific size information
 * Uses standardized UnifiedSizeInfo with required dataset fields
 */

export interface DatasetsSizeInfo {
  leafCount: number;
  pieceCount: number;
  withCDN: boolean;
  sizeInBytes: number;
  sizeInKiB: number;
  sizeInMiB: number;
  sizeInGB: number;
  message: string;
}

/**
 * Piece-specific size information
 * Uses standardized UnifiedSizeInfo with piece-specific fields
 */
export interface PieceSizeInfo extends UnifiedSizeInfo {
  /** Padding information for piece */
  padding: bigint;
  /** Height in merkle tree */
  height: number;
  /** Digest hex value (0x-prefixed) */
  digestHex: string;
  /** Whether padding is excessive */
  isPaddingExcessive: boolean;
}

export interface DataSet extends EnhancedDataSetInfo, DatasetsSizeInfo {
  data: DataSetData | null;
  provider: ProviderInfo | null;
  pieceSizes: Record<string, PieceSizeInfo>;
}

export interface DatasetsResponse {
  datasets: DataSet[];
}

/**
 * Interface for formatted balance data returned by useBalances
 */
export interface UseBalancesResponse {
  filBalance: bigint;
  usdfcBalance: bigint;
  warmStorageBalance: bigint;
  filBalanceFormatted: number;
  usdfcBalanceFormatted: number;
  warmStorageBalanceFormatted: number;
  persistenceDaysLeft: number;
  persistenceDaysLeftAtCurrentRate: number;
  isSufficient: boolean;
  isRateSufficient: boolean;
  isLockupSufficient: boolean;
  rateNeeded: bigint;
  cdnUsedGiB: number;
  nonCdnUsedGiB: number;
  totalLockupNeeded: bigint;
  depositNeeded: bigint;
  currentRateAllowanceGB: number;
  currentStorageGB: number;
  currentLockupAllowance: bigint;
  totalDatasets: number;
}

export const defaultBalances: UseBalancesResponse = {
  filBalance: 0n,
  usdfcBalance: 0n,
  warmStorageBalance: 0n,
  filBalanceFormatted: 0,
  usdfcBalanceFormatted: 0,
  warmStorageBalanceFormatted: 0,
  persistenceDaysLeft: 0,
  persistenceDaysLeftAtCurrentRate: 0,
  isSufficient: false,
  isRateSufficient: false,
  isLockupSufficient: false,
  rateNeeded: 0n,
  cdnUsedGiB: 0,
  nonCdnUsedGiB: 0,
  totalLockupNeeded: 0n,
  depositNeeded: 0n,
  currentRateAllowanceGB: 0,
  currentStorageGB: 0,
  currentLockupAllowance: 0n,
  totalDatasets: 0,
};

/**
 * Interface representing the Pandora balance data returned from the SDK
 */
export interface WarmStorageBalance {
  rateAllowanceNeeded: bigint;
  lockupAllowanceNeeded: bigint;
  currentRateAllowance: bigint;
  currentLockupAllowance: bigint;
  currentRateUsed: bigint;
  currentLockupUsed: bigint;
  sufficient: boolean;
  message?: string;
  costs: {
    perEpoch: bigint;
    perDay: bigint;
    perMonth: bigint;
  };
  depositAmountNeeded: bigint;
}

/**
 * Interface representing the calculated storage metrics
 */
export interface StorageCalculationResult {
  /** The required rate allowance needed for storage */
  rateNeeded: bigint;
  /** The current rate used */
  rateUsed: bigint;
  /** The current storage usage in bytes */
  currentStorageBytes: bigint;
  /** The current storage usage in GB */
  currentStorageGB: number;
  /** The current storage usage in GB */
  cdnUsedGiB: number;
  /** The current storage usage in GB */
  nonCdnUsedGiB: number;
  /** The required lockup amount needed for storage persistence */
  totalLockupNeeded: bigint;
  /** The additional lockup amount needed for storage persistence */
  depositNeeded: bigint;
  /** Number of days left before lockup expires */
  persistenceDaysLeft: number;
  /** Number of days left before lockup expires at current rate */
  persistenceDaysLeftAtCurrentRate: number;
  /** Whether the current rate allowance is sufficient */
  isRateSufficient: boolean;
  /** Whether the current lockup allowance is sufficient for at least the minimum days threshold */
  isLockupSufficient: boolean;
  /** Whether both rate and lockup allowances are sufficient */
  isSufficient: boolean;
  /** The current rate allowance in GB */
  currentRateAllowanceGB: number;
  /** The current lockup allowance in USDFC */
  currentLockupAllowance: bigint;
  /** The total number of datasets */
  totalDatasets: number;
}

export interface StorageCosts {
  pricePerTiBPerMonthNoCDN: bigint;
  pricePerTiBPerMonthWithCDN: bigint;
}
