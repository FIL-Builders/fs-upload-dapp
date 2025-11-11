"use client";

import { formatUnits } from "viem";
import { useConfig } from "@/providers/ConfigProvider";
import { UseBalancesResponse } from "@/types";

interface PaymentPayload {
  amount: bigint;
}

interface PaymentActionsProps {
  balances: UseBalancesResponse;
  isLoading?: boolean;
  isProcessingPayment?: boolean;
  isProcessingWithdraw?: boolean;
  onWithdraw: () => Promise<void>;
  onPayment: () => Promise<void>;
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
  onWithdraw,
  isProcessingWithdraw = false,
}: PaymentActionsProps) => {
  const { config } = useConfig();
  const canWithdraw = (balances.availableToFreeUp ?? 0n) > 0n;
  if (isLoading || !balances) return null;

  // Success state - no deposit needed and meets minimum threshold
  if (balances.isSufficient) {
    const daysLeft = balances.daysLeft ?? 0;
    const showThresholdWarning =
      daysLeft < config.minDaysThreshold && daysLeft > 0;

    if (showThresholdWarning) {
      return (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ Low balance: {daysLeft.toFixed(1)} days left (target:{" "}
            {config.minDaysThreshold}d). Capacity {config.storageCapacity} GB •
            Plan {config.persistencePeriod} days
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Consider depositing more USDFC to extend persistence.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800">
            ✅ All set. Capacity {config.storageCapacity} GB • Days left{" "}
            {daysLeft.toFixed(1)} • Plan {config.persistencePeriod} days
          </p>
        </div>
        {canWithdraw && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 gap-2 flex flex-col">
            <p className="text-green-800">
              ✅ You have {balances.availableToFreeUpFormatted} USDFC available
              to withdraw while keeping your storage active
            </p>
            <PaymentButton
              onClick={async () => {
                await onWithdraw();
              }}
              isProcessing={isProcessingWithdraw}
              label="Withdraw"
            />
          </div>
        )}
      </div>
    );
  }

  const depositNeeded = Number(
    formatUnits(balances?.depositNeeded ?? 0n, 18)
  ).toFixed(5);
  const needsDeposit = (balances.depositNeeded ?? 0n) > 0n;

  console.log("balances.depositNeeded", balances.depositNeeded);
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
          {needsDeposit && (
            <li>
              Deposit {depositNeeded} USDFC to reach plan target you have set
              the notification period to {config.minDaysThreshold} days and days
              left based on your configured storage are{" "}
              {balances.daysLeft?.toFixed(1)} days you are paying for additional{" "}
              {(config.persistencePeriod - balances.daysLeft).toFixed(1)} days of storage.
            </li>
          )}
          {needsLockup && !needsDeposit && (
            <li>
              Increase allowances to meet {config.minDaysThreshold} day
              threshold (currently {balances.daysLeft?.toFixed(1)}d)
            </li>
          )}
          {needsRate && (
            <li>
              Increase rate allowance for {config.storageCapacity} GB capacity
            </li>
          )}
        </ul>
        <p className="text-xs text-red-700 mt-2">
          Target: {config.storageCapacity} GB • {config.persistencePeriod} days
          • Notification period: {config.minDaysThreshold} days
        </p>
      </div>
      <PaymentButton
        onClick={async () => {
          await onPayment();
        }}
        isProcessing={isProcessingPayment}
        label={
          needsDeposit
            ? "Deposit to reach plan target"
            : "Increase Allowances to reach plan target"
        }
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
    {isProcessing ? "Processing transaction..." : label}
  </button>
);
