/**
 * Storage calculation utilities with high-precision arithmetic
 *
 * @description
 * Provides precise calculation functions for storage metrics, unit conversions,
 * and formatting. Uses decimal.js for financial-grade precision to avoid
 * floating-point errors in storage cost calculations.
 *
 * @features
 * - High-precision storage size conversions
 * - Persistence duration calculations
 * - Percentage formatting for UI display
 * - Consistent arithmetic using decimal.js
 */

import Decimal from 'decimal.js';
import { SIZE_CONSTANTS } from '@filoz/synapse-sdk';

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 34, // High precision for financial calculations
  rounding: Decimal.ROUND_HALF_UP, // Standard rounding
  toExpNeg: -21, // Use exponential notation for very small numbers
  toExpPos: 21, // Use exponential notation for very large numbers
  maxE: 9e15, // Maximum exponent
  minE: -9e15, // Minimum exponent
  modulo: Decimal.ROUND_DOWN, // Default modulo
});

/**
 * Converts bytes to KiB with high precision
 *
 * @param bytes - Bytes as BigInt, string, or number
 * @returns Decimal representing KiB
 */
export function bytesToKiB(bytes: bigint | string | number): Decimal {
  const bytesDecimal = new Decimal(bytes.toString());
  const kibConstant = new Decimal(SIZE_CONSTANTS.KiB.toString());
  return bytesDecimal.div(kibConstant);
}

/**
 * Converts bytes to MiB with high precision
 *
 * @param bytes - Bytes as BigInt, string, or number
 * @returns Decimal representing MiB
 */
export function bytesToMiB(bytes: bigint | string | number): Decimal {
  const bytesDecimal = new Decimal(bytes.toString());
  const mibConstant = new Decimal(SIZE_CONSTANTS.MiB.toString());
  return bytesDecimal.div(mibConstant);
}

/**
 * Converts bytes to GiB with high precision
 *
 * @param bytes - Bytes as BigInt, string, or number
 * @returns Decimal representing GiB
 */
export function bytesToGiB(bytes: bigint | string | number): Decimal {
  const bytesDecimal = new Decimal(bytes.toString());
  const gibConstant = new Decimal(SIZE_CONSTANTS.GiB.toString());
  return bytesDecimal.div(gibConstant);
}

/**
 * Converts TiB to bytes with high precision
 *
 * @param tib - TiB as number, string, or Decimal
 * @returns Decimal representing bytes
 */
export function tibToBytes(tib: number | string | Decimal): Decimal {
  const tibDecimal = tib instanceof Decimal ? tib : new Decimal(tib.toString());
  const tibConstant = new Decimal(SIZE_CONSTANTS.TiB.toString());
  return tibDecimal.mul(tibConstant);
}

/**
 * Calculates persistence days from lockup allowance and daily burn rate with high precision
 *
 * @param lockupAllowance - Available USDFC lockup allowance
 * @param dailyBurnRate - Daily USDFC consumption rate
 * @returns Decimal representing days of persistence
 *
 * @example
 * ```typescript
 * const days = calculatePersistenceDays(
 *   parseUnits("100", 18), // 100 USDFC available
 *   parseUnits("5", 18)    // 5 USDFC per day
 * );
 * // Returns: 20 days
 * ```
 */
export function calculatePersistenceDays(
  lockupAllowance: bigint | string | number | Decimal,
  dailyBurnRate: bigint | string | number | Decimal
): Decimal {
  const lockupDecimal = lockupAllowance instanceof Decimal
    ? lockupAllowance
    : new Decimal(lockupAllowance.toString());
  const rateDecimal = dailyBurnRate instanceof Decimal
    ? dailyBurnRate
    : new Decimal(dailyBurnRate.toString());

  if (rateDecimal.isZero()) {
    return new Decimal(Infinity);
  }

  // High-precision division for accurate persistence calculation
  return lockupDecimal.div(rateDecimal);
}

/**
 * Calculates persistence metrics with comprehensive scenarios using high precision
 *
 * @param remainingLockup - Available USDFC lockup allowance
 * @param newDailyLockupRate - Daily USDFC lockup rate with new storage
 * @param currentDailyLockupRate - Daily USDFC lockup rate at current usage
 * @returns Object with persistence duration calculations
 */
