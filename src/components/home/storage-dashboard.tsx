"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUp,
  Calendar,
  ChevronDown,
  FileStack,
  HardDrive,
  Info,
  Settings,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { formatDaysDisplay, getDaysVariant } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStorageOverview } from "@/hooks/use-storage-overview";
import { useStorageConfig, useStorageConfigStore } from "@/providers/storage-config";
import { DepositForm } from "@/components/pay/deposit";
import { WithdrawForm } from "@/components/pay/withdraw";
import { CostBreakdownModal } from "@/components/storage/cost-breakdown-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function StorageDashboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-6 w-40 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StorageDashboard() {
  const { balances, metrics, isLoading } = useStorageOverview();
  const { config, updateConfig } = useStorageConfig();

  const openConfigModal = useStorageConfigStore((s) => s.openModal);
  const [costModalOpen, setCostModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);

  if (isLoading) return <StorageDashboardSkeleton />;

  const showDeposit = balances.depositNeeded > 0n;
  const showWithdraw = balances.availableToFreeUp > 0n;

  const handleIncreaseCapacity = () => {
    updateConfig({ storageCapacity: metrics.matchingCapacityGiB });
    toast.success(`Capacity updated to ${metrics.matchingCapacityGiB} GB`);
  };

  return (
    <>
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Card className={!detailsOpen ? "pb-0" : ""}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Storage Overview</CardTitle>
                <CardDescription className="mt-1">
                  Monitor your storage usage and balance
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                {metrics.isRateExceeded && (
                  <>
                    <Button
                      variant="default"
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={handleIncreaseCapacity}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Increase to {metrics.matchingCapacityGiB} GB
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/datasets">
                        <Settings className="h-4 w-4 mr-2" />
                        Consolidate
                      </Link>
                    </Button>
                  </>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setCostModalOpen(true)}>
                      <Info className="h-4 w-4" />
                      <div className="md:block hidden">Details</div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View cost breakdown</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={openConfigModal}>
                      <Settings className="h-4 w-4" />
                      <div className="md:block hidden">Configure</div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configure storage</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        aria-label={detailsOpen ? "Hide details" : "Show details"}
                      >
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 transition-transform",
                            detailsOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{detailsOpen ? "Hide details" : "Show details"}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {showDeposit && <DepositForm />}

            <CollapsibleContent className="space-y-6">
              {/* Storage Usage */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="font-medium">
                    {metrics.totalStoredGiB.toFixed(2)} / {balances.totalConfiguredCapacity} GiB
                  </span>
                </div>
                <Progress value={metrics.storageUsagePercent} className="h-2" />
              </div>

              {/* Burn Rate */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Burn Rate (Current vs Max)
                    {metrics.isRateExceeded && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </span>
                  <span
                    className={`font-medium ${metrics.isRateExceeded ? "text-amber-600 dark:text-amber-400" : ""}`}
                  >
                    {metrics.monthlyRateStr} / {metrics.maxMonthlyRateStr} USDFC/mo
                  </span>
                </div>
                <Progress
                  value={Math.min(metrics.burnRatePercent, 100)}
                  className={`h-2 ${metrics.isRateExceeded ? "[&>div]:bg-amber-500" : ""}`}
                />
                {metrics.isRateExceeded && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {(metrics.burnRatePercent - 100).toFixed(0)}% over max — min fees from{" "}
                    {metrics.totalDatasetCount} datasets
                  </p>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={Calendar}
                  label="Days Remaining"
                  value={formatDaysDisplay(metrics.daysLeftAtCurrentRate)}
                  subValue={
                    metrics.daysLeftAtCurrentRate !== Infinity
                      ? `${formatDaysDisplay(metrics.daysLeft)} at max rate`
                      : undefined
                  }
                  variant={getDaysVariant(metrics.daysLeftAtCurrentRate, config.minDaysThreshold)}
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Monthly Burn Rate"
                  value={`${metrics.monthlyRateStr} USDFC`}
                  subValue={`Max: ${metrics.maxMonthlyRateStr} USDFC`}
                  variant={metrics.isRateExceeded ? "warning" : "default"}
                />
                <MetricCard
                  icon={FileStack}
                  label="Total Stored"
                  value={`${metrics.totalStoredGiB.toFixed(2)} GiB`}
                  subValue={`${metrics.totalPieceCount} files across ${metrics.totalDatasetCount} datasets`}
                />
                <MetricCard
                  icon={HardDrive}
                  label="Configured Capacity"
                  value={`${balances.totalConfiguredCapacity} GiB`}
                  subValue={`${(100 - metrics.storageUsagePercent).toFixed(1)}% available`}
                />
              </div>

              {showWithdraw && <WithdrawForm />}
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <CostBreakdownModal open={costModalOpen} onOpenChange={setCostModalOpen} />
    </>
  );
}
