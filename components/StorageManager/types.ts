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
  isSufficient?: boolean;
  filBalance?: bigint;
  usdfcBalance?: bigint;
  depositNeeded?: bigint;
  daysLeft?: number;
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
