import * as Pay from "@filoz/synapse-core/pay";
import { getServicePrice } from "@filoz/synapse-core/warm-storage";
import { UseServicePriceResult } from "@filoz/synapse-react";
import { SIZE_CONSTANTS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { maxUint256, type Chain, type Client, type Hex, type Transport } from "viem";
import type { DataSet } from "@/lib/datasets";
import {
  AppDecimal,
  bigIntToDecimal,
  bytesToGiB,
  calculateMinimumCapacityThreshold,
  computeMonthlyStorageCost,
  safeDivide,
  toDecimal,
} from "@/lib/decimal";
import { DECIMAL_PLACES, formatBalance, parseDaysLeft } from "@/lib/format";
import type { BalancesData } from "@/hooks/use-balances";

// 1 USDFC (in wei) — protocol fee for creating a CDN-enabled dataset
const CDN_DATA_SET_CREATION_COST = toDecimal(10n ** 18n);

const zeroDecimal = toDecimal(0);
/**
 * Calculate storage metrics using Decimal for precision
 */
export const fetchStorageMetrics = async (
  client: Client<Transport, Chain>,
  address: Hex,
  config: {
    storageCapacity: number;
    persistencePeriod: number;
    minDaysThreshold: number;
  },
  fileSize?: number,
  newDatasets?: {
    count: number;
    withCDN: boolean;
  },
) => {
  const bytesToStore = fileSize
    ? fileSize
    : Number(BigInt(config.storageCapacity) * SIZE_CONSTANTS.GiB);

  const count = newDatasets?.count ?? 0;
  const withCDN = newDatasets?.withCDN ?? false;

  const [allowance, accountInfo, prices] = await Promise.all([
    Pay.operatorApprovals(client, { address }),
    Pay.accounts(client, { address }),
    getServicePrice(client),
  ]);
  const minFees = toDecimal(prices.minimumPricePerMonth);

  const currentMonthlyRate = toDecimal(allowance.rateUsage * TIME_CONSTANTS.EPOCHS_PER_MONTH);
  const currentDailyRate = toDecimal(allowance.rateUsage * TIME_CONSTANTS.EPOCHS_PER_DAY);

  const availableFunds = toDecimal(accountInfo.availableFunds);

  const perMonth = toDecimal(prices.pricePerTiBPerMonthNoCDN)
    .mul(bytesToStore)
    .div(SIZE_CONSTANTS.TiB);

  const perDay = perMonth.div(TIME_CONSTANTS.DAYS_PER_MONTH);

  const daysLeftDecimal = safeDivide(availableFunds, perDay);

  const daysLeftAtCurrentRateDecimal = currentDailyRate.isZero()
    ? Infinity
    : safeDivide(availableFunds, currentDailyRate);

  const totalUpfrontNeeded = (count ? minFees.mul(count) : zeroDecimal).add(
    withCDN ? CDN_DATA_SET_CREATION_COST.mul(count) : zeroDecimal,
  );

  const amountNeeded = perDay.mul(config.persistencePeriod).add(totalUpfrontNeeded);

  const isBalanceSufficient = availableFunds.gte(amountNeeded);

  const totalDepositNeeded = daysLeftDecimal.gte(config.minDaysThreshold)
    ? isBalanceSufficient
      ? zeroDecimal
      : totalUpfrontNeeded.sub(availableFunds)
    : amountNeeded.sub(availableFunds);

  const availableToFreeUp = availableFunds.sub(amountNeeded);

  // Synapse uses maxUint256 for "unlimited". Checking >= half catches both exact and near-max approvals.
  const isRateSufficient = allowance.rateAllowance >= maxUint256 / 2n;
  const isLockupSufficient = allowance.lockupAllowance >= maxUint256 / 2n;

  const isSufficient = isRateSufficient && isLockupSufficient && totalDepositNeeded.isZero();

  return {
    depositNeeded: BigInt(totalDepositNeeded.round().toString()),
    availableToFreeUp: BigInt(availableToFreeUp.round().toString()),
    daysLeft: daysLeftDecimal.toString(),
    daysLeftAtCurrentRate: daysLeftAtCurrentRateDecimal.toString(),
    isRateSufficient,
    isLockupSufficient,
    isSufficient: isSufficient,
    totalConfiguredCapacity: config.storageCapacity,
    currentMonthlyRate: BigInt(currentMonthlyRate.toString()),
    maxMonthlyRate: BigInt(perMonth.round().toString()),
  };
};

/**
 * Pure function: compute dashboard display metrics from raw balances + datasets.
 */
export function computeDashboardMetrics(
  balances: BalancesData,
  datasets: DataSet[],
  pricing?: UseServicePriceResult,
) {
  const totalStoredGiB = datasets.reduce(
    (acc, d) => acc + bytesToGiB(d.totalSize.sizeBytes).toNumber(),
    0,
  );
  const totalPieceCount = datasets.reduce((acc, d) => acc + d.pieces.length, 0);
  const totalDatasetCount = datasets.length;

  const storageUsagePercent =
    balances.totalConfiguredCapacity > 0
      ? Math.min((totalStoredGiB / balances.totalConfiguredCapacity) * 100, 100)
      : 0;

  const monthlyRate = bigIntToDecimal(balances.currentMonthlyRate, 18).toNumber();
  const maxMonthlyRate = bigIntToDecimal(balances.maxMonthlyRate, 18).toNumber();
  const monthlyRateStr = formatBalance(balances.currentMonthlyRate, 18, DECIMAL_PLACES.RATE);
  const maxMonthlyRateStr = formatBalance(balances.maxMonthlyRate, 18, DECIMAL_PLACES.RATE);
  const storageBalance = bigIntToDecimal(balances.warmStorageBalance, 18).toNumber();
  const daysLeftAtCurrentRate = parseDaysLeft(balances.daysLeftAtCurrentRate);
  const daysLeft = parseDaysLeft(balances.daysLeft);

  const burnRatePercent = maxMonthlyRate > 0 ? (monthlyRate / maxMonthlyRate) * 100 : 0;
  const isRateExceeded = monthlyRate > maxMonthlyRate && maxMonthlyRate > 0;

  const pricePerTiB = pricing
    ? bigIntToDecimal(pricing.pricePerTiBPerMonthNoCDN, 18).toNumber()
    : 0;
  const matchingCapacityGiB = computeRequiredCapacity(monthlyRate, pricePerTiB);
  const minFeeCapacityGiB = pricing
    ? calculateMinimumCapacityThreshold(
        bigIntToDecimal(pricing.pricePerTiBPerMonthNoCDN, 18).toNumber(),
        bigIntToDecimal(pricing.minimumPricePerMonth, 18).toNumber(),
      ).toNumber()
    : 0;

  return {
    totalStoredGiB,
    totalPieceCount,
    totalDatasetCount,
    storageUsagePercent,
    monthlyRate,
    maxMonthlyRate,
    monthlyRateStr,
    maxMonthlyRateStr,
    storageBalance,
    daysLeftAtCurrentRate,
    daysLeft,
    burnRatePercent,
    isRateExceeded,
    matchingCapacityGiB,
    minFeeCapacityGiB,
  };
}

/**
 * Compute required capacity in GB to match current monthly rate.
 */
export function computeRequiredCapacity(monthlyRate: number, pricePerTiB: number): number {
  return pricePerTiB > 0 ? Math.ceil((monthlyRate / pricePerTiB) * 1024) : 0;
}

/**
 * Pure function: compute cost preview for a prospective storage configuration.
 */
export function computeConfigCostPreview(
  capacityGiB: number,
  periodDays: number,
  warningThresholdDays: number,
  storageBalance: number,
  pricing: UseServicePriceResult,
) {
  const { perMonth, isMinimumApplied } = computeMonthlyStorageCost(capacityGiB, pricing);
  const perDay = perMonth.div(30);
  const totalCost = perMonth.times(new AppDecimal(periodDays).div(30));

  const perDayNum = perDay.toNumber();
  const coverageDays =
    storageBalance > 0 && perDayNum > 0 ? Math.floor(storageBalance / perDayNum) : 0;
  const depositNeeded = Math.max(0, perDay.times(warningThresholdDays).toNumber() - storageBalance);

  return {
    monthlyRateStr: perMonth.toFixed(DECIMAL_PLACES.RATE),
    periodCostStr: totalCost.toFixed(4),
    isMinimumApplied,
    depositNeeded,
    coverageDays,
    isAboveThreshold: coverageDays >= warningThresholdDays,
  };
}