export function calculatePersistenceMetrics(
  remainingLockup: bigint,
  newDailyLockupRate: bigint,
  currentDailyLockupRate: bigint
): {
  persistenceDaysLeft: number;
  persistenceDaysLeftAtCurrentRate: number;
} {
  const remainingDecimal = new Decimal(remainingLockup.toString());
  const newRateDecimal = new Decimal(newDailyLockupRate.toString());
  const currentRateDecimal = new Decimal(currentDailyLockupRate.toString());

  // Calculate days remaining with new storage requirements
  const persistenceDaysLeftDecimal = newRateDecimal.isZero()
    ? new Decimal(Infinity)
    : remainingDecimal.div(newRateDecimal);

  // Calculate days remaining at current consumption rate
  const persistenceDaysLeftAtCurrentRateDecimal = currentRateDecimal.isZero()
    ? new Decimal(Infinity)
    : remainingDecimal.div(currentRateDecimal);

  return {
    persistenceDaysLeft: persistenceDaysLeftDecimal.isFinite()
      ? persistenceDaysLeftDecimal.toNumber()
      : Infinity,
    persistenceDaysLeftAtCurrentRate: persistenceDaysLeftAtCurrentRateDecimal.isFinite()
      ? persistenceDaysLeftAtCurrentRateDecimal.toNumber()
      : Infinity,
  };
}

/**
 * Formats a ratio (0-1) as a percentage string with proper precision
 *
 * @param ratio - Decimal ratio between 0 and 1
 * @param options - Formatting options
 * @returns Formatted percentage string (e.g., "75.5%")
 *
 * @example
 * ```typescript
 * formatPercentage(0.755) // Returns: "75.5%"
 * formatPercentage(0.001, { showZero: false }) // Returns: "< 0.01%"
 * ```
 */
export function formatPercentage(
  ratio: Decimal | number | string,
  options: {
    minDecimals?: number;
    maxDecimals?: number;
    showZero?: boolean;
  } = {}
): string {
  const { minDecimals = 0, maxDecimals = 2, showZero = true } = options;
  const ratioDecimal = ratio instanceof Decimal ? ratio : new Decimal(ratio.toString());

  if (ratioDecimal.isZero()) {
    return showZero ? '0%' : '< 0.01%';
  }

  const percentage = ratioDecimal.mul(100);

  if (percentage.lt(0.01) && !showZero) {
    return '< 0.01%';
  }

  // Use appropriate precision based on magnitude
  let decimals = maxDecimals;
  if (percentage.gte(10)) {
    decimals = Math.max(minDecimals, 1);
  } else if (percentage.gte(1)) {
    decimals = Math.max(minDecimals, 2);
  }

  return `${percentage.toDecimalPlaces(decimals).toString()}%`;
}

/**
 * Calculates storage capacity in GiB from rate allowance and pricing with high precision
 *
 * @param rateAllowance - Rate allowance in USDFC per epoch
 * @param pricePerTiBPerMonth - Price per TiB per month in USDFC
 * @param epochsPerMonth - Number of epochs per month
 * @returns Decimal representing capacity in GiB
 */
export function calculateStorageCapacityGB(
  rateAllowance: bigint | string | number | Decimal,
  pricePerTiBPerMonth: bigint | string | number | Decimal,
  epochsPerMonth: bigint | string | number | Decimal
): Decimal {
  const rateDecimal = rateAllowance instanceof Decimal
    ? rateAllowance
    : new Decimal(rateAllowance.toString());
  const priceDecimal = pricePerTiBPerMonth instanceof Decimal
    ? pricePerTiBPerMonth
    : new Decimal(pricePerTiBPerMonth.toString());
  const epochsDecimal = epochsPerMonth instanceof Decimal
    ? epochsPerMonth
    : new Decimal(epochsPerMonth.toString());

  if (priceDecimal.isZero()) {
    return new Decimal(0);
  }

  // High-precision calculation: capacity = (rateAllowance * epochsPerMonth * TiB) / pricePerTiBPerMonth / GiB
  const tibInBytes = tibToBytes(1);
  const monthlyBudget = rateDecimal.mul(epochsDecimal);
  const capacityBytes = monthlyBudget.mul(tibInBytes).div(priceDecimal);

  return bytesToGiB(capacityBytes.toString());
}

/**
 * Calculates monthly storage cost for given storage amount
 *
 * @param storageBytes - Storage amount in bytes
 * @param pricePerTiBPerMonth - Price per TiB per month in USDFC
 * @returns Decimal representing monthly cost in USDFC
 */
