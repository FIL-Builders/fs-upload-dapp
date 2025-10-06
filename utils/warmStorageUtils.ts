import { WarmStorageBalance, StorageCosts, DatasetsSizeInfo } from "@/types";
import { DATA_SET_CREATION_FEE, LEAF_SIZE } from "@/utils/constants";
import {
  Synapse,
  TIME_CONSTANTS,
  WarmStorageService,
  PDPVerifier,
  EnhancedDataSetInfo,
  SIZE_CONSTANTS,
} from "@filoz/synapse-sdk";
import { bytesToKiB, bytesToMiB, bytesToGiB } from "./storageCalculations";

/**
 * Fetches the current storage costs from the WarmStorage service.
 * @param synapse - The Synapse instance
 * @returns The storage costs object
 */
export const fetchWarmStorageCosts = async (
  synapse: Synapse
): Promise<StorageCosts> => {
  const warmStorageService = await WarmStorageService.create(
    synapse.getProvider(),
    synapse.getWarmStorageAddress()
  );
  return warmStorageService.getServicePrice();
};

/**
 * Fetches the current WarmStorage balance data for a given storage capacity (in bytes) and period (in days).
 * @param synapse - The Synapse instance
 * @param storageCapacityBytes - Storage capacity in bytes
 * @param persistencePeriodDays - Desired persistence period in days
 * @param withCDN - Whether to use CDN for storage
 * @returns The WarmStorage balance data object
 */
export const fetchWarmStorageBalanceData = async (
  synapse: Synapse,
  storageCapacityBytes: number,
  persistencePeriodDays: number,
  withCDN: boolean
): Promise<WarmStorageBalance> => {
  const warmStorageService = await WarmStorageService.create(
    synapse.getProvider(),
    synapse.getWarmStorageAddress()
  );
  return warmStorageService.checkAllowanceForStorage(
    storageCapacityBytes,
    withCDN,
    synapse.payments,
    persistencePeriodDays
  );
};

/**
 * Checks if the current allowances and balances are sufficient for storage and dataset creation.
 *
 * @param warmStorageBalance - The WarmStorage balance data
 * @param minDaysThreshold - Minimum days threshold for lockup sufficiency
 * @param includeDataSetCreationFee - Whether to include the dataset creation fee in calculations
 * @returns Object with sufficiency flags and allowance details
 */
export const checkAllowances = async (
  warmStorageBalance: WarmStorageBalance,
  minDaysThreshold: number,
  includeDataSetCreationFee: boolean
) => {
  // Calculate the rate needed per epoch
  const rateNeeded = warmStorageBalance.costs.perEpoch;

  // Calculate daily lockup requirements
  const lockupPerDay = TIME_CONSTANTS.EPOCHS_PER_DAY * rateNeeded;

  // Calculate remaining lockup and persistence days
  const currentLockupRemaining =
    warmStorageBalance.currentLockupAllowance >
    warmStorageBalance.currentLockupUsed
      ? warmStorageBalance.currentLockupAllowance -
        warmStorageBalance.currentLockupUsed
      : 0n;
  warmStorageBalance.currentLockupUsed;

  // Calculate total allowance needed including dataset creation fee if required
  const dataSetCreationFee = includeDataSetCreationFee
    ? DATA_SET_CREATION_FEE
    : BigInt(0);

  // Use available properties for lockup and deposit
  const totalLockupNeeded = warmStorageBalance.lockupAllowanceNeeded;
  const depositNeeded = warmStorageBalance.depositAmountNeeded;

  // Use the greater of current or needed rate allowance
  const rateAllowanceNeeded =
    warmStorageBalance.currentRateAllowance >
    warmStorageBalance.rateAllowanceNeeded
      ? warmStorageBalance.currentRateAllowance
      : warmStorageBalance.rateAllowanceNeeded;

  // Add dataset creation fee to lockup and deposit if needed
  const lockupAllowanceNeeded = totalLockupNeeded + dataSetCreationFee;
  const depositAmountNeeded = depositNeeded + dataSetCreationFee;

  // Check if lockup balance is sufficient for dataset creation
  const isLockupBalanceSufficientForDataSetCreation =
    currentLockupRemaining >= lockupAllowanceNeeded;

  // Calculate how many days of persistence are left
  const persistenceDaysLeft =
    Number(currentLockupRemaining) / Number(lockupPerDay);

  // Determine sufficiency of allowances
  const isRateSufficient =
    warmStorageBalance.currentRateAllowance >= rateAllowanceNeeded;
  // Lockup is sufficient if enough days remain and enough for dataset creation
  const isLockupSufficient =
    persistenceDaysLeft >= Number(minDaysThreshold) &&
    isLockupBalanceSufficientForDataSetCreation;
  // Both must be sufficient
  const isSufficient = isRateSufficient && isLockupSufficient;

  // Return detailed sufficiency and allowance info
  return {
    isSufficient, // true if both rate and lockup are sufficient
    isLockupSufficient, // true if lockup is sufficient
    isRateSufficient, // true if rate is sufficient
    rateAllowanceNeeded, // rate allowance required
    lockupAllowanceNeeded, // lockup allowance required
    depositAmountNeeded, // deposit required
    currentLockupRemaining, // current lockup remaining
    lockupPerDay, // lockup needed per day
    persistenceDaysLeft, // days of persistence left
  };
};

