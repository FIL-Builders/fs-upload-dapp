"use client";

import { useAccount, useWatchAsset } from "wagmi";
import { usePayment } from "@/hooks/usePayment";
import { useWithdraw } from "@/hooks/useWithdraw";
import { StorageCard } from "./StorageCard";
import { StorageOverview } from "./StorageOverview";
import { WalletBalances } from "./WalletBalances";
import { PaymentActions } from "./PaymentActions";
import { UseBalancesResponse } from "@/types";
import { DataSetWithPieces } from "@filoz/synapse-react";
import { getDatasetsSizes } from "@/utils/storageCalculations";
/**
 * Comprehensive Storage Manager Component for Filecoin Storage Operations
 *
 * @description
 * The StorageManager is the main dashboard component for managing Filecoin storage.
 * It provides a unified interface for viewing storage metrics, managing balances,
 * and performing payment operations. The component is designed with a composable
 * architecture using smaller, focused components for maximum reusability.
 *
 * @functionality
 * - **Real-time Balance Monitoring**: Displays FIL, USDFC, and warm storage balances
 * - **Storage Overview**: Shows current storage usage, capacity, and persistence days
 * - **CDN vs Standard Storage**: Separate tracking for premium and standard storage
 * - **Payment Operations**: Integrated payment flow for storage top-ups
 * - **External Links**: Quick access to testnet faucets and token management
 * - **Status Updates**: Real-time feedback during payment processing
 *
 * @composition
 * Built using smaller, reusable components:
 * - `StorageOverview`: High-level storage statistics and summary
 * - `StorageCard`: Individual storage type display (CDN, Standard)
 * - `WalletBalances`: Token balance display and management
 * - `PaymentActions`: Payment processing interface
 *
 * @state
 * - Automatically manages connection state and data fetching
 * - Handles loading states gracefully across all sub-components
 * - Provides consistent error handling and user feedback
 *
 * @example
 * ```tsx
 * // Full component usage
 * function App() {
 *   return (
 *     <WagmiProvider>
 *       <StorageManager />
 *     </WagmiProvider>
 *   );
 * }
 *
 * // Composable usage with individual components
 * function CustomStorageDashboard() {
 *   const { data: balances } = useBalances();
 *
 *   return (
 *     <div>
 *       <StorageOverview
 *         totalStorageGB={balances?.currentStorageGB || 0}
 *         totalDatasets={balances?.totalDatasets || 0}
 *         daysRemaining={balances?.daysLeft || 0}
 *       />
 *       <StorageCard
 *         title="CDN Storage"
 *         icon="⚡"
 *         usageGB={balances?.cdnUsedGiB || 0}
 *         variant="cdn"
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @dependencies
 * - `useAccount`: Wallet connection state
 * - `useBalances`: Storage and wallet balance data
 * - `usePayment`: Payment processing functionality
 * - `useWatchAsset`: Token addition to wallet
 *
 * @accessibility
 * - Responsive design for mobile and desktop
 * - Proper ARIA labels and semantic HTML
 * - Keyboard navigation support
 * - High contrast color scheme compatibility
 */
export const StorageManager = ({
  balances,
  datasetsData,
  isBalanceLoading,
}: {
  balances: UseBalancesResponse;
  datasetsData: DataSetWithPieces[];
  isBalanceLoading: boolean;
}) => {
  const { isConnected } = useAccount();

  const addAsset = useWatchAsset();

  const handleAddAsset = async () => {
    addAsset.watchAsset({
      type: "ERC20",
      options: {
        address: "0xb3042734b608a1B16e9e86B374A3f3e389B4cDf0",
        symbol: "tUSDFC",
        decimals: 18,
      },
    });
  };

  const { mutation: withdrawMutation, status: withdrawStatus } = useWithdraw();

  const { mutation: paymentMutation, status } = usePayment();

  if (!isConnected) return null;

  const isLoading = isBalanceLoading;
  const datasetsSizes = getDatasetsSizes(datasetsData);
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
            <button
              className="px-4 py-2 text-sm h-9 flex items-center justify-center rounded-lg border-2 border-black transition-all bg-black text-white hover:bg-white hover:text-black"
              onClick={handleAddAsset}
            >
              Add tUSDFC
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
            totalStorageGB={datasetsSizes.sizeInGiB}
            storageCapacityGB={balances.totalConfiguredCapacity}
            totalDatasets={datasetsData.length}
            daysRemainingAtCurrentRate={balances.daysLeftAtCurrentRate}
            daysRemaining={balances.daysLeft}
            monthlyCost={balances.monthlyRateFormatted}
            maxMonthlyRateFormatted={balances.maxMonthlyRateFormatted}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <StorageCard
              title="Fast Storage (CDN)"
              icon="⚡"
              tooltipText="Premium storage with worldwide fast access. Best for frequently accessed files."
              usageGB={datasetsSizes.cdnSizeInGiB}
              variant="cdn"
              isLoading={isLoading}
            />

            <StorageCard
              title="Standard Storage"
              icon="💾"
              tooltipText="Regular storage with standard access speed. Cost-effective for most files."
              usageGB={datasetsSizes.nonCdnSizeInGiB}
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
            isProcessingPayment={paymentMutation.isPending}
            onPayment={async () => {
              await paymentMutation.mutateAsync({
                amount: balances.depositNeeded,
              });
            }}
            onWithdraw={async () => {
              await withdrawMutation.mutateAsync({
                amount: balances.availableToFreeUp,
              });
            }}
            isProcessingWithdraw={withdrawMutation.isPending}
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