export function calculateMonthlyCost(
  storageBytes: bigint | string | number | Decimal,
  pricePerTiBPerMonth: bigint | string | number | Decimal
): Decimal {
  const bytesDecimal = storageBytes instanceof Decimal
    ? storageBytes
    : new Decimal(storageBytes.toString());
  const priceDecimal = pricePerTiBPerMonth instanceof Decimal
    ? pricePerTiBPerMonth
    : new Decimal(pricePerTiBPerMonth.toString());

  // cost = (storageBytes / TiB) * pricePerTiBPerMonth
  const tibInBytes = tibToBytes(1);
  const storageInTiB = bytesDecimal.div(tibInBytes);

  return storageInTiB.mul(priceDecimal);
}

/**
 * Calculates remaining lockup allowance with high-precision safeguards
 *
 * @param currentLockupAllowance - Total approved USDFC lockup allowance
 * @param currentLockupUsed - USDFC already locked in active commitments
 * @returns Remaining lockup allowance (0 if fully used or overused)
 *
 * @example
 * ```typescript
 * const remaining = calculateRemainingLockupAllowance(
 *   parseUnits("1000", 18), // 1000 USDFC approved
 *   parseUnits("300", 18)   // 300 USDFC already locked
 * );
 * // Returns: 700 USDFC available for new lockups
 * ```
 */
export function calculateRemainingLockupAllowance(
  currentLockupAllowance: bigint,
  currentLockupUsed: bigint
): bigint {
  // Use Decimal for precise comparison and calculation
  const allowanceDecimal = new Decimal(currentLockupAllowance.toString());
  const usedDecimal = new Decimal(currentLockupUsed.toString());

  if (allowanceDecimal.gt(usedDecimal)) {
    const remainingDecimal = allowanceDecimal.sub(usedDecimal);
    return BigInt(remainingDecimal.toFixed(0));
  }

  return 0n;
}

/**
 * Calculates daily lockup burn rate from per-epoch rate with high precision
 *
 * @param ratePerEpoch - USDFC rate per epoch
 * @param epochsPerDay - Number of epochs per day (from TIME_CONSTANTS)
 * @returns Daily USDFC lockup rate
 */
export function calculateDailyLockupRate(
  ratePerEpoch: bigint,
  epochsPerDay: bigint
): bigint {
  // Use Decimal for precise multiplication, especially important for large values
  const rateDecimal = new Decimal(ratePerEpoch.toString());
  const epochsDecimal = new Decimal(epochsPerDay.toString());

  const dailyRateDecimal = rateDecimal.mul(epochsDecimal);
  return BigInt(dailyRateDecimal.toFixed(0));
}

/**
 * Determines storage allowance sufficiency with high-precision comprehensive checks
 *
 * @param currentRateAllowance - Current rate allowance
 * @param currentRateUsed - Currently used rate
 * @param newRateNeeded - Additional rate needed for new storage
 * @param remainingLockup - Remaining lockup allowance
 * @param dailyLockupRate - Daily lockup consumption rate
 * @param minDaysThreshold - Minimum days threshold for sufficiency
 * @param dataSetCreationFee - Fee for creating new dataset
 * @param isAdditionalStorage - Whether this is additional storage to existing
 * @returns Sufficiency analysis object
 */
export function calculateStorageSufficiency(
  currentRateAllowance: bigint,
  currentRateUsed: bigint,
  newRateNeeded: bigint,
  remainingLockup: bigint,
  dailyLockupRate: bigint,
  minDaysThreshold: number,
  dataSetCreationFee: bigint,
  isAdditionalStorage: boolean = false
): {
  isRateSufficient: boolean;
  isLockupSufficient: boolean;
  isSufficient: boolean;
  totalRateNeeded: bigint;
  minimumLockupNeeded: bigint;
} {
  // Use Decimal for precise calculations
  const currentRateUsedDecimal = new Decimal(currentRateUsed.toString());
  const newRateNeededDecimal = new Decimal(newRateNeeded.toString());
  const currentRateAllowanceDecimal = new Decimal(currentRateAllowance.toString());
  const remainingLockupDecimal = new Decimal(remainingLockup.toString());
  const dailyLockupRateDecimal = new Decimal(dailyLockupRate.toString());
  const dataSetCreationFeeDecimal = new Decimal(dataSetCreationFee.toString());

  // Calculate total rate needed based on whether this is additional storage
  const totalRateNeededDecimal = isAdditionalStorage
    ? currentRateUsedDecimal.add(newRateNeededDecimal)
    : newRateNeededDecimal;

  // Check if current rate allowance can handle the total needed rate
  const isRateSufficient = currentRateAllowanceDecimal.gte(totalRateNeededDecimal);

  // Calculate minimum lockup needed for the threshold period plus creation fee
  const thresholdLockupDecimal = dailyLockupRateDecimal.mul(minDaysThreshold);
  const minimumLockupNeededDecimal = thresholdLockupDecimal.add(dataSetCreationFeeDecimal);

  // Check if remaining lockup is sufficient for minimum threshold
  const isLockupSufficient = remainingLockupDecimal.gte(minimumLockupNeededDecimal);

  // Both conditions must be met for overall sufficiency
  const isSufficient = isRateSufficient && isLockupSufficient;

  return {
    isRateSufficient,
    isLockupSufficient,
    isSufficient,
    totalRateNeeded: BigInt(totalRateNeededDecimal.toFixed(0)),
    minimumLockupNeeded: BigInt(minimumLockupNeededDecimal.toFixed(0)),
  };
}

