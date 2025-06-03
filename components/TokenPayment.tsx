// components/TokenPayment.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useBalances } from "@/hooks/useBalances";
import { usePayment } from "@/hooks/usePayment";

export function TokenPayment() {
  const { isConnected } = useAccount();

  const [amount, setAmount] = useState("10");

  const {
    data: balances,
    isLoading: isBalanceLoading,
    refetch: refetchBalances,
  } = useBalances();

  const { filBalance, usdfcBalance, paymentsBalance } = balances || {
    filBalance: 0,
    usdfcBalance: 0,
    paymentsBalance: 0,
  };

  const { mutation: paymentMutation, status } = usePayment();
  const { mutateAsync: handlePayment, isPending: isProcessingPayment } =
    paymentMutation;

  if (!isConnected) {
    return null;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-2">Deposit USDFC to Synapse</h3>
      <div className="flex flex-col gap-1 mb-4 text-sm text-gray-500">
        <div>
          <span className="font-medium">FIL wallet balance:</span>{" "}
          {isBalanceLoading
            ? "Loading..."
            : `${filBalance.toLocaleString()} FIL`}
        </div>
        <div>
          <span className="font-medium">USDFC wallet balance:</span>{" "}
          {isBalanceLoading
            ? "Loading..."
            : `${usdfcBalance.toLocaleString()} USDFC`}
        </div>
        <div>
          <span className="font-medium">USDFC in Synapse contract:</span>{" "}
          {isBalanceLoading
            ? "Loading..."
            : `${paymentsBalance.toLocaleString()} USDFC`}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || parseFloat(value) >= 0) {
              setAmount(value);
            }
          }}
          placeholder="Amount"
          className="border rounded px-3 py-2 flex-grow"
          min="0"
          step="0.01"
          disabled={isProcessingPayment}
        />
        <button
          onClick={async () => {
            await handlePayment(amount);
            await refetchBalances();
          }}
          disabled={isProcessingPayment || !amount || parseFloat(amount) <= 0}
          className={`px-6 py-2 rounded-[20px] border-2 border-black transition-all ${
            isProcessingPayment || !amount || parseFloat(amount) <= 0
              ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-white hover:text-black"
          }`}
        >
          {isProcessingPayment ? "Processing..." : "Deposit"}
        </button>
      </div>
      {status && (
        <p
          className={`mt-2 text-sm ${
            status.includes("❌")
              ? "text-red-500"
              : status.includes("✅")
                ? "text-green-500"
                : "text-gray-500"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}
