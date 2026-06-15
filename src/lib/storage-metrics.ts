import * as Pay from "@filoz/synapse-core/pay";
import { epochsToDays } from "@filoz/synapse-core/utils";
import { calculateEffectiveRate, getPriceList } from "@filoz/synapse-core/warm-storage";
import { UsePriceListResult } from "@filoz/synapse-react";
import { SIZE_CONSTANTS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import type { Chain, Client, Hex, Transport } from "viem";
import type { DataSet } from "@/lib/datasets";
import { AppDecimal, bigIntToDecimal, bytesToGiB } from "@/lib/decimal";
import { DECIMAL_PLACES, formatBalance, parseDaysLeft } from "@/lib/format";
import type { BalancesData } from "@/hooks/use-balances";

/**
 * Account storage metrics, sourced from the SDK rather than local formulas:
 *
 * - Balances, current burn rate, and runway come from `Pay.getAccountSummary`
 *   (lockup-rate and debt aware, matching the Payments contract).
 * - Rate projections use `calculateEffectiveRate` (the contract's pricing).
 * - Operator approval uses `isFwssMaxApproved` (the SDK's canonical check).
 *
 * Upload-time deposit gating does not live here — the upload hooks call
 * `synapse.storage.calculateMultiContextCosts` on the resolved contexts for
 * the exact on-chain figure. The only app-specific concepts in this file are
 * the configured persistence period and the low-balance warning threshold.
 */
export const fetchStorageMetrics = async (
  client: Client<Transport, Chain>,
  address: Hex,
  config: {
    storageCapacity: number;
    persistencePeriod: number;
    minDaysThreshold: number;
  },
) => {
  const [summary, priceList] = await Promise.all([
    Pay.getAccountSummary(client, { address }),
    getPriceList(client),
  ]);

  // Reuse the fetched price list's lockup period so the approval check
  // doesn't read getPriceList again.
  const isFwssApproved = await Pay.isFwssMaxApproved(client, {
    clientAddress: address,
    requiredMaxLockupPeriod: priceList.lockups.defaultLockupPeriod,
  });

  // Projected recurring rate at the configured capacity. Includes one flat
  // dataset fee — storing anything requires at least one dataset.
  const { ratePerEpoch, ratePerMonth } = calculateEffectiveRate({
    sizeInBytes: BigInt(config.storageCapacity) * SIZE_CONSTANTS.GiB,
    storagePerTibPerMonth: priceList.rates.storagePerTibPerMonth,
    datasetFeePerMonth: priceList.rates.datasetFeePerMonth,
    epochsPerMonth: TIME_CONSTANTS.EPOCHS_PER_MONTH,
  });

  const availableFunds = summary.availableFunds;

  // Runway at the configured max rate (what-if projection).
  const daysLeftBig = ratePerEpoch > 0n ? epochsToDays(availableFunds / ratePerEpoch) : null;
  const daysLeft = daysLeftBig === null ? "Infinity" : daysLeftBig.toString();

  // Runway at the actual on-chain rate — SDK-resolved, debt-aware.
  const daysLeftAtCurrentRate =
    summary.lockupRatePerEpoch > 0n ? epochsToDays(summary.runwayInEpochs).toString() : "Infinity";

  // Funds required to cover the configured persistence period at max rate.
  const persistenceEpochs = BigInt(config.persistencePeriod) * TIME_CONSTANTS.EPOCHS_PER_DAY;
  const amountNeeded = ratePerEpoch * persistenceEpochs;

  const belowThreshold = daysLeftBig !== null && daysLeftBig < BigInt(config.minDaysThreshold);
  const shortfall = amountNeeded - availableFunds;
  const depositNeeded = belowThreshold && shortfall > 0n ? shortfall : 0n;

  const availableToFreeUp = availableFunds - amountNeeded;

  return {
    depositNeeded,
    availableToFreeUp,
    daysLeft,
    daysLeftAtCurrentRate,
    isFwssApproved,
    totalConfiguredCapacity: config.storageCapacity,
    /** Actual account-wide burn rate from the Payments contract. */
    currentMonthlyRate: summary.lockupRatePerMonth,
    /** Projected rate at the configured capacity. */
    maxMonthlyRate: ratePerMonth,
  };
};

/**
 * Pure function: compute dashboard display metrics from raw balances + datasets.
 */
export function computeDashboardMetrics(
  balances: BalancesData,
  datasets: DataSet[],
  pricing?: UsePriceListResult,
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
    ? bigIntToDecimal(pricing.rates.storagePerTibPerMonth, 18).toNumber()
    : 0;
  const matchingCapacityGiB = computeRequiredCapacity(monthlyRate, pricePerTiB);
  const datasetFeePerMonth = pricing
    ? bigIntToDecimal(pricing.rates.datasetFeePerMonth, 18).toNumber()
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
    datasetFeePerMonth,
  };
}

/**
 * Compute required capacity in GB to match current monthly rate.
 */
function computeRequiredCapacity(monthlyRate: number, pricePerTiB: number): number {
  return pricePerTiB > 0 ? Math.ceil((monthlyRate / pricePerTiB) * 1024) : 0;
}

/**
 * Pure function: compute cost preview for a prospective storage configuration.
 * Rates come from the SDK's `calculateEffectiveRate`.
 */
export function computeConfigCostPreview(
  capacityGiB: number,
  periodDays: number,
  warningThresholdDays: number,
  storageBalance: number,
  pricing: UsePriceListResult,
) {
  const { ratePerMonth } = calculateEffectiveRate({
    sizeInBytes: BigInt(capacityGiB) * SIZE_CONSTANTS.GiB,
    storagePerTibPerMonth: pricing.rates.storagePerTibPerMonth,
    datasetFeePerMonth: pricing.rates.datasetFeePerMonth,
    epochsPerMonth: TIME_CONSTANTS.EPOCHS_PER_MONTH,
  });

  const perMonth = bigIntToDecimal(ratePerMonth, 18);
  const datasetFee = bigIntToDecimal(pricing.rates.datasetFeePerMonth, 18);
  const perDay = perMonth.div(30);
  const totalCost = perMonth.times(new AppDecimal(periodDays).div(30));

  const perDayNum = perDay.toNumber();
  const coverageDays =
    storageBalance > 0 && perDayNum > 0 ? Math.floor(storageBalance / perDayNum) : 0;
  const depositNeeded = Math.max(0, perDay.times(warningThresholdDays).toNumber() - storageBalance);

  return {
    monthlyRateStr: perMonth.toFixed(DECIMAL_PLACES.RATE),
    periodCostStr: totalCost.toFixed(4),
    datasetFeeStr: datasetFee.toFixed(DECIMAL_PLACES.RATE),
    depositNeeded,
    coverageDays,
    isAboveThreshold: coverageDays >= warningThresholdDays,
  };
}
