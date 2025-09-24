/**
 * 🔧 Shared Types for Storage Manager Components
 *
 * Common interfaces and types used across components.
 * Copy these along with components for full functionality.
 */

// Standard storage metrics interface
export interface StorageMetrics {
  cdnStorageGB: number;
  standardStorageGB: number;
  totalStorageGB: number;
  cdnStorageBytes: bigint;
  standardStorageBytes: bigint;
  totalStorageBytes: bigint;
}

// Balance information interface
export interface BalanceInfo {
  filBalanceFormatted?: number;
  usdfcBalanceFormatted?: number;
  warmStorageBalanceFormatted?: number;
  rateAllowanceFormatted?: number;
  lockupAllowanceFormatted?: number;
  isSufficient?: boolean;
  isRateSufficient?: boolean;
  isLockupSufficient?: boolean;
  filBalance?: bigint;
  usdfcBalance?: bigint;
  depositNeeded?: bigint;
  totalLockupNeeded?: bigint;
  rateNeeded?: bigint;
  currentLockupAllowance?: bigint;
  persistenceDaysLeft?: number;
  currentRateAllowanceGB?: number;
}

// Payment action payload
export interface PaymentPayload {
  lockupAllowance: bigint;
  epochRateAllowance: bigint;
  depositAmount: bigint;
}

// Dataset summary
export interface DatasetSummary {
  totalDatasets: number;
  cdnDatasets: number;
  standardDatasets: number;
}