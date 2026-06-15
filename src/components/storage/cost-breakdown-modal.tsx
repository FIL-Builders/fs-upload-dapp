"use client";

import { useMemo } from "react";
import { useDataSets, usePriceList } from "@filoz/synapse-react";
import { Database, Gauge, TrendingUp, Zap } from "lucide-react";
import { useConnection } from "wagmi";
import { getDatasetsCostInfo, transformDatasets } from "@/lib/datasets";
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

// Above this share of a dataset's monthly cost, the flat proving-service fee
// dominates and consolidating into fewer datasets would save money.
const FEE_HEAVY_THRESHOLD_PERCENT = 50;

export function CostBreakdownModal({ open, onOpenChange }: CostBreakdownModalProps) {
  const { address } = useConnection();
  const { data: raw } = useDataSets({ address });
  const datasets = useMemo(() => transformDatasets(raw), [raw]);
  const { data: pricing, isLoading } = usePriceList();

  // Calculate per-dataset costs with storage/fee breakdown
  const datasetCosts = useMemo(() => {
    if (!datasets || !pricing) return [];

    return getDatasetsCostInfo(datasets, pricing);
  }, [datasets, pricing]);

  // Overall efficiency: how much of the total monthly spend pays for actual
  // storage vs flat per-dataset fees
  const efficiencyMetrics = useMemo(() => {
    const totalMonthly = datasetCosts.reduce((sum, d) => sum + Number(d.monthlyRateStr), 0);
    const totalStorage = datasetCosts.reduce((sum, d) => sum + Number(d.storageMonthlyStr), 0);
    const totalFees = totalMonthly - totalStorage;
    const efficiencyPercent = totalMonthly > 0 ? (totalStorage / totalMonthly) * 100 : 100;
    const feeHeavyCount = datasetCosts.filter(
      (d) => d.feeOverheadPercent > FEE_HEAVY_THRESHOLD_PERCENT,
    ).length;

    return {
      totalMonthly,
      totalStorage,
      totalFees,
      efficiencyPercent,
      feeHeavyCount,
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
          {/* Cost Efficiency Summary */}
          {!isLoading && datasetCosts.length > 0 && (
            <section className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Cost Efficiency
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
                {efficiencyMetrics.totalStorage.toFixed(4)} USDFC/month pays for storage,{" "}
                {efficiencyMetrics.totalFees.toFixed(4)} USDFC/month goes to flat proving-service
                fees
              </p>
              {efficiencyMetrics.feeHeavyCount > 1 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {efficiencyMetrics.feeHeavyCount} datasets are dominated by the proving-service
                  fee — consolidating uploads into fewer datasets would reduce your monthly cost
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
                          {dataset.feeOverheadPercent > FEE_HEAVY_THRESHOLD_PERCENT && (
                            <Badge variant="outline" className="text-xs">
                              Fee-heavy
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dataset.sizeGiB.toFixed(2)} GiB &middot; {dataset.pieceCount} files
                          &middot; {dataset.providerName}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold">{dataset.monthlyRateStr} USDFC</p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>

                    {/* Storage vs flat-fee split */}
                    <div className="mt-3 pt-3 border-t border-muted">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Storage {dataset.storageMonthlyStr} USDFC</span>
                        <span>Proving service {dataset.datasetFeeStr} USDFC</span>
                      </div>
                      <Progress
                        value={Math.max(0, 100 - dataset.feeOverheadPercent)}
                        className="h-1.5"
                      />
                      {dataset.feeOverheadPercent > FEE_HEAVY_THRESHOLD_PERCENT && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {dataset.feeOverheadPercent.toFixed(0)}% of this dataset&apos;s cost is
                          the flat proving-service fee
                        </p>
                      )}
                    </div>
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