/**
 * Calculates total financial requirements for storage operation with high precision
 *
 * @param currentLockupUsed - Currently used lockup amount
 * @param currentLockupAllowance - Current lockup allowance
 * @param currentRateUsed - Currently used rate
 * @param currentRateAllowance - Current rate allowance
 * @param newRateNeeded - Rate needed for new storage
 * @param dailyLockupRate - Daily lockup consumption rate
 * @param persistencePeriodDays - Storage persistence period in days
 * @param dataSetCreationFee - Dataset creation fee
 * @param currentBalance - Current USDFC balance
 * @param depositAmountNeeded - Required deposit amount from service
 * @returns Total amounts needed for operation
 */
export function calculateTotalStorageRequirements(
  currentLockupUsed: bigint,
  currentLockupAllowance: bigint,
  currentRateUsed: bigint,
  currentRateAllowance: bigint,
  newRateNeeded: bigint,
  dailyLockupRate: bigint,
  persistencePeriodDays: number,
  dataSetCreationFee: bigint,
  currentBalance: bigint,
  depositAmountNeeded: bigint
): {
  totalDepositNeeded: bigint;
  totalLockupNeeded: bigint;
  totalRateNeeded: bigint;
} {
  // Convert to Decimal for precise calculations
  const currentLockupUsedDecimal = new Decimal(currentLockupUsed.toString());
  const currentLockupAllowanceDecimal = new Decimal(currentLockupAllowance.toString());
  const currentRateUsedDecimal = new Decimal(currentRateUsed.toString());
  const currentRateAllowanceDecimal = new Decimal(currentRateAllowance.toString());
  const newRateNeededDecimal = new Decimal(newRateNeeded.toString());
  const dailyLockupRateDecimal = new Decimal(dailyLockupRate.toString());
  const dataSetCreationFeeDecimal = new Decimal(dataSetCreationFee.toString());
  const currentBalanceDecimal = new Decimal(currentBalance.toString());
  const depositAmountNeededDecimal = new Decimal(depositAmountNeeded.toString());

  // Calculate total deposit needed including creation fee
  const totalDepositRequiredDecimal = depositAmountNeededDecimal.add(dataSetCreationFeeDecimal);
  const totalDepositNeededDecimal = currentBalanceDecimal.gte(totalDepositRequiredDecimal)
    ? new Decimal(0)
    : totalDepositRequiredDecimal.sub(currentBalanceDecimal);

  // Calculate projected lockup needed for the full persistence period
  const persistenceCostDecimal = dailyLockupRateDecimal.mul(persistencePeriodDays);
  const projectedLockupNeededDecimal = currentLockupUsedDecimal
    .add(persistenceCostDecimal)
    .add(dataSetCreationFeeDecimal);

  // Use the greater of projected need or current allowance
  const totalLockupNeededDecimal = projectedLockupNeededDecimal.gt(currentLockupAllowanceDecimal)
    ? projectedLockupNeededDecimal
    : currentLockupAllowanceDecimal;

  // Calculate total rate needed as maximum of new requirement and current allowance
  const newTotalRateDecimal = newRateNeededDecimal.add(currentRateUsedDecimal);
  const totalRateNeededDecimal = newTotalRateDecimal.gt(currentRateAllowanceDecimal)
    ? newTotalRateDecimal
    : currentRateAllowanceDecimal;

  return {
    totalDepositNeeded: BigInt(totalDepositNeededDecimal.toFixed(0)),
    totalLockupNeeded: BigInt(totalLockupNeededDecimal.toFixed(0)),
    totalRateNeeded: BigInt(totalRateNeededDecimal.toFixed(0)),
  };
}