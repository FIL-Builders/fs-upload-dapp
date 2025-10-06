import {
  Synapse,
  TIME_CONSTANTS,
  SIZE_CONSTANTS,
  TOKENS,
} from "@filoz/synapse-sdk";
import {
  StorageCalculationResult,
  ConfigType,
} from "@/types";
import {
  fetchWarmStorageCosts,
  fetchWarmStorageBalanceData,
  getDatasetsSizeInfo,
  calculateRateAllowanceGB,
} from "@/utils/warmStorageUtils";
import { DATA_SET_CREATION_FEE } from ".";
import {
  calculatePersistenceMetrics,
  calculateRemainingLockupAllowance,
  calculateDailyLockupRate,
  calculateStorageSufficiency,
  calculateTotalStorageRequirements
} from "@/utils/storageCalculations";

/**
 * Comprehensive storage metrics calculator for Filecoin WarmStorage service
 *
 * @description
 * This is the main utility function that orchestrates the calculation of all storage-related
 * metrics needed for the application. It fetches current costs and balances, then computes
 * comprehensive metrics including allowance sufficiency, persistence duration, and storage
 * capacity calculations. Used throughout the app for displaying storage status and validating
 * operations before execution.
 *
 * @workflow Calculation Process:
 * 1. **Data Fetching**: Parallel retrieval of storage costs, balance data, and dataset info
 * 2. **Rate Calculations**: Compute per-epoch and daily lockup requirements
 * 3. **Allowance Analysis**: Determine if current allowances are sufficient for new storage
 * 4. **Persistence Projections**: Calculate how long storage will persist with current/new rates
 * 5. **Capacity Assessment**: Determine storage capacity supported by current rate allowance
 * 6. **Cost Aggregation**: Calculate total deposit and allowance requirements
 *
 * @param {Synapse} synapse - Initialized Synapse SDK instance for blockchain interactions
 * @param {ConfigType} config - User configuration (storage capacity, persistence period, CDN settings)
 * @param {number} [fileSize] - Optional specific file size in bytes for upload validation
 *
 * @returns {Promise<StorageCalculationResult>} Comprehensive storage metrics object
 *
 * @example
 * ```typescript
 * // Check general storage status
 * const metrics = await calculateStorageMetrics(synapse, config);
 * console.log(`Storage days remaining: ${metrics.persistenceDaysLeft}`);
 * console.log(`Current usage: ${metrics.currentStorageGB} GB`);
 *
 * // Validate specific file upload
 * const fileMetrics = await calculateStorageMetrics(synapse, config, file.size);
 * if (fileMetrics.isSufficient) {
 *   console.log("File can be uploaded with current allowances");
 * } else {
 *   console.log(`Need to deposit: ${fileMetrics.depositNeeded} USDFC`);
 * }
 * ```
 *
 * @throws {Error} When storage cost fetching fails
 * @throws {Error} When balance data retrieval fails
 * @throws {Error} When dataset information cannot be loaded
 * @throws {Error} When storage metric calculations fail
 *
 * @see {@link StorageCalculationResult} For detailed return type information
 * @see {@link fetchWarmStorageCosts} For storage pricing details
 * @see {@link fetchWarmStorageBalanceData} For balance validation
 */
