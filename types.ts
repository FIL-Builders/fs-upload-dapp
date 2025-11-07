

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
  sizeInBytes: number;
  sizeInKiB: number;
  sizeInMiB: number;
  sizeInGB: number;
}

/**
 * Interface for formatted balance data returned by useBalances
 */
export interface UseBalancesResponse extends StorageCalculationResult {
  filBalance: bigint;
  usdfcBalance: bigint;
  warmStorageBalance: bigint;
  filBalanceFormatted: number;
  usdfcBalanceFormatted: number;
  warmStorageBalanceFormatted: number;
  availableToFreeUpFormatted: number;
  monthlyRateFormatted: number;
  maxMonthlyRateFormatted: number;
}

export const defaultBalances: UseBalancesResponse = {
  availableToFreeUp: 0n,
  filBalance: 0n,
  usdfcBalance: 0n,
  warmStorageBalance: 0n,
  filBalanceFormatted: 0,
  usdfcBalanceFormatted: 0,
  warmStorageBalanceFormatted: 0,
  availableToFreeUpFormatted: 0,
  daysLeft: 0,
  daysLeftAtCurrentRate: 0,
  isSufficient: false,
  isRateSufficient: false,
  isLockupSufficient: false,
  depositNeeded: 0n,
  totalConfiguredCapacity: 0,
  monthlyRateFormatted: 0,
  maxMonthlyRateFormatted: 0,
};

/**
 * Interface representing the calculated storage metrics
 */
export interface StorageCalculationResult {
  /** Balance needed to cover storage */
  depositNeeded: bigint;
  /** The available balance to free up */
  availableToFreeUp: bigint;
  /** Number of days left before lockup expires at configured storage capacity(GB) rate */
  daysLeft: number;
  /** Number of days left before lockup expires at current rate */
  daysLeftAtCurrentRate: number;
  /** Whether the rate allowance and lockup allowance are sufficient based on your configuration */
  isSufficient: boolean;
  /** Whether the rate allowance is sufficient based on your configuration */
  isRateSufficient: boolean;
  /** Whether the lockup allowance is sufficient based on your configuration */
  isLockupSufficient: boolean;
  /** The total storage paid for in GB */
  totalConfiguredCapacity: number;
}

export type ConfigType = {
  storageCapacity: number;
  persistencePeriod: number;
  minDaysThreshold: number;
  withCDN: boolean;
};

export type ConfigContextType = {
  config: ConfigType;
  updateConfig: (newConfig: Partial<ConfigType>) => void;
  resetConfig: () => void;
};
