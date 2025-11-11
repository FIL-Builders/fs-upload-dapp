import {
  Synapse,
  TIME_CONSTANTS,
  SIZE_CONSTANTS,
  TOKENS,
  WarmStorageService,
} from "@filoz/synapse-sdk";

import { MAX_UINT256 } from "@/utils/constants";
export const calculateStorageMetrics = async (
  synapse: Synapse,
  config: {
    storageCapacity: number;
    persistencePeriod: number;
    minDaysThreshold: number;
  },
  fileSize?: number
) => {

  const bytesToStore = fileSize
    ? fileSize
    : Number((BigInt(config.storageCapacity)
      * SIZE_CONSTANTS.GiB))

  const warmStorageService = await WarmStorageService.create(synapse.getProvider(), synapse.getWarmStorageAddress());

  // Fetch approval info, storage costs, and balance in parallel
  const [allowance, accountInfo, prices] = await Promise.all([
    synapse.payments.serviceApproval(synapse.getWarmStorageAddress()),
    synapse.payments.accountInfo(TOKENS.USDFC),
    warmStorageService.calculateStorageCost(bytesToStore)
  ]);

  const availableFunds = accountInfo.availableFunds;

  const currentMonthlyRate = allowance.rateUsed * TIME_CONSTANTS.EPOCHS_PER_MONTH;

  const currentDailyRate = allowance.rateUsed * TIME_CONSTANTS.EPOCHS_PER_DAY;

  const maxMonthlyRate = prices.perMonth

  const daysLeft = Number(availableFunds) / Number(prices.perDay);

  const daysLeftAtCurrentRate = currentDailyRate === 0n ? Infinity : Number(availableFunds) / Number(currentDailyRate);

  const amountNeeded = prices.perDay * BigInt(config.persistencePeriod);

  const totalDepositNeeded =
    daysLeft >= config.minDaysThreshold
      ? 0n
      : amountNeeded - accountInfo.availableFunds;

  const availableToFreeUp =
    accountInfo.availableFunds > amountNeeded
      ? accountInfo.availableFunds - amountNeeded
      : 0n;

  const isRateSufficient = allowance.rateAllowance >= MAX_UINT256 / 2n

  const isLockupSufficient = allowance.lockupAllowance >= MAX_UINT256 / 2n;

  const isSufficient = isRateSufficient && isLockupSufficient && daysLeft >= config.minDaysThreshold;

  return {
    rateNeeded: MAX_UINT256,
    depositNeeded: totalDepositNeeded,
    availableToFreeUp: availableToFreeUp,
    lockupNeeded: MAX_UINT256,
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
