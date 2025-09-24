"use client";

import { formatUnits } from "viem";
import { config } from "@/config";

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
  if (isLoading || !balances) return null;

  // Success state
  if (balances.isSufficient) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <p className="text-green-800">
          ✅ Your storage balance is sufficient for {config.storageCapacity}GB
          of storage for {balances.persistenceDaysLeft?.toFixed(5)} days.
        </p>
      </div>
    );
  }

  const depositNeeded = Number(formatUnits(balances?.depositNeeded ?? 0n, 18)).toFixed(5);

  // Missing tokens
  if (balances.filBalance === 0n || balances.usdfcBalance === 0n) {
    return (
      <div className="space-y-4">
        {balances.filBalance === 0n && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800">
              ⚠️ You need FIL tokens to pay for transaction fees. Please
              deposit FIL tokens to your wallet.
            </p>
          </div>
        )}
        {balances.usdfcBalance === 0n && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800">
              ⚠️ You need USDFC tokens to pay for storage. Please deposit USDFC
              tokens to your wallet.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Rate sufficient, need lockup increase
  if (balances.isRateSufficient && !balances.isLockupSufficient) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ Deposit {depositNeeded} USDFC to extend storage.
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
          label="Deposit & Increase Lockup"
        />
      </div>
    );
  }

  // Lockup sufficient, need rate increase
  if (!balances.isRateSufficient && balances.isLockupSufficient) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ Increase rate allowance for more storage.
          </p>
        </div>
        <PaymentButton
          onClick={async () => {
            await onPayment({
              lockupAllowance: balances.currentLockupAllowance!,
              epochRateAllowance: balances.rateNeeded!,
              depositAmount: 0n,
            });
            await onRefreshBalances();
          }}
          isProcessing={isProcessingPayment}
          label="Increase Rate"
        />
      </div>
    );
  }

  // Both insufficient
  if (!balances.isRateSufficient && !balances.isLockupSufficient) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-800">
            ⚠️ Insufficient storage balance. Deposit {depositNeeded} USDFC and increase rate allowance.
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
  }

  return null;
};

interface PaymentButtonProps {
  onClick: () => Promise<void>;
  isProcessing: boolean;
  label: string;
}

const PaymentButton = ({ onClick, isProcessing, label }: PaymentButtonProps) => (
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