import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount, useConfig as useWagmiConfig, useWalletClient } from "wagmi";
import * as Payments from "@filoz/synapse-core/pay";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfig } from "@/providers/ConfigProvider";

/**
 * Custom hook for handling storage payment transactions using EIP-2612 permit signatures
 *
 * @description
 * This hook manages the complex payment flow for Filecoin storage services. It uses EIP-2612 permit
 * signatures to authorize token transfers without requiring separate approval transactions, enabling
 * a seamless user experience. The payment process involves depositing USDFC tokens and setting up
 * storage allowances for rate-based consumption and lockup periods.
 *
 * @concept Storage Payment Architecture:
 * - **Deposit Amount**: USDFC tokens deposited into the payments contract for immediate use
 * - **Rate Allowance**: Per-epoch spending limit for ongoing storage costs (like a monthly budget)
 * - **Lockup Allowance**: Total USDFC that can be locked for long-term storage commitments
 * - **Persistence Period**: How many days the lockup amount should last
 *
 * @functionality
 * - Validates sufficient tUSDFC balance before processing
 * - Creates EIP-2612 permit signature for gasless token approval
 * - Calls `depositWithPermitAndApproveOperator` in a single transaction
 * - Sets up rate and lockup allowances for WarmStorage operator
 * - Provides real-time status updates during the transaction flow
 * - Triggers celebratory confetti on successful completion (optional)
 *
 * @param {boolean} ignoreConfetti - Whether to skip confetti animation on success (default: false)
 *
 * @returns {Object} Payment mutation and status
 * @returns {Object} mutation - TanStack Query mutation object with mutateAsync function
 * @returns {string} status - Human-readable status message for UI display
 *
 * @example
 * ```tsx
 * function StoragePayment() {
 *   const { mutation, status } = usePayment();
 *   const { mutateAsync: processPayment, isPending } = mutation;
 *
 *   const handlePayment = async () => {
 *     try {
 *       await processPayment({
 *         lockupAllowance: parseUnits("100", 18), // 100 USDFC lockup
 *         epochRateAllowance: parseUnits("0.1", 18), // 0.1 USDFC per epoch
 *         depositAmount: parseUnits("10", 18), // 10 USDFC deposit
 *       });
 *     } catch (error) {
 *       console.error("Payment failed:", error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handlePayment} disabled={isPending}>
 *         {isPending ? "Processing..." : "Pay for Storage"}
 *       </button>
 *       {status && <p>{status}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export const usePayment = (ignoreConfetti = false) => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { address, chainId } = useAccount();
  const wagmiConfig = useWagmiConfig();
  const queryClient = useQueryClient();
  const { config } = useConfig();
  const { data: client } = useWalletClient();
  const mutation = useMutation({
    mutationKey: ["payment", address],
    mutationFn: async ({
      amount,
    }: {
      amount: bigint;
    }) => {
      // === VALIDATION PHASE ===
      // Ensure all required dependencies are available before proceeding
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain id not found");
      if (!client) throw new Error("Public client not found");
      setStatus("💰 Setting up your storage configuration...");

      const tx = await Payments.depositAndApprove(client, {
        amount,
      });

      setStatus(`💰 Payment transaction submitted`);

      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
      });

      setStatus("💰 You successfully configured your storage");
      return;
    },
    onSuccess: () => {
      setStatus("✅ Payment was successful!");
      if (!ignoreConfetti) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({
        queryKey: ["balances", address, config],
      });
    },
    onError: (error) => {
      console.error("Payment failed:", error);
      setStatus(
        `❌ ${error.message || "Transaction failed. Please try again."}`
      );
    },
  });
  return { mutation, status };
};
