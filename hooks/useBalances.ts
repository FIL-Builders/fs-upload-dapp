import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { formatUnits } from "viem";
import { defaultBalances, UseBalancesResponse } from "@/types";
import { useConfig } from "@/providers/ConfigProvider";
import * as ERC20 from "@filoz/synapse-core/erc20";
import * as Payments from "@filoz/synapse-core/pay";
import { getBalance } from "viem/actions";
import * as WarmStorage from "@filoz/synapse-core/warm-storage";
import { usePublicClient } from "wagmi";

/**
 * Custom hook for fetching and managing user wallet balances and storage metrics
 *
 * @description
 * This hook provides a comprehensive overview of the user's financial state within the Filecoin storage ecosystem.
 * It fetches multiple types of balances (FIL, USDFC, warm storage) and calculates storage-related metrics
 * to give users visibility into their storage costs, capacity, and persistence periods.
 *
 * @functionality
 * - Fetches FIL wallet balance (native Filecoin tokens)
 * - Fetches USDFC wallet balance (stable coin for payments)
 * - Fetches warm storage payment balance (allocated for storage costs)
 * - Calculates storage metrics (current usage, allowances, persistence days)
 * - Formats all balances into human-readable numbers
 * - Automatically refetches every 4 seconds for real-time updates
 *
 * @dependencies
 * - `useAccount`: Wallet connection state and address
 * - `useConfig`: Application configuration (CDN settings, etc.)
 * - `Synapse`: Filecoin storage SDK for balance queries
 * - `calculateStorageMetrics`: Utility for storage calculations
 *
 * @returns {Object} Query result with balance data and loading states
 * @returns {UseBalancesResponse} data - Formatted balance data or default values
 * @returns {boolean} isLoading - Loading state indicator
 * @returns {boolean} isError - Error state indicator
 * @returns {Function} refetch - Manual refetch function
 *
 * @example
 * ```tsx
 * function WalletOverview() {
 *   const { data: balances, isLoading, refetch } = useBalances();
 *
 *   if (isLoading) return <div>Loading balances...</div>;
 *
 *   return (
 *     <div>
 *       <p>FIL Balance: {balances.filBalanceFormatted}</p>
 *       <p>tUSDFC Balance: {balances.usdfcBalanceFormatted}</p>
 *       <p>Storage Days Remaining: {balances.daysLeft}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @throws {Error} When wallet address is not found
 * @throws {Error} When storage metric calculations fail
 */

export const useBalances = () => {
  const { address } = useAccount();
  // const connectorClient = useConnectorClient({ connector });
  const client = usePublicClient();
  const { config } = useConfig();
  const query = useQuery({
    enabled: !!address,
    queryKey: ["balances", address, config],
    queryFn: async (): Promise<UseBalancesResponse> => {
      if (!address) throw new Error("Address not found");
      if (!client) throw new Error("Public client not found");

      const [filRaw, { value: usdfcRaw, decimals: usdfcDecimals }, { availableFunds: paymentsRaw }, prices, operatorApprovals] = await Promise.all([
        getBalance(client, {
          address,
        }),
        ERC20.balance(client, {
          address,
        }),
        Payments.accountInfo(client, {
          address,
        }),
        WarmStorage.servicePrice(client),
        Payments.operatorApprovals(client, {
          address,
        }),
      ]);

      const storageMetrics = await calculateStorageMetrics({
        prices,
        operatorApprovals,
        availableFunds: paymentsRaw,
        config,
      });

      return {
        filBalance: filRaw,
        usdfcBalance: usdfcRaw,
        warmStorageBalance: paymentsRaw,
        filBalanceFormatted: formatBalance(filRaw, 18),
        usdfcBalanceFormatted: formatBalance(usdfcRaw, usdfcDecimals),
        warmStorageBalanceFormatted: formatBalance(paymentsRaw, usdfcDecimals),
        availableToFreeUpFormatted: formatBalance(storageMetrics.availableToFreeUp, usdfcDecimals),
        monthlyRateFormatted: formatBalance(storageMetrics.currentMonthlyRate, usdfcDecimals),
        maxMonthlyRateFormatted: formatBalance(storageMetrics.maxMonthlyRate, usdfcDecimals),
        ...storageMetrics,
      };
    },
  });

  return {
    ...query,
    data: query.data || defaultBalances,
  };
};

/**
 * Formats a balance value with specified decimals
 */
export const formatBalance = (balance: bigint, decimals: number): number => {
  return Number(Number(formatUnits(balance, decimals)).toFixed(5));
};