export const getDatasetsSizeInfo = async (
  datasets: EnhancedDataSetInfo[],
  synapse: Synapse
) => {
  try {
    const pdpVerifier = new PDPVerifier(
      synapse.getProvider(),
      synapse.getPDPVerifierAddress()
    );
    if (!datasets || datasets.length === 0) {
      return {} as Record<number, DatasetsSizeInfo>;
    }

    const entries = await Promise.all(
      datasets.map(async (dataset) => {
        const [leafCountRaw, pieceCountRaw] = await Promise.all([
          pdpVerifier.getDataSetLeafCount(dataset.pdpVerifierDataSetId),
          pdpVerifier.getNextPieceId(dataset.pdpVerifierDataSetId),
        ]);

        const leafCount = Number(leafCountRaw);
        const pieceCount = Number(pieceCountRaw);
        const withCDN = dataset.withCDN;

        const sizeInBytes = BigInt(leafCountRaw) * LEAF_SIZE;
        const sizeInKiB = bytesToKiB(sizeInBytes).toNumber();
        const sizeInMiB = bytesToMiB(sizeInBytes).toNumber();
        const sizeInGB = bytesToGiB(sizeInBytes).toNumber();

        const info = {
          leafCount,
          pieceCount,
          withCDN,
          sizeInBytes: Number(sizeInBytes),
          sizeInKiB,
          sizeInMiB,
          sizeInGB,
        };

        const message = getDatasetSizeMessage(info);

        const dataSetSizeInfo: DatasetsSizeInfo = {
          ...info,
          message,
        };

        return [dataset.pdpVerifierDataSetId, dataSetSizeInfo] as const;
      })
    );

    return Object.fromEntries(entries) as Record<number, DatasetsSizeInfo>;
  } catch (error) {
    console.warn("Failed to get datasets size info:", error);
    return {} as Record<number, DatasetsSizeInfo>;
  }
};

export const getDatasetSizeMessage = (datasetSizeInfo: {
  leafCount: number;
  pieceCount: number;
  withCDN: boolean;
  sizeInBytes: number;
  sizeInKiB: number;
  sizeInMiB: number;
  sizeInGB: number;
}) => {
  if (datasetSizeInfo.sizeInGB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInGB.toFixed(4)} GB`;
  }
  if (datasetSizeInfo.sizeInMiB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInMiB.toFixed(4)} MB`;
  }
  if (datasetSizeInfo.sizeInKiB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInKiB.toFixed(4)} KB`;
  }
  return `Dataset size: ${datasetSizeInfo.sizeInBytes} Bytes`;
};

/**
 * Returns the price per TiB per month, depending on CDN usage.
 * @param storageCosts - The storage cost object from WarmStorage service
 * @param withCDN - Whether to use CDN for storage
 * @returns The price per TiB per month as a bigint
 */
export const getPricePerTBPerMonth = (storageCosts: StorageCosts, withCDN: boolean): bigint => {
  return withCDN
    ? storageCosts.pricePerTiBPerMonthWithCDN
    : storageCosts.pricePerTiBPerMonthNoCDN;
};

/**
 * Calculates the storage capacity in GB that can be supported by a given rate allowance.
 * @param rateAllowance - The current rate allowance (bigint)
 * @param storageCosts - The storage cost object from WarmStorage service
 * @param withCDN - Whether to use CDN for storage
 * @returns The number of GB that can be supported by the rate allowance
 */
export const calculateRateAllowanceGB = (
  rateAllowance: bigint,
  storageCosts: StorageCosts,
  withCDN: boolean
): number => {
  // Calculate the total monthly rate allowance
  const monthlyRate = rateAllowance * BigInt(TIME_CONSTANTS.EPOCHS_PER_MONTH);
  // Calculate how many bytes can be stored for that rate
  const bytesThatCanBeStored =
    (monthlyRate * SIZE_CONSTANTS.TiB) / getPricePerTBPerMonth(storageCosts, withCDN);
  // Convert bytes to GB
  return Number(bytesThatCanBeStored) / Number(SIZE_CONSTANTS.GiB);
};
