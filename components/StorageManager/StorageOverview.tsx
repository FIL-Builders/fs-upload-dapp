"use client";

import { Tooltip } from "@/components/ui/Tooltip";

interface StorageOverviewProps {
  totalStorageGB: number;
  storageCapacityGB: number;
  totalDatasets: number;
  daysRemainingAtCurrentRate: number;
  daysRemaining: number;
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
  isLoading = false,
}: StorageOverviewProps) => {
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
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
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
            {daysRemainingAtCurrentRate.toFixed(1)} days
          </div>
          <div className="flex items-center gap-1">
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
                ⓘ
              </span>
            </Tooltip>
          </div>
        </div>

        <div className="p-2 sm:col-span-2 lg:col-span-1">
          <div className="text-xl sm:text-2xl font-bold">
            {daysRemaining.toFixed(1)} days
          </div>
          <div className="flex items-center gap-1">
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
                ⓘ
              </span>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};
