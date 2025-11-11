import { useQuery } from "@tanstack/react-query";
import { Synapse, TOKENS } from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { formatUnits } from "viem";
import { defaultBalances, UseBalancesResponse } from "@/types";
import { useEthersSigner } from "./useEthers";
import { useConfig } from "@/providers/ConfigProvider";

/**
 * Custom hook for fetching and managing user wallet balances and storage metrics
 *
 * @description
 * This hook provides a comprehensive overview of the user's financial state within the Filecoin storage ecosystem.
 * It fetches multiple types of balances (FIL, USDFC, warm storage) and calculates storage-related metrics
 * to give users visibility into their storage costs, capacity, and persistence periods.
 */
export const useBalances = () => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { config } = useConfig();
  const query = useQuery({
    // Only run query when wallet is connected and signer matches current address
    // This prevents unnecessary API calls and ensures data consistency
    enabled: !!address && signer?.address === address,

    // Include config in query key to invalidate cache when settings change
    queryKey: ["balances", address, config],

    queryFn: async (): Promise<UseBalancesResponse> => {
      // Early validation to provide clear error messages
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");
      // Initialize Synapse SDK with current configuration
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      const storageInfo = await synapse.getStorageInfo();
      console.table(storageInfo);

      // Fetch all balance types in parallel for optimal performance
      // - filRaw: Native FIL tokens in wallet
      // - usdfcRaw: USDFC stable coins in wallet
      // - paymentsRaw: USDFC allocated for storage payments
      const [filRaw, usdfcRaw, paymentsRaw] = await Promise.all([
        synapse.payments.walletBalance(), // Default FIL balance
        synapse.payments.walletBalance(TOKENS.USDFC), // USDFC wallet balance
        synapse.payments.balance(TOKENS.USDFC), // USDFC payment balance (allocated for storage)
      ]);

      // Get USDFC token decimals for proper formatting
      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);

      // Calculate comprehensive storage metrics including:
      // - Current storage usage and capacity
      // - Persistence days remaining
      // - Rate and lockup allowances
      // - Sufficiency checks for new uploads
      const storageMetrics = await calculateStorageMetrics(synapse, config);

      return {
        filBalance: filRaw,
        usdfcBalance: usdfcRaw,
        warmStorageBalance: paymentsRaw,
        filBalanceFormatted: formatBalance(filRaw, 18),
        usdfcBalanceFormatted: formatBalance(usdfcRaw, usdfcDecimals),
        warmStorageBalanceFormatted: formatBalance(paymentsRaw, usdfcDecimals),
        monthlyRateFormatted: formatBalance(storageMetrics.currentMonthlyRate, usdfcDecimals),
        maxMonthlyRateFormatted: formatBalance(storageMetrics.maxMonthlyRate, usdfcDecimals),
        availableToFreeUpFormatted: formatBalance(storageMetrics.availableToFreeUp, usdfcDecimals),
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
