import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { TOKENS, TIME_CONSTANTS, Synapse } from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { useConfig } from "@/providers/ConfigProvider";
import { useEthersSigner } from "./useEthers";

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
 * - Validates sufficient USDFC balance before processing
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
  const signer = useEthersSigner();
  const { config } = useConfig();
  const mutation = useMutation({
    mutationKey: ["payment", address],
    mutationFn: async ({
      lockupAllowance,
      epochRateAllowance,
      depositAmount,
    }: {
      /** Total USDFC that can be locked for long-term storage commitments */
      lockupAllowance: bigint;
      /** Per-epoch spending limit for ongoing storage costs */
      epochRateAllowance: bigint;
      /** USDFC tokens to deposit into payments contract immediately */
      depositAmount: bigint;
    }) => {
      // === VALIDATION PHASE ===
      // Ensure all required dependencies are available before proceeding
      if (!address) throw new Error("Address not found");
      if (!signer) throw new Error("Signer not found");
      if (!chainId) throw new Error("Chain id not found");

      // === SYNAPSE INITIALIZATION ===
      // Create Synapse instance with user's configuration
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      // Get contract addresses from Synapse for the current network
      const warmStorageAddress = synapse.getWarmStorageAddress();

      // === BALANCE VALIDATION ===
      // Check if user has sufficient USDFC tokens for the deposit
      const amount = depositAmount;
      const balance = await synapse.payments.walletBalance(TOKENS.USDFC);

      if (balance < amount) {
        throw new Error("Insufficient USDFC balance");
      }

      setStatus("💰 Setting up your storage configuration...");

      const tx = await synapse.payments.depositWithPermitAndApproveOperator(
        amount,
        warmStorageAddress,
        epochRateAllowance,
        lockupAllowance,
        TIME_CONSTANTS.EPOCHS_PER_DAY * BigInt(config.persistencePeriod)
      );

      await tx.wait(1);

      setStatus("💰 You successfully configured your storage");
      return;
    },
    onSuccess: () => {
      setStatus("✅ Payment was successful!");
      if (!ignoreConfetti) {
        triggerConfetti();
      }
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
