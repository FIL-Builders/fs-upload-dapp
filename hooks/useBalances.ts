import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Synapse, TOKENS } from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { formatUnits } from "viem";
import { defaultBalances, UseBalancesResponse } from "@/types";
import { useEthersSigner } from "./useEthers";
import { config } from "@/config";
import { getQueryKey } from "@/utils/constants";

/**
 * Hook to fetch and format wallet balances and storage metrics
 */
export const useBalances = () => {
  const { address } = useAccount();
  const signer = useEthersSigner();

  const query = useQuery({
    queryKey: getQueryKey("balances", address),
    queryFn: async (): Promise<UseBalancesResponse> => {
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      // Fetch raw balances
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

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
