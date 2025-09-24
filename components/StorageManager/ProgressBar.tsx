"use client";

import { DecimalFormatter } from "@/utils/decimalUtils";

interface ProgressBarProps {
  current: number;
  max: number;
  label: string;
  variant?: "default" | "filecoin" | "success" | "warning";
  showPercentage?: boolean;
}

/**
 * 📊 Copy-Pastable Progress Bar Component
 *
 * Pure UI component for displaying progress with theme-aware styling.
 * Perfect for storage usage, completion rates, or any metric visualization.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   current={75}
 *   max={100}
 *   label="Storage Used"
 *   variant="success"
 * />
 * ```
 */
export const ProgressBar = ({
  current,
  max,
  label,
  variant = "default",
  showPercentage = true,
}: ProgressBarProps) => {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;

  // Ensure minimum visible width for small percentages but actual progress
  const displayWidth =
    current > 0 && percentage < 1 ? Math.max(percentage, 1) : percentage;

  // Smart formatting for percentage display
  const formattedPercentage = DecimalFormatter.formatPercentage(
    percentage / 100,
    { maxDecimals: 2, showZero: true }
  );

  const getVariantStyle = (variant: string) => {
    switch (variant) {
      case "filecoin":
        return { backgroundColor: "var(--primary)" };
      case "success":
        return { backgroundColor: "var(--success)" };
      case "warning":
        return { backgroundColor: "var(--warning)" };
      default:
        return { backgroundColor: "var(--muted-foreground)" };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
        {showPercentage && (
          <span className="font-medium">{formattedPercentage}</span>
        )}
      </div>
      <div
        className="w-full rounded-full h-3"
        style={{ backgroundColor: "var(--muted)" }}
      >
        <div
          className="h-3 rounded-full transition-all duration-300"
          style={{
            width: `${displayWidth}%`,
            ...getVariantStyle(variant || "default"),
          }}
        />
      </div>
      <div
        className="flex justify-between text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        <span>{current < 0.01 ? '< 0.01' : current.toFixed(2)}</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  );
};