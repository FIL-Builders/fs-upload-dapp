import { useQuery } from "@tanstack/react-query";
import { TOKENS } from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { formatUnits } from "viem";
import { defaultBalances, UseBalancesResponse } from "@/types";
import { useSynapse } from "@/providers/SynapseProvider";

/**
 * Hook to fetch and format wallet balances and storage metrics
 */
export const useBalances = () => {
  const { synapse } = useSynapse();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();

  const query = useQuery({
    queryKey: ["get-balances", address, isConnected, isConnecting, isReconnecting],
    enabled: isConnected && !isConnecting && !isReconnecting,
    queryFn: async (): Promise<UseBalancesResponse> => {
      if (!synapse) throw new Error("Synapse not found");
      if (!address) throw new Error("Address not found");

      // Fetch raw balances
      const [filRaw, usdfcRaw, paymentsRaw] = await Promise.all([
        synapse.payments.walletBalance(),
        synapse.payments.walletBalance(TOKENS.USDFC),
        synapse.payments.balance(TOKENS.USDFC),
      ]);

      const usdfcDecimals = synapse.payments.decimals(TOKENS.USDFC);

      // Calculate storage metrics
      const storageMetrics = await calculateStorageMetrics(synapse);

      return {
        filBalance: filRaw,
        usdfcBalance: usdfcRaw,
        warmStorageBalance: paymentsRaw,
        filBalanceFormatted: formatBalance(filRaw, 18),
        usdfcBalanceFormatted: formatBalance(usdfcRaw, usdfcDecimals),
        warmStorageBalanceFormatted: formatBalance(paymentsRaw, usdfcDecimals),
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