export const calculateStorageMetrics = async (
  synapse: Synapse,
  config: ConfigType,
  fileSize?: number
): Promise<StorageCalculationResult> => {
  try {
    // Determine storage capacity: use fileSize if provided, otherwise use config
    const storageCapacityBytes =
      fileSize ??
      Number((config.storageCapacity * Number(SIZE_CONSTANTS.GiB)).toFixed(0));

    // Fetch storage costs and balance data in parallel
    const [storageCosts, warmStorageBalance, storageInfo] = await Promise.all([
      fetchWarmStorageCosts(synapse),
      fetchWarmStorageBalanceData(
        synapse,
        storageCapacityBytes,
        config.persistencePeriod,
        config.withCDN
      ),
      datasetsStorageInfo(synapse, config),
    ]);

    // Calculate rate and lockup requirements using utility functions
    const rateNeeded = warmStorageBalance.costs.perEpoch;
    const lockupPerDay = calculateDailyLockupRate(rateNeeded, TIME_CONSTANTS.EPOCHS_PER_DAY);
    const lockupPerDayAtCurrentRate = calculateDailyLockupRate(
      warmStorageBalance.currentRateUsed,
      TIME_CONSTANTS.EPOCHS_PER_DAY
    );

    // Calculate remaining lockup using utility function
    const currentLockupRemaining = calculateRemainingLockupAllowance(
      warmStorageBalance.currentLockupAllowance,
      warmStorageBalance.currentLockupUsed
    );

    // Calculate persistence days using high-precision function
    const { persistenceDaysLeft, persistenceDaysLeftAtCurrentRate } =
      calculatePersistenceMetrics(
        currentLockupRemaining,
        lockupPerDay,
        lockupPerDayAtCurrentRate
      );

    // Determine sufficiency using utility function
    const isFileUpload = fileSize !== undefined;
    const { isRateSufficient, isLockupSufficient, isSufficient } =
      calculateStorageSufficiency(
        warmStorageBalance.currentRateAllowance,
        warmStorageBalance.currentRateUsed,
        rateNeeded,
        currentLockupRemaining,
        lockupPerDay,
        config.minDaysThreshold,
        storageInfo.dataSetCreationFee,
        isFileUpload
      );

    // Calculate storage capacity supported by current rate allowance
    const currentRateAllowanceGB = calculateRateAllowanceGB(
      warmStorageBalance.currentRateAllowance,
      storageCosts,
      config.withCDN
    );

    // Fetch current storage balance
    const storageBalance = await synapse.payments.balance(TOKENS.USDFC);

    // Calculate total amounts needed using utility function
    const { totalDepositNeeded, totalLockupNeeded, totalRateNeeded } =
      calculateTotalStorageRequirements(
        warmStorageBalance.currentLockupUsed,
        warmStorageBalance.currentLockupAllowance,
        warmStorageBalance.currentRateUsed,
        warmStorageBalance.currentRateAllowance,
        rateNeeded,
        lockupPerDay,
        config.persistencePeriod,
        storageInfo.dataSetCreationFee,
        storageBalance,
        warmStorageBalance.depositAmountNeeded
      );

    return {
      rateNeeded: totalRateNeeded,
      rateUsed: warmStorageBalance.currentRateUsed,
      currentStorageBytes: BigInt(storageInfo.currentStorageBytes),
      currentStorageGB: storageInfo.currentStorageGB,
      cdnUsedGiB: storageInfo.cdnUsedGiB,
      nonCdnUsedGiB: storageInfo.nonCdnUsedGiB,
      totalLockupNeeded,
      depositNeeded: totalDepositNeeded,
      persistenceDaysLeft,
      persistenceDaysLeftAtCurrentRate,
      isRateSufficient,
      isLockupSufficient,
      isSufficient,
      currentRateAllowanceGB,
      currentLockupAllowance: warmStorageBalance.currentLockupAllowance,
      totalDatasets: storageInfo.totalDatasets,
    };
  } catch (error) {
    console.error("Error calculating storage metrics:", error);
    throw new Error(
      `Failed to calculate storage metrics: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Aggregates storage information from all datasets
 */
const datasetsStorageInfo = async (synapse: Synapse, config: ConfigType) => {
  try {
    const datasets = await synapse.storage.findDataSets();
    const datasetsSizeInfo = await getDatasetsSizeInfo(datasets, synapse);
    const datasetsArray = Object.values(datasetsSizeInfo);

    // Calculate totals using a single pass
    const totals = datasetsArray.reduce(
      (acc, dataset) => {
        acc.totalBytes += dataset.sizeInBytes;
        acc.totalGB += dataset.sizeInGB;

        if (dataset.withCDN) {
          acc.cdnGB += dataset.sizeInGB;
          acc.cdnCount++;
        } else {
          acc.nonCdnGB += dataset.sizeInGB;
          acc.nonCdnCount++;
        }

        return acc;
      },
      {
        totalBytes: 0,
        totalGB: 0,
        cdnGB: 0,
        nonCdnGB: 0,
        cdnCount: 0,
        nonCdnCount: 0,
      }
    );

    // Determine if dataset creation fee should be included
    const includeDatasetCreationFee = config.withCDN
      ? totals.cdnCount === 0
      : totals.nonCdnCount === 0;

    const dataSetCreationFee = includeDatasetCreationFee
      ? DATA_SET_CREATION_FEE
      : BigInt(0);

    return {
      currentStorageBytes: totals.totalBytes,
      currentStorageGB: totals.totalGB,
      cdnUsedGiB: totals.cdnGB,
      nonCdnUsedGiB: totals.nonCdnGB,
      dataSetCreationFee,
      datasets,
      totalDatasets: datasets.length,
    };
  } catch (error) {
    console.error("Error fetching datasets storage info:", error);
    throw new Error(
      `Failed to fetch datasets storage info: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
