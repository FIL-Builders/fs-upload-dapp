"use client";

import { Tooltip } from "@/components/ui/Tooltip";

interface StorageCardProps {
  title: string;
  icon: string;
  tooltipText: string;
  usageGB: number;
  isLoading?: boolean;
  variant?: "cdn" | "standard";
  showProgressBar?: boolean;
}

/**
 * 📦 Copy-Pastable Storage Display Card
 *
 * Clean, self-contained storage display component.
 * Shows usage with visual feedback and helpful tooltips.
 *
 * @example
 * ```tsx
 * <StorageCard
 *   title="Fast Storage (CDN)"
 *   icon="⚡"
 *   tooltipText="Global fast delivery storage"
 *   usageGB={2.5}
 *   variant="cdn"
 * />
 * ```
 */
export const StorageCard = ({
  title,
  icon,
  tooltipText,
  usageGB,
  isLoading = false,
  variant = "standard",
  showProgressBar = true,
}: StorageCardProps) => {
  if (isLoading) {
    return (
      <div
        className="p-4 rounded-lg border animate-pulse"
        style={{
          backgroundColor: "var(--muted)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="h-4 rounded w-1/4 mb-3"
          style={{ backgroundColor: "var(--muted-foreground)" }}
        ></div>
        <div
          className="h-3 rounded w-full mb-2"
          style={{ backgroundColor: "var(--muted-foreground)" }}
        ></div>
        <div
          className="h-3 rounded w-3/4"
          style={{ backgroundColor: "var(--muted-foreground)" }}
        ></div>
      </div>
    );
  }

  const hasData = usageGB > 0;
  const progressColor = variant === "cdn" ? "var(--primary)" : "var(--muted-foreground)";
  const statusIcon = variant === "cdn" ? "🌍" : "📦";
  const statusText = variant === "cdn" ? "Global fast delivery active" : "Regular access speed";

  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h4 className="text-sm font-semibold">{icon} {title}</h4>
        <Tooltip content={tooltipText}>
          <span
            className="cursor-help"
            style={{ color: "var(--muted-foreground)" }}
          >
            ⓘ
          </span>
        </Tooltip>
      </div>

      {hasData ? (
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {usageGB.toFixed(5)} GB
            </div>
            <div
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Currently Using
            </div>
          </div>

          {showProgressBar && (
            <div
              className="w-full rounded-full h-2"
              style={{ backgroundColor: "var(--muted)" }}
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: progressColor,
                  width: "100%"
                }}
              />
            </div>
          )}

          <div
            className="flex items-center justify-center gap-1 text-xs"
            style={{ color: progressColor }}
          >
            <span>{statusIcon}</span>
            <span>{statusText}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">{icon}</div>
          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No {variant} storage files yet
          </div>
          <div
            className="text-xs mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Upload files for {variant === "cdn" ? "global fast access" : "regular storage"}
          </div>
        </div>
      )}
    </div>
  );
};