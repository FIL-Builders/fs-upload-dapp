"use client";

import { formatUnits } from "viem";
import { useConfig } from "@/providers/ConfigProvider";

interface PaymentPayload {
  lockupAllowance: bigint;
  epochRateAllowance: bigint;
  depositAmount: bigint;
}

interface PaymentActionsProps {
  balances: {
    isSufficient?: boolean;
    isRateSufficient?: boolean;
    isLockupSufficient?: boolean;
    filBalance?: bigint;
    usdfcBalance?: bigint;
    depositNeeded?: bigint;
    totalLockupNeeded?: bigint;
    rateNeeded?: bigint;
    currentLockupAllowance?: bigint;
    persistenceDaysLeft?: number;
  } | null;
  isLoading?: boolean;
  isProcessingPayment?: boolean;
  onPayment: (payload: PaymentPayload) => Promise<void>;
  onRefreshBalances: () => Promise<any>;
}

/**
 * 💳 Copy-Pastable Payment Actions Component
 *
 * Handles all payment scenarios with clear user guidance.
 * Smart enough to guide users through different payment needs.
 *
 * @example
 * ```tsx
 * <PaymentActions
 *   balances={balances}
 *   isProcessingPayment={false}
 *   onPayment={handlePayment}
 *   onRefreshBalances={refetchBalances}
 * />
 * ```
 */
export const PaymentActions = ({
  balances,
  isLoading = false,
  isProcessingPayment = false,
  onPayment,
  onRefreshBalances,
}: PaymentActionsProps) => {
  const { config } = useConfig();
  if (isLoading || !balances) return null;

  // Success state
  if (balances.isSufficient) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800">
          ✅ All set. Capacity {config.storageCapacity} GB • Days left{" "}
          {balances.persistenceDaysLeft?.toFixed(1)} • Plan{" "}
          {config.persistencePeriod} days{config.withCDN ? " • CDN On" : ""}.
        </p>
      </div>
    );
  }

  const depositNeeded = Number(
    formatUnits(balances?.depositNeeded ?? 0n, 18)
  ).toFixed(5);
  const needsDeposit = (balances.depositNeeded ?? 0n) > 0n;
  const needsLockup = !balances.isLockupSufficient;
  const needsRate = !balances.isRateSufficient;

  // Missing tokens
  if (balances.filBalance === 0n || balances.usdfcBalance === 0n) {
    return (
      <div className="space-y-4">
        {balances.filBalance === 0n && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800">⚠️ Add FIL for network fees.</p>
          </div>
        )}
        {balances.usdfcBalance === 0n && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800">⚠️ Add USDFC for storage payments.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-800">⚠️ Action needed</p>
        <ul className="text-red-800 list-disc pl-5 mt-1 space-y-1">
          {needsDeposit && <li>Deposit {depositNeeded} USDFC</li>}
          {needsLockup && (
            <li>
              Extend lockup to ≥ {config.minDaysThreshold} days (have{" "}
              {balances.persistenceDaysLeft?.toFixed(1)}d)
            </li>
          )}
          {needsRate && (
            <li>Increase capacity to {config.storageCapacity} GB</li>
          )}
        </ul>
        <p className="text-xs text-red-700 mt-2">
          Target: {config.storageCapacity} GB • Plan {config.persistencePeriod}{" "}
          days • CDN {config.withCDN ? "On" : "Off"}
        </p>
      </div>
      <PaymentButton
        onClick={async () => {
          await onPayment({
            lockupAllowance: balances.totalLockupNeeded!,
            epochRateAllowance: balances.rateNeeded!,
            depositAmount: balances.depositNeeded!,
          });
          await onRefreshBalances();
        }}
        isProcessing={isProcessingPayment}
        label="Deposit & Increase Allowances"
      />
    </div>
  );
};

interface PaymentButtonProps {
  onClick: () => Promise<void>;
  isProcessing: boolean;
  label: string;
}

const PaymentButton = ({
  onClick,
  isProcessing,
  label,
}: PaymentButtonProps) => (
  <button
    onClick={onClick}
    disabled={isProcessing}
    className={`w-full px-6 py-3 rounded-lg border-2 border-black transition-all ${
      isProcessing
        ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-black text-white hover:bg-white hover:text-black"
    }`}
  >
    {isProcessing ? "Processing transactions..." : label}
  </button>
);
