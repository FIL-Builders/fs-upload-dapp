"use client";

import { useMemo } from "react";
import {
  planCounts,
  toProviderHealth,
  type AccountSnapshot,
  type ProviderHealth,
} from "@/app/upload/lib/upload-plan";
import * as Pay from "@filoz/synapse-core/pay";
import { ping } from "@filoz/synapse-core/sp";
import {
  fetchProviderSelectionInput,
  type ProviderSelectionInput,
} from "@filoz/synapse-core/warm-storage";
import { useDataSets, usePriceList, type UsePriceListResult } from "@filoz/synapse-react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConnection, usePublicClient } from "wagmi";
import { transformDatasets } from "@/lib/datasets";

// Each SDK ping has a ~1s overall budget (internal retries included). To avoid
// false "unreachable" verdicts from a single transient failure, retry the whole
// ping a few times with fresh budgets — a provider is reachable if ANY attempt
// succeeds, unreachable only if all fail.
const PING_ATTEMPTS = 3;
const PING_RETRY_DELAY_MS = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function pingWithRetries(serviceURL: string, attempts = PING_ATTEMPTS): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await ping(serviceURL);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await delay(PING_RETRY_DELAY_MS);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Provider unreachable");
}

interface UploadPlan {
  priceList: UsePriceListResult;
  account: AccountSnapshot;
  /** Whether FWSS operator approval covers the required lockup period. */
  approved: boolean;
  /** Approved PDP providers + endorsed IDs + the client's datasets. */
  input: ProviderSelectionInput;
  /** Per-provider endorsement + reachability (cached ping results). */
  health: ProviderHealth[];
  /** dataSetId → current stored bytes (from the client's datasets). */
  sizeByDataSetId: Map<bigint, bigint>;
}

/**
 * One-time fetch of everything upload planning needs, cached per (address,
 * chain): the price list, account state, the provider universe with health,
 * and the client's datasets. After this resolves, the cost preview recomputes
 * entirely offline for every configuration change (see `useUploadCostPreview`).
 *
 * The provider/account query is `persist: false` — it holds Maps and live
 * health that must not be serialized to localStorage.
 */
export function useUploadPlan() {
  const { address, chainId, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { data: priceList, isLoading: priceLoading } = usePriceList();
  const { data: rawDatasets, isLoading: datasetsLoading } = useDataSets({ address });

  const lockupPeriod = priceList?.lockups.defaultLockupPeriod;

  const query = useQuery({
    enabled: isConnected && !!address && !!chainId && !!publicClient && lockupPeriod != null,
    queryKey: ["upload-plan", address, chainId, lockupPeriod?.toString() ?? null],
    queryFn: async () => {
      const client = publicClient!;
      const addr = address as Address;
      const [input, accountSummary, approved] = await Promise.all([
        fetchProviderSelectionInput(client, { address: addr }),
        Pay.getAccountSummary(client, { address: addr }),
        Pay.isFwssMaxApproved(client, {
          clientAddress: addr,
          requiredMaxLockupPeriod: lockupPeriod!,
        }),
      ]);

      // Same health check smartSelect runs (GET {serviceURL}/pdp/ping), but
      // retried up to PING_ATTEMPTS times to avoid false-negative verdicts
      const pings = await Promise.allSettled(
        input.providers.map((p) => pingWithRetries(p.pdp.serviceURL)),
      );
      const health = toProviderHealth(input.providers, input.endorsedIds, pings);

      const account: AccountSnapshot = {
        availableFunds: accountSummary.availableFunds,
        debt: accountSummary.debt,
        runwayInEpochs: accountSummary.runwayInEpochs,
        lockupRatePerEpoch: accountSummary.lockupRatePerEpoch,
      };

      return { input, account, approved, health };
    },
    meta: { persist: false },
    staleTime: 60_000,
    // Provider health is transient — one automatic retry on failure
    retry: 1,
    retryDelay: 1_500,
  });

  const sizeByDataSetId = useMemo(() => {
    const map = new Map<bigint, bigint>();
    for (const ds of transformDatasets(rawDatasets)) {
      map.set(ds.dataSetId, ds.totalSize.sizeBytes);
    }
    return map;
  }, [rawDatasets]);

  const plan: UploadPlan | undefined =
    query.data && priceList
      ? {
          priceList,
          account: query.data.account,
          approved: query.data.approved,
          input: query.data.input,
          health: query.data.health,
          sizeByDataSetId,
        }
      : undefined;

  return {
    plan,
    counts: query.data ? planCounts(query.data.health) : undefined,
    isLoading: priceLoading || datasetsLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error ?? undefined,
    refetch: () => void query.refetch(),
  };
}
