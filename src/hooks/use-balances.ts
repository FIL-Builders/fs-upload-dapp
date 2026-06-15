"use client";

import * as Erc20 from "@filoz/synapse-core/erc20";
import * as Pay from "@filoz/synapse-core/pay";
import { getChain } from "@filoz/synapse-sdk";
import { useQuery } from "@tanstack/react-query";
import { getBalance } from "viem/actions";
import { useConnection, usePublicClient } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { fetchStorageMetrics } from "@/lib/storage-metrics";
import { useStorageConfig } from "@/providers/storage-config";

type StorageMetrics = Awaited<ReturnType<typeof fetchStorageMetrics>>;

export type BalancesData = {
  filBalance: bigint;
  usdfcBalance: bigint;
  /** Spendable storage balance (availableFunds = deposited funds minus lockups). */
  warmStorageBalance: bigint;
  /** Total deposited funds in the Payments contract. */
  warmStorageTotalFunds: bigint;
  /** Locked portion: prepaid lifecycle reserves + streaming-rate lockup. */
  warmStorageLockedFunds: bigint;
} & StorageMetrics;

export const useBalances = () => {
  const { config } = useStorageConfig();
  const { address, chainId } = useConnection();
  const publicClient = usePublicClient();
  const query = useQuery<BalancesData>({
    enabled: !!address,
    queryKey: queryKeys.balances(address, config, chainId),
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not found");
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain ID not found");

      const [filRaw, usdfcRaw, paymentsRaw] = await Promise.all([
        getBalance(publicClient, { address }),
        Erc20.balance(publicClient, { address, token: getChain(chainId).contracts.usdfc.address }),
        Pay.accounts(publicClient, { address }),
      ]);

      const storageMetrics = await fetchStorageMetrics(publicClient, address, config);

      const lockedFunds = paymentsRaw.funds - paymentsRaw.availableFunds;

      return {
        filBalance: filRaw,
        usdfcBalance: usdfcRaw.value,
        warmStorageBalance: paymentsRaw.availableFunds,
        warmStorageTotalFunds: paymentsRaw.funds,
        warmStorageLockedFunds: lockedFunds > 0n ? lockedFunds : 0n,
        ...storageMetrics,
      };
    },
  });

  return {
    ...query,
    data: query.data || defaultBalances,
  };
};

const defaultBalances: BalancesData = {
  filBalance: 0n,
  usdfcBalance: 0n,
  warmStorageBalance: 0n,
  warmStorageTotalFunds: 0n,
  warmStorageLockedFunds: 0n,
  depositNeeded: 0n,
  availableToFreeUp: 0n,
  daysLeft: "0",
  daysLeftAtCurrentRate: "Infinity",
  isFwssApproved: false,
  totalConfiguredCapacity: 0,
  currentMonthlyRate: 0n,
  maxMonthlyRate: 0n,
};
