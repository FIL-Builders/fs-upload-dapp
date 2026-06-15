"use client";

import {
  planCounts,
  toProviderHealth,
  type AccountSnapshot,
  type ProviderHealth,
} from "@/app/upload/lib/upload-plan";
import * as Pay from "@filoz/synapse-core/pay";
import { getDataSetSizes } from "@filoz/synapse-core/pdp-verifier";
import { ping } from "@filoz/synapse-core/sp";
import {
  fetchProviderSelectionInput,
  type ProviderSelectionInput,
} from "@filoz/synapse-core/warm-storage";
import { usePriceList, type UsePriceListResult } from "@filoz/synapse-react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useConnection, usePublicClient } from "wagmi";

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
  /**
   * dataSetId → current on-chain stored bytes (leafCount × 32), read from the
   * PDP verifier — the same source and units the SDK's
   * `calculateMultiContextCosts` uses at upload time, so reused-dataset cost
   * previews match the upload-time figure.
   */
  sizeByDataSetId: Map<bigint, bigint>;
}

/**
 * One-time fetch of everything upload planning needs, cached per (address,
 * chain): the price list, account state, the provider universe with health,
 * and the client's existing dataset sizes. After this resolves, the cost
 * preview recomputes entirely offline for every configuration change (see
 * `useUploadCostPreview`).
 *
 * The provider/account query is `persist: false` — it holds Maps and live
 * health that must not be serialized to localStorage.
 */
export function useUploadPlan() {
  const { address, chainId, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { data: priceList, isLoading: priceLoading } = usePriceList();

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

      // Provider health and existing-dataset sizes both derive from `input`;
      // fetch them together. Health: the same check smartSelect runs (GET
      // {serviceURL}/pdp/ping), retried up to PING_ATTEMPTS times to avoid
      // false-negative verdicts. Sizes: the on-chain leafCount × 32 from the
      // PDP verifier — the SAME source calculateMultiContextCosts reads at
      // upload time, so reused-dataset previews match (0n for non-live sets).
      const dataSetIds = input.clientDataSets.map((ds) => ds.dataSetId);
      const [pings, sizes] = await Promise.all([
        Promise.allSettled(input.providers.map((p) => pingWithRetries(p.pdp.serviceURL))),
        dataSetIds.length > 0
          ? getDataSetSizes(client, { dataSetIds })
          : Promise.resolve([] as bigint[]),
      ]);
      const health = toProviderHealth(input.providers, input.endorsedIds, pings);

      const sizeByDataSetId = new Map<bigint, bigint>();
      for (let i = 0; i < dataSetIds.length; i++) sizeByDataSetId.set(dataSetIds[i], sizes[i]);

      const account: AccountSnapshot = {
        availableFunds: accountSummary.availableFunds,
        debt: accountSummary.debt,
        runwayInEpochs: accountSummary.runwayInEpochs,
        lockupRatePerEpoch: accountSummary.lockupRatePerEpoch,
      };

      return { input, account, approved, health, sizeByDataSetId };
    },
    meta: { persist: false },
    staleTime: 60_000,
    // Provider health is transient — one automatic retry on failure
    retry: 1,
    retryDelay: 1_500,
  });

  const plan: UploadPlan | undefined =
    query.data && priceList
      ? {
          priceList,
          account: query.data.account,
          approved: query.data.approved,
          input: query.data.input,
          health: query.data.health,
          sizeByDataSetId: query.data.sizeByDataSetId,
        }
      : undefined;

  return {
    plan,
    counts: query.data ? planCounts(query.data.health) : undefined,
    isLoading: priceLoading || query.isLoading,
    isFetching: query.isFetching,
    error: query.error ?? undefined,
    refetch: () => void query.refetch(),
  };
}
