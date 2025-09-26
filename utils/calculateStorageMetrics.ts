import {
  Synapse,
  TIME_CONSTANTS,
  SIZE_CONSTANTS,
  PDPVerifier,
  EnhancedDataSetInfo,
  TOKENS,
} from "@filoz/synapse-sdk";
import { config } from "@/config";
import { StorageCalculationResult, DatasetsSizeInfo } from "@/types";
import { calculateRateAllowanceGB } from "@/utils/storageCostUtils";
import {
  fetchWarmStorageCosts,
  fetchWarmStorageBalanceData,
} from "@/utils/warmStorageUtils";
import { DecimalUnitConverter } from "./decimalUtils";
import { LEAF_SIZE } from "@/utils/constants";

/**
 * Calculates storage metrics for WarmStorage service based on balance data and user config.
 * Fetches costs and balances, then computes all relevant metrics for storage and allowance sufficiency.
 *
 * @param synapse - The Synapse instance
 * @param persistencePeriodDays - The desired persistence period in days
 * @param storageCapacityBytes - The storage capacity in bytes
 * @param minDaysThreshold - Minimum days threshold for lockup sufficiency
 * @returns StorageCalculationResult containing all calculated metrics
 */
export const calculateStorageMetrics = async (
  synapse: Synapse,
  persistencePeriodDays: number = config.persistencePeriod,
  storageCapacityBytes: number = config.storageCapacity *
    Number(SIZE_CONSTANTS.GiB),
  minDaysThreshold: number = config.minDaysThreshold
): Promise<StorageCalculationResult> => {
  // Fetch storage costs and balance data from WarmStorage service
  const storageCosts = await fetchWarmStorageCosts(synapse);
  const warmStorageBalance = await fetchWarmStorageBalanceData(
    synapse,
    storageCapacityBytes,
    persistencePeriodDays
  );

  // Calculate the rate needed per epoch for the requested storage
  const rateNeeded = warmStorageBalance.costs.perEpoch;

  // Calculate daily lockup requirements at requested and current rates
  const lockupPerDay = TIME_CONSTANTS.EPOCHS_PER_DAY * rateNeeded;
  const lockupPerDayAtCurrentRate =
    TIME_CONSTANTS.EPOCHS_PER_DAY * warmStorageBalance.currentRateUsed;

  const datasets = await synapse.storage.findDataSets();

  const datasetsSizeInfo = await getDatasetsSizeInfo(datasets, synapse);

  const currentStorageBytes = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInBytes,
    0
  );
  const currentStorageGB = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInGB,
    0
  );

  // Calculate remaining lockup and persistence days
  const currentLockupRemaining =
    warmStorageBalance.currentLockupAllowance >
    warmStorageBalance.currentLockupUsed
      ? warmStorageBalance.currentLockupAllowance -
        warmStorageBalance.currentLockupUsed
      : 0n;
  // How many days of storage remain at requested rate
  const persistenceDaysLeft =
    Number(currentLockupRemaining) / Number(lockupPerDay);
  // How many days of storage remain at current rate usage
  const persistenceDaysLeftAtCurrentRate =
    lockupPerDayAtCurrentRate > 0n
      ? Number(currentLockupRemaining) / Number(lockupPerDayAtCurrentRate)
      : currentLockupRemaining > 0n
      ? Infinity
      : 0;

  // Determine sufficiency of allowances
  const isRateSufficient =
    warmStorageBalance.currentRateAllowance >= rateNeeded;
  // Lockup is sufficient if enough days remain
  const isLockupSufficient = persistenceDaysLeft >= minDaysThreshold;
  // Both must be sufficient
  const isSufficient = isRateSufficient && isLockupSufficient;

  // Calculate how much storage (in GB) the current rate allowance supports
  const currentRateAllowanceGB = calculateRateAllowanceGB(
    warmStorageBalance.currentRateAllowance,
    storageCosts
  );

  const cdnUsedGiB = Object.values(datasetsSizeInfo)
    .filter((dataset) => dataset.withCDN)
    .reduce((acc, dataset) => acc + dataset.sizeInGB, 0);
  const nonCdnUsedGiB = Object.values(datasetsSizeInfo)
    .filter((dataset) => !dataset.withCDN)
    .reduce((acc, dataset) => acc + dataset.sizeInGB, 0);

  const storageBalance = await synapse.payments.balance(TOKENS.USDFC);

  const depositNeeded =
    storageBalance > warmStorageBalance.depositAmountNeeded
      ? 0n
      : warmStorageBalance.depositAmountNeeded;
  const rateUsed = warmStorageBalance.currentRateUsed;
  const totalLockupNeeded =
    warmStorageBalance.currentLockupUsed +
    BigInt(persistencePeriodDays) * BigInt(lockupPerDay);
  const currentLockupAllowance = warmStorageBalance.currentLockupAllowance;
  return {
    rateNeeded, // rate needed per epoch for requested storage
    rateUsed: rateUsed, // rate currently used
    currentStorageBytes: BigInt(currentStorageBytes), // current storage used in bytes
    currentStorageGB, // current storage used in GB
    cdnUsedGiB, // current storage used in GB
    nonCdnUsedGiB, // current storage used in GB
    totalLockupNeeded, // total lockup needed
    depositNeeded, // deposit needed for storage
    persistenceDaysLeft, // days of storage left at requested rate
    persistenceDaysLeftAtCurrentRate, // days of storage left at current rate
    isRateSufficient, // is the rate allowance sufficient?
    isLockupSufficient, // is the lockup allowance sufficient?
    isSufficient, // are both sufficient?
    currentRateAllowanceGB, // how much storage (GB) current rate allowance supports
    currentLockupAllowance, // current lockup allowance
    totalDatasets: datasets.length, // total datasets
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
        const sizeInKiB =
          DecimalUnitConverter.bytesToKiB(sizeInBytes).toNumber();
        const sizeInMiB =
          DecimalUnitConverter.bytesToMiB(sizeInBytes).toNumber();
        const sizeInGB =
          DecimalUnitConverter.bytesToGiB(sizeInBytes).toNumber();

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

export const getDatasetsSizeMessage = (
  datasetsSizeInfo: Record<number, Omit<DatasetsSizeInfo, "message">>
) => {
  if (Object.keys(datasetsSizeInfo).length === 0) {
    return "No datasets found";
  }
  const sizeInGB = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInGB,
    0
  );
  const sizeInMB = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInMiB,
    0
  );
  const sizeInKB = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInKiB,
    0
  );
  const sizeInBytes = Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => acc + dataset.sizeInBytes,
    0
  );
  if (sizeInGB < 0.1 && sizeInMB > 0.1) {
    return `Dataset size: ${sizeInMB} MB`;
  }
  if (sizeInMB < 0.1 && sizeInKB > 0.1) {
    return `Dataset size: ${sizeInKB} KB`;
  }
  return `Dataset size: ${sizeInBytes} Bytes`;
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
  if (datasetSizeInfo?.sizeInGB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInGB.toFixed(4)} GB`;
  }
  if (datasetSizeInfo?.sizeInMiB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInMiB.toFixed(4)} MB`;
  }
  if (datasetSizeInfo?.sizeInKiB > 0.1) {
    return `Dataset size: ${datasetSizeInfo.sizeInKiB.toFixed(4)} KB`;
  }
  return `Dataset size: ${datasetSizeInfo.sizeInBytes} Bytes`;
};

export const getStorageUsage = (
  datasetsSizeInfo: Record<number, DatasetsSizeInfo>
): {
  usageInBytes: number;
  usageInKiB: number;
  usageInMiB: number;
  usageInGB: number;
} => {
  return Object.values(datasetsSizeInfo).reduce(
    (acc, dataset) => ({
      usageInBytes: acc.usageInBytes + dataset.sizeInBytes,
      usageInKiB: acc.usageInKiB + dataset.sizeInKiB,
      usageInMiB: acc.usageInMiB + dataset.sizeInMiB,
      usageInGB: acc.usageInGB + dataset.sizeInGB,
    }),
    { usageInBytes: 0, usageInKiB: 0, usageInMiB: 0, usageInGB: 0 }
  );
};
