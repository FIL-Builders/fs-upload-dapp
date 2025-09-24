"use client";

import { useAccount } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { usePayment } from "@/hooks/usePayment";
import { StorageCard } from "./StorageCard";
import { StorageOverview } from "./StorageOverview";
import { WalletBalances } from "./WalletBalances";
import { PaymentActions } from "./PaymentActions";

/**
 * 🚀 Simplified Storage Manager Component
 *
 * @example
 * ```tsx
 * // Use the full component
 * <StorageManager />
 *
 * // Or compose your own with individual components
 * <StorageOverview totalStorageGB={10} totalDatasets={3} daysRemaining={30} />
 * <StorageCard title="CDN Storage" icon="⚡" usageGB={5} variant="cdn" />
 * ```
 */
export const StorageManager = () => {
  const { isConnected } = useAccount();

  // Simplified data fetching
  const {
    data: balances,
    isLoading: isBalanceLoading,
    refetch: refetchBalances,
  } = useBalances();

  const { mutation: paymentMutation, status } = usePayment();
  const { mutateAsync: handlePayment, isPending: isProcessingPayment } =
    paymentMutation;

  if (!isConnected) return null;

  const isLoading = isBalanceLoading;

  return (
    <div
      className="p-6 rounded-lg border shadow-sm"
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header with Status */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Storage Manager</h2>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm h-9 flex items-center justify-center rounded-lg border-2 border-black transition-all bg-black text-white hover:bg-white hover:text-black"
              onClick={() => {
                window.open(
                  "https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc",
                  "_blank"
                );
              }}
            >
              Get tUSDFC
            </button>
            <button
              className="px-4 py-2 text-sm h-9 flex items-center justify-center rounded-lg border-2 border-black transition-all bg-black text-white hover:bg-white hover:text-black"
              onClick={() => {
                window.open(
                  "https://faucet.calibnet.chainsafe-fil.io/funds.html",
                  "_blank"
                );
              }}
            >
              Get tFIL
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Storage Details - Composable cards */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold border-b pb-2"
            style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
          >
            🔍 Storage Details
          </h3>

          {/* Quick Overview - Composable component */}
          <StorageOverview
            totalStorageGB={balances?.currentStorageGB || 0}
            storageCapacityGB={balances?.currentRateAllowanceGB || 0}
            totalDatasets={balances?.totalDatasets || 0}
            daysRemainingAtCurrentRate={
              balances?.persistenceDaysLeftAtCurrentRate || 0
            }
            daysRemaining={balances?.persistenceDaysLeft || 0}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <StorageCard
              title="Fast Storage (CDN)"
              icon="⚡"
              tooltipText="Premium storage with worldwide fast access. Best for frequently accessed files."
              usageGB={balances?.cdnUsedGiB || 0}
              variant="cdn"
              isLoading={isLoading}
            />

            <StorageCard
              title="Standard Storage"
              icon="💾"
              tooltipText="Regular storage with standard access speed. Cost-effective for most files."
              usageGB={balances?.nonCdnUsedGiB || 0}
              variant="standard"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Section 3: Account & Actions - Composable components */}
        <div className="space-y-4">
          <h3
            className="text-lg font-semibold border-b pb-2"
            style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
          >
            💰 Account & Actions
          </h3>

          <WalletBalances balances={balances} isLoading={isBalanceLoading} />

          <PaymentActions
            balances={balances}
            isLoading={isBalanceLoading}
            isProcessingPayment={isProcessingPayment}
            onPayment={handlePayment}
            onRefreshBalances={refetchBalances}
          />
        </div>

        {/* Status Messages */}
        {status && (
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: status.includes("❌")
                ? "#fef2f2"
                : status.includes("✅")
                ? "#f0fdf4"
                : "#eff6ff",
              borderColor: status.includes("❌")
                ? "#fecaca"
                : status.includes("✅")
                ? "#bbf7d0"
                : "#bfdbfe",
              color: status.includes("❌")
                ? "#dc2626"
                : status.includes("✅")
                ? "#16a34a"
                : "#2563eb",
            }}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
