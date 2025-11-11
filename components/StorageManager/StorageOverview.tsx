"use client";

import { useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { InfoIcon, DollarSign } from "lucide-react";
import { StorageCostsModal } from "@/components/ui/StorageCostsModal";
import { Button } from "@/components/ui/Button";

interface StorageOverviewProps {
  totalStorageGB: number;
  storageCapacityGB: number;
  totalDatasets: number;
  daysRemainingAtCurrentRate: number;
  daysRemaining: number;
  monthlyCost: number;
  maxMonthlyRateFormatted: number;
  isLoading?: boolean;
}

/**
 * 📈 Copy-Pastable Storage Overview Card
 *
 * Quick stats overview for storage metrics.
 * Perfect dashboard summary component.
 *
 * @example
 * ```tsx
 * <StorageOverview
 *   totalStorageGB={15.75}
 *   totalDatasets={3}
 *   daysRemaining={45.2}
 * />
 * ```
 */
export const StorageOverview = ({
  totalStorageGB,
  storageCapacityGB,
  totalDatasets,
  daysRemainingAtCurrentRate,
  daysRemaining,
  monthlyCost,
  maxMonthlyRateFormatted,
  isLoading = false,
}: StorageOverviewProps) => {
  const [showCostsModal, setShowCostsModal] = useState(false);

  if (isLoading) {
    return (
      <div
        className="p-4 rounded-lg border animate-pulse"
        style={{
          backgroundColor: "var(--muted)",
          borderColor: "var(--border)",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-2 text-center">
              <div
                className="h-8 rounded mb-2"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              ></div>
              <div
                className="h-4 rounded"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: "var(--muted)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header with title and costs button */}
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Storage Overview
          </h2>
          <Button
            onClick={() => setShowCostsModal(true)}
            variant="secondary"
            className="flex items-center gap-2 text-sm px-3 py-1.5"
          >
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">How Costs Work</span>
            <span className="sm:hidden">Costs</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="p-2">
            <div className="text-xl sm:text-2xl font-bold">
              {`${totalStorageGB.toFixed(2)}/${storageCapacityGB.toFixed(0)} GB`}
            </div>
            <div
              className="text-xs sm:text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Total Storage Used
            </div>
          </div>

          <div className="p-2">
            <div className="text-xl sm:text-2xl font-bold">{totalDatasets}</div>
            <div
              className="text-xs sm:text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Total Datasets
            </div>
          </div>

          <div className="p-2 sm:col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold">
              {daysRemainingAtCurrentRate?.toFixed(1)} days
            </div>
            <div className="flex items-center justify-center gap-1">
              <div
                className="text-xs sm:text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Days Left (Current Rate)
              </div>
              <Tooltip
                content="Days remaining based on current storage usage patterns"
                position="top"
              >
                <span
                  className="cursor-help"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <InfoIcon className="w-4 h-4" />
                </span>
              </Tooltip>
            </div>
          </div>

          <div className="p-2 sm:col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold">
              {daysRemaining.toFixed(1)} days
            </div>
            <div className="flex items-center justify-center gap-1">
              <div
                className="text-xs sm:text-sm"
                style={{ color: "var(--muted-foreground)" }}
              >
                Days Left (Max Capacity)
              </div>
              <Tooltip
                content="Days remaining if using maximum configured paid storage capacity"
                position="top"
              >
                <span
                  className="cursor-help"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <InfoIcon className="w-4 h-4" />
                </span>
              </Tooltip>
            </div>
          </div>

          <div className="p-2 sm:col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold">
              {monthlyCost} USDFC
            </div>
            <div
              className="text-xs sm:text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Monthly Cost
            </div>
          </div>

          <div className="p-2 sm:col-span-2 lg:col-span-1">
            <div className="text-xl sm:text-2xl font-bold">
              {maxMonthlyRateFormatted} USDFC
            </div>
            <div
              className="text-xs sm:text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Monthly Cost (Max Capacity)
            </div>
          </div>
        </div>
      </div>

      <StorageCostsModal
        isOpen={showCostsModal}
        onClose={() => setShowCostsModal(false)}
      />
    </>
  );
};
