/**
 * Application constants and utility functions
 *
 * @description
 * This module contains all the constant values and configuration used throughout
 * the application, including blockchain constants, fee structures, and utility
 * functions for query key generation.
 */

import { Address } from "viem";

/**
 * Maximum value for uint256 type in Solidity contracts
 * Used for unlimited approvals and maximum value checks
 */
export const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Fee required to create a new dataset on Filecoin
 * Set to 0.1 USDFC (expressed in wei with 18 decimals)
 *
 * @description
 * This fee is charged when creating a new dataset for storage. The fee helps
 * prevent spam dataset creation and covers administrative costs on the network.
 */
export const DATA_SET_CREATION_FEE = BigInt(0.1 * 10 ** 18);

/**
 * Size of each leaf in the Merkle tree structure (32 bytes)
 * Used for calculating total storage size from leaf count
 *
 * @description
 * Filecoin organizes data in Merkle trees where each leaf represents 32 bytes
 * of data. This constant is used to convert between leaf counts and actual
 * storage sizes throughout the application.
 */
export const LEAF_SIZE = 32n;

/**
 * Generates consistent query keys for TanStack Query caching
 *
 * @description
 * Creates standardized cache keys for different types of queries to ensure
 * proper cache invalidation and data consistency across the application.
 *
 * @param {string} type - Type of query (balances, datasets, upload, download)
 * @param {string|Address} key - Unique identifier (usually wallet address)
 * @returns {Array} Tuple for use as TanStack Query key
 *
 * @example
 * ```typescript
 * // Generate cache key for user's balance data
 * const balanceKey = getQueryKey("balances", userAddress);
 * // Returns: ["balances", "0x1234..."]
 *
 * // Generate cache key for datasets
 * const datasetsKey = getQueryKey("datasets", userAddress);
 * // Returns: ["datasets", "0x1234..."]
 * ```
 */
export const getQueryKey = (
  type: "balances" | "datasets" | "upload" | "download",
  key: string | Address | undefined
) => {
  return [type, key];
};

