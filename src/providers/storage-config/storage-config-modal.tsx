"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  RotateCcw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { computeConfigCostPreview } from "@/lib/storage-metrics";
import { useStorageOverview } from "@/hooks/use-storage-overview";
import { useStorageConfig } from "@/providers/storage-config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_STORAGE_CONFIG, useStorageConfigStore } from "./storage-config-store";

const MIN_PERSISTENCE_DAYS = 30;

const CAPACITY_PRESETS = [
  { label: "50 GB", value: 50 },
  { label: "150 GB", value: 150 },
  { label: "500 GB", value: 500 },
  { label: "1 TB", value: 1000 },
];

const PERIOD_PRESETS = [
  { label: "1 Month", days: 30 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
  { label: "2 Years", days: 730 },
];

export function StorageConfigModal() {
  const modalOpen = useStorageConfigStore((s) => s.modalOpen);
  const closeModal = useStorageConfigStore((s) => s.closeModal);
  const { balances, metrics, pricing, isLoading } = useStorageOverview();
  const { config, updateConfig, resetConfig } = useStorageConfig();

  const [capacity, setCapacity] = useState(config.storageCapacity);
  const [period, setPeriod] = useState(config.persistencePeriod);
  const [threshold, setThreshold] = useState(config.minDaysThreshold);

  useEffect(() => {
    if (modalOpen) {
      setCapacity(config.storageCapacity);
      setPeriod(config.persistencePeriod);
      setThreshold(config.minDaysThreshold);
    }
  }, [modalOpen, config]);

  const costPreview = useMemo(
    () =>
      pricing
        ? computeConfigCostPreview(capacity, period, threshold, metrics.storageBalance, pricing)
        : null,
    [capacity, period, threshold, pricing, metrics.storageBalance],
  );

  const handleSubmit = () => {
    updateConfig({
      storageCapacity: capacity,
      persistencePeriod: period,
      minDaysThreshold: threshold,
    });
    toast.success("Configuration saved");
    closeModal();
  };

  const handleReset = () => {
    resetConfig();
    setCapacity(DEFAULT_STORAGE_CONFIG.storageCapacity);
    setPeriod(DEFAULT_STORAGE_CONFIG.persistencePeriod);
    setThreshold(DEFAULT_STORAGE_CONFIG.minDaysThreshold);
    toast.success("Configuration reset to defaults");
  };

  const handleMatchCurrentUsage = () => {
    setCapacity(metrics.matchingCapacityGiB);
    toast.success(`Capacity set to ${metrics.matchingCapacityGiB} GB to match current usage`);
  };

  return (
    <Dialog open={modalOpen} onOpenChange={(v) => !v && closeModal()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Storage Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your storage capacity and alert preferences. These settings are saved per
            wallet and network.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Usage */}
          {!isLoading && balances.isRateSufficient && balances.isLockupSufficient && (
            <div className="p-4 rounded-lg bg-muted/30 space-y-3">
              <h4 className="font-medium text-sm">Current Usage</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Actual Monthly Rate</span>
                  <p className="font-semibold">{metrics.monthlyRateStr} USDFC</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Configured Max Rate</span>
                  <p
                    className={`font-semibold ${metrics.isRateExceeded ? "text-amber-600 dark:text-amber-400" : ""}`}
                  >
                    {metrics.maxMonthlyRateStr} USDFC
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Actual Stored</span>
                  <p className="font-semibold">{metrics.totalStoredGiB.toFixed(2)} GiB</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Configured Capacity</span>
                  <p className="font-semibold">{config.storageCapacity} GiB</p>
                </div>
              </div>

              {metrics.isRateExceeded && (
                <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">
                      Rate exceeds configuration
                    </span>
                  </div>
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    onClick={handleMatchCurrentUsage}
                  >
                    <ArrowRight className="h-3 w-3 mr-1" />
                    Match Current Usage
                  </Button>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Storage Capacity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Storage Capacity</Label>
              <span className="text-sm font-medium">{capacity} GB</span>
            </div>
            <Slider
              value={[capacity]}
              onValueChange={([v]) => setCapacity(v)}
              min={25}
              max={1000}
              step={25}
            />
            <div className="flex flex-wrap gap-2">
              {CAPACITY_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={capacity === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCapacity(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Maximum storage capacity for cost calculations
            </p>
          </div>

          <Separator />

          {/* Persistence Period */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Persistence Period</Label>
              <span className="text-sm font-medium">{period} days</span>
            </div>
            <Input
              type="number"
              min={MIN_PERSISTENCE_DAYS}
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value) || MIN_PERSISTENCE_DAYS)}
            />
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant={period === preset.days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              How long you plan to store data (affects deposit calculations)
            </p>
          </div>

          <Separator />

          {/* Low Balance Warning */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Low Balance Warning</Label>
              <span className="text-sm font-medium">{threshold} days</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={7}
              max={90}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              Show warning when balance drops below this many days of coverage
            </p>
          </div>

          <Separator />

          {/* Cost Preview */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-3">
            <h4 className="font-medium text-sm">Estimated Costs for New Configuration</h4>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : costPreview ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Rate</span>
                  <span className="font-medium">{costPreview.monthlyRateStr} USDFC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total ({period} days)</span>
                  <span className="font-medium">{costPreview.periodCostStr} USDFC</span>
                </div>
                {costPreview.isMinimumApplied && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Minimum fee applied (under {metrics.minFeeCapacityGiB} GB threshold)
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Connect wallet to see pricing</p>
            )}
          </div>

          {/* Deposit Indicator */}
          {!isLoading && costPreview && (
            <div
              className={`p-4 rounded-lg border ${
                costPreview.isAboveThreshold
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {costPreview.isAboveThreshold ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                ) : (
                  <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4
                    className={`font-medium text-sm ${
                      costPreview.isAboveThreshold
                        ? "text-green-700 dark:text-green-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {costPreview.isAboveThreshold
                      ? "Balance Above Warning Threshold"
                      : "Balance Below Warning Threshold"}
                  </h4>
                  <p
                    className={`text-sm mt-1 ${
                      costPreview.isAboveThreshold
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {costPreview.isAboveThreshold
                      ? `Your current balance covers ${costPreview.coverageDays} days (${threshold}-day warning threshold)`
                      : `Need ${costPreview.depositNeeded.toFixed(4)} USDFC to reach ${threshold}-day warning threshold`}
                  </p>
                  {!costPreview.isAboveThreshold && costPreview.coverageDays > 0 && (
                    <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
                      Current balance covers {costPreview.coverageDays} days at this configuration
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" type="button" onClick={handleReset} className="sm:mr-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
