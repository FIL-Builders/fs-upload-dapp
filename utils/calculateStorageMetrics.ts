import { ConfigType } from "@/types";
import { ServicePriceResult } from "@filoz/synapse-core/warm-storage";
import { OperatorApprovalsResult } from "@filoz/synapse-core/pay";
import { SIZE_CONSTANTS, TIME_CONSTANTS } from "@filoz/synapse-core/utils";
import { maxUint256 } from "viem";

interface CalculateStorageMetricsParams {
  prices: ServicePriceResult;
  operatorApprovals: OperatorApprovalsResult;
  availableFunds: bigint;
  config: ConfigType;
  fileSize?: number;
}

const calculateStorageCost = (prices: ServicePriceResult, fileSize: number) => {
  const { pricePerTiBPerMonthNoCDN, epochsPerMonth } = prices
  // Calculate price per byte per epoch
  const sizeInBytesBigint = BigInt(fileSize)
  const perEpoch =
    (pricePerTiBPerMonthNoCDN * sizeInBytesBigint) /
    (SIZE_CONSTANTS.TiB * epochsPerMonth)

  const perDay = perEpoch * TIME_CONSTANTS.EPOCHS_PER_DAY
  const perMonth = perEpoch * epochsPerMonth
  return {
    perEpoch,
    perDay,
    perMonth,
  }
}

export const calculateStorageMetrics = async (
  {
    prices,
    operatorApprovals,
    availableFunds,
    config,
    fileSize,
  }: CalculateStorageMetricsParams
) => {

  const bytesToStore = fileSize
    ? fileSize
    : Number((BigInt(config.storageCapacity)
      * SIZE_CONSTANTS.GiB))

  const storageCosts = calculateStorageCost(prices, bytesToStore)

  const currentMonthlyRate = operatorApprovals.rateUsed * TIME_CONSTANTS.EPOCHS_PER_MONTH;

  const currentDailyRate = operatorApprovals.rateUsed * TIME_CONSTANTS.EPOCHS_PER_DAY;

  const maxMonthlyRate = storageCosts.perMonth

  const daysLeftAtCurrentRate = currentDailyRate === 0n ? Infinity : Number(availableFunds) / Number(currentDailyRate);

  const daysLeft = Number(availableFunds) / Number(storageCosts.perDay);

  const amountNeeded = storageCosts.perDay * BigInt(config.persistencePeriod);

  const totalDepositNeeded =
    daysLeft >= config.minDaysThreshold
      ? 0n
      : amountNeeded - availableFunds;

  const availableToFreeUp =
    daysLeft >= config.persistencePeriod
      && availableFunds > amountNeeded
      ? availableFunds - amountNeeded
      : 0n;

  const isRateSufficient = operatorApprovals.rateAllowance >= maxUint256

  const isLockupSufficient = operatorApprovals.lockupAllowance >= maxUint256;

  const isSufficient = isRateSufficient && isLockupSufficient && daysLeft >= config.minDaysThreshold;

  return {
    depositNeeded: totalDepositNeeded,
    availableToFreeUp: availableToFreeUp,
    daysLeft,
    daysLeftAtCurrentRate,
    isRateSufficient,
    isLockupSufficient,
    isSufficient: isSufficient,
    totalConfiguredCapacity: config.storageCapacity,
    currentMonthlyRate,
    maxMonthlyRate,
  };
};
