"use client";

import { useMemo } from "react";
import { useDataSets, useServicePrice } from "@filoz/synapse-react";
import { Database, Gauge, TrendingUp, Zap } from "lucide-react";
import { useConnection } from "wagmi";
import { getDatasetsCostInfo, transformDatasets } from "@/lib/datasets";
import { formatCapacity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface CostBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CostBreakdownModal({ open, onOpenChange }: CostBreakdownModalProps) {
  const { address } = useConnection();
  const { data: raw } = useDataSets({ address });
  const datasets = useMemo(() => transformDatasets(raw), [raw]);
  const { data: pricing, isLoading } = useServicePrice();

  // Calculate per-dataset costs with efficiency metrics
  const datasetCosts = useMemo(() => {
    if (!datasets || !pricing) return [];

    return getDatasetsCostInfo(datasets, pricing);
  }, [datasets, pricing]);

  // Calculate overall efficiency metrics
  const efficiencyMetrics = useMemo(() => {
    const totalPaidCapacity = datasetCosts.reduce((sum, d) => sum + d.paidCapacityGiB, 0);
    const totalActualUsage = datasetCosts.reduce((sum, d) => sum + d.sizeGiB, 0);
    const efficiencyPercent = totalPaidCapacity > 0 ? (totalActualUsage / totalPaidCapacity) * 100 : 100;
    const totalRemainingFree = datasetCosts.reduce((sum, d) => sum + d.remainingFreeCapacityGiB, 0);

    return {
      totalPaidCapacity,
      totalActualUsage,
      efficiencyPercent,
      totalRemainingFree,
    };
  }, [datasetCosts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto pb-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost Breakdown
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of your storage costs across all datasets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Storage Efficiency Summary */}
          {!isLoading && datasetCosts.length > 0 && (
            <section className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Storage Efficiency
                </h3>
                <span className="text-lg font-bold">
                  {efficiencyMetrics.efficiencyPercent.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={Math.min(efficiencyMetrics.efficiencyPercent, 100)}
                className="h-2 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                Using {formatCapacity(efficiencyMetrics.totalActualUsage)} of{" "}
                {formatCapacity(efficiencyMetrics.totalPaidCapacity)} paid capacity
              </p>
              {efficiencyMetrics.totalRemainingFree > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCapacity(efficiencyMetrics.totalRemainingFree)} available at no extra cost
                </p>
              )}
            </section>
          )}

          {/* Active Dataset Costs */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Active Datasets ({datasetCosts.length})
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : datasetCosts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No active datasets. Upload files to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {datasetCosts.map((dataset) => (
                  <div key={dataset.datasetId} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">Dataset #{dataset.datasetId}</span>
                          {dataset.isCDN && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              CDN
                            </Badge>
                          )}
                          {dataset.isMinimumApplied && (
                            <Badge variant="outline" className="text-xs">
                              Min Fee
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dataset.sizeGiB.toFixed(2)} GiB &middot; {dataset.pieceCount} files &middot;{" "}
                          {dataset.providerName}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{dataset.monthlyRateStr} USDFC</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>

                    {/* Per-dataset utilization bar (only show if min fee applies) */}
                    {dataset.isMinimumApplied && (
                      <div className="mt-3 pt-3 border-t border-muted">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Capacity utilization</span>
                          <span>{dataset.utilizationPercent.toFixed(2)}%</span>
                        </div>
                        <Progress value={Math.min(dataset.utilizationPercent, 100)} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatCapacity(dataset.remainingFreeCapacityGiB)} free capacity remaining
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
