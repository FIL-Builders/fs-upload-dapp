"use client";

import { Tooltip } from "@/components/ui/Tooltip";

interface BalanceCardProps {
  label: string;
  value: string;
  tooltip: string;
  currency: string;
}

interface WalletBalancesProps {
  balances: {
    filBalanceFormatted?: number;
    usdfcBalanceFormatted?: number;
    warmStorageBalanceFormatted?: number;
    rateAllowanceFormatted?: number;
    lockupAllowanceFormatted?: number;
  } | null;
  isLoading?: boolean;
}

/**
 * 💰 Copy-Pastable Wallet Balances Grid
 *
 * Clean balance display with helpful tooltips.
 * Each balance explains what it's used for.
 *
 * @example
 * ```tsx
 * <WalletBalances
 *   balances={{
 *     filBalanceFormatted: 10.5,
 *     usdfcBalanceFormatted: 100.0,
 *     warmStorageBalanceFormatted: 50.0,
 *     rateAllowanceFormatted: 5.0,
 *     lockupAllowanceFormatted: 30.0
 *   }}
 * />
 * ```
 */
export const WalletBalances = ({
  balances,
  isLoading = false,
}: WalletBalancesProps) => {
  const BalanceCard = ({
    label,
    value,
    tooltip,
    currency,
  }: BalanceCardProps) => (
    <div
      className="p-3 rounded-lg border"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-center gap-1">
        <div
          className="text-xs font-medium mb-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {label}
        </div>
        <Tooltip content={tooltip}>
          <span
            className="cursor-help"
            style={{ color: "var(--muted-foreground)" }}
          >
            ⓘ
          </span>
        </Tooltip>
      </div>
      <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
        {value} {currency}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--border)",
        }}
      >
        <h4 className="text-base font-semibold mb-4">💰 Wallet Balances</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border animate-pulse"
              style={{
                backgroundColor: "var(--muted)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="h-4 rounded mb-2"
                style={{ backgroundColor: "var(--muted-foreground)" }}
              ></div>
              <div
                className="h-3 rounded w-2/3"
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
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      <h4 className="text-base font-semibold mb-4">💰 Wallet Balances</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <BalanceCard
          label="FIL Balance"
          value={balances?.filBalanceFormatted?.toFixed(5) || "0"}
          currency="FIL"
          tooltip="Your FIL (Filecoin) balance used for transaction fees and gas costs on the Filecoin network."
        />

        <BalanceCard
          label="USDFC Balance"
          value={balances?.usdfcBalanceFormatted?.toFixed(5) || "0"}
          currency="USDFC"
          tooltip="Your USDFC (Filecoin USD Stablecoin) balance available for storage payments and deposits. This is used to pay for storage services."
        />

        <BalanceCard
          label="Storage Balance"
          value={balances?.warmStorageBalanceFormatted?.toFixed(5) || "0"}
          currency="USDFC"
          tooltip="The amount of USDFC deposited into the storage service on your behalf. This balance is actively used for ongoing storage costs and remains locked in the service contract."
        />
      </div>
    </div>
  );
};
