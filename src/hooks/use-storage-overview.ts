"use client";

import { useMemo } from "react";
import { useDataSets, useServicePrice } from "@filoz/synapse-react";
import { useConnection } from "wagmi";
import { transformDatasets } from "@/lib/datasets";
import { computeDashboardMetrics } from "@/lib/storage-metrics";
import { useBalances } from "./use-balances";

export function useStorageOverview() {
  const { data: balances, isLoading: balancesLoading } = useBalances();
  const { address } = useConnection();
  const { data: raw, isLoading: datasetsLoading } = useDataSets({ address });
  const { data: pricing, isLoading: pricingLoading } = useServicePrice();
  const datasets = useMemo(() => transformDatasets(raw), [raw]);
  const metrics = useMemo(
    () => computeDashboardMetrics(balances, datasets, pricing),
    [balances, datasets, pricing],
  );

  return {
    balances,
    datasets,
    metrics,
    pricing,
    isLoading: balancesLoading || datasetsLoading || pricingLoading,
  };
}
