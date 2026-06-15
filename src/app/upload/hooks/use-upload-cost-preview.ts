"use client";

import { useMemo } from "react";
import { useUploadPlan } from "@/app/upload/hooks/use-upload-plan";
import {
  deriveUploadCosts,
  planContexts,
  type PlanCounts,
  type ProviderHealth,
  type ResolutionErrorInfo,
  type UploadCostBreakdown,
} from "@/app/upload/lib/upload-plan";
import type { ResolvedLocation } from "@filoz/synapse-core/warm-storage";
import type { UploadMode } from "../types";
import { uploadMetadataForMode } from "./use-upload-phase";

export interface UploadCostPreview {
  /** Plan fetch succeeded — the provider landscape is known. */
  ready: boolean;
  /** Plan loading (the single network fetch, first attempt). */
  isLoading: boolean;
  isRefreshing: boolean;
  /** Plan-fetch failure — blocks the whole flow; retry re-fetches providers. */
  fetchError?: ResolutionErrorInfo;
  /** Provider health table (available once the plan loads). */
  providers: ProviderHealth[];
  counts?: PlanCounts;
  availableFunds: bigint;
  /** Resolved storage contexts for the current configuration. */
  locations?: ResolvedLocation[];
  newDatasetCount?: number;
  /** Exact costs for the current configuration (offline, instant). */
  costs?: UploadCostBreakdown;
  /** Resolution failure for the current config (plan loaded, but unservable). */
  error?: ResolutionErrorInfo;
  retry: () => void;
}

/**
 * Cost preview derived ENTIRELY offline from the one-time {@link useUploadPlan}
 * fetch. Selection and costs recompute synchronously via `useMemo` on every
 * configuration change (mode, copies, size, manual provider) — no per-change
 * network call — and exactly mirror the SDK's upload-time gate.
 */
export function useUploadCostPreview(params: {
  sizeBytes: number;
  copies: number;
  mode: UploadMode;
}): UploadCostPreview {
  const { plan, counts, isLoading, isFetching, error: planError, refetch } = useUploadPlan();

  return useMemo<UploadCostPreview>(() => {
    const base = {
      ready: plan != null,
      isLoading,
      isRefreshing: isFetching,
      providers: plan?.health ?? [],
      counts,
      availableFunds: plan?.account.availableFunds ?? 0n,
      retry: refetch,
    };

    if (!plan) {
      return { ...base, fetchError: planError ? describeFromUnknown(planError) : undefined };
    }

    const metadata = uploadMetadataForMode(params.mode);
    const { locations, error } = planContexts(plan.input, plan.health, {
      metadata,
      count: params.copies,
    });

    if (error || locations.length === 0) {
      return { ...base, error: error ?? UNKNOWN_RESOLUTION_ERROR };
    }

    // extraRunwayEpochs omitted → 0 (SDK default): the deposit is the minimum
    // shortfall after netting available balance, matching the upload gate.
    const costs = deriveUploadCosts({
      priceList: plan.priceList,
      account: plan.account,
      approved: plan.approved,
      locations,
      sizeByDataSetId: plan.sizeByDataSetId,
      dataSize: BigInt(params.sizeBytes),
      withCDN: params.mode === "cdn",
    });

    return {
      ...base,
      locations,
      newDatasetCount: costs.newDatasetCount,
      costs,
    };
  }, [
    plan,
    counts,
    isLoading,
    isFetching,
    planError,
    refetch,
    params.mode,
    params.copies,
    params.sizeBytes,
  ]);
}

const UNKNOWN_RESOLUTION_ERROR: ResolutionErrorInfo = {
  headline: "No storage provider available",
  detail: "No provider could be resolved for this configuration. Retry or try the other network.",
  retryable: true,
};

function describeFromUnknown(err: unknown): ResolutionErrorInfo {
  const message = err instanceof Error ? err.message : String(err);
  return {
    headline: "Couldn’t load storage providers",
    detail: message,
    retryable: true,
  };
}
