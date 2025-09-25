import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { TOKENS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { DATA_SET_CREATION_FEE } from "@/utils";
import { useAccount } from "wagmi";
import { config } from "@/config";
import { useSynapse } from "@/providers/SynapseProvider";

/**
 * Hook to handle payment for storage
 * @param lockup - The lockup amount to be used for the storage
 * @param epochRate - The epoch rate to be used for the storage
 * @param depositAmount - The deposit amount to be used for the storage
 * @notice LockUp is the accoumulated amount of USDFC that the user has locked up for Storing data over time.
 * It is different from the depositAmount. Which is the amount needed to pay for more storage if required.
 * @returns Mutation and status
 */
export const usePayment = () => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { address } = useAccount();
  const { synapse, warmStorageService } = useSynapse();
  const mutation = useMutation({
    mutationKey: ["payment", address],
    mutationFn: async ({
      lockupAllowance,
      epochRateAllowance,
      depositAmount,
    }: {
      lockupAllowance: bigint;
      epochRateAllowance: bigint;
      depositAmount: bigint;
    }) => {
      if (!address) throw new Error("Address not found");
      if (!synapse) throw new Error("Synapse not found");
      if (!warmStorageService)
        throw new Error("Warm storage service not found");
      setStatus("🔄 Preparing transaction...");

      const paymentsAddress = synapse.getPaymentsAddress();

      const dataset = (
        await warmStorageService.getClientDataSetsWithDetails(address)
      ).filter((dataset) => dataset.withCDN === config.withCDN);

      const hasDataset = dataset.length > 0;

      const fee = hasDataset ? 0n : DATA_SET_CREATION_FEE;

      const amount = depositAmount + fee;

      const allowance = await synapse.payments.allowance(
        paymentsAddress,
        TOKENS.USDFC
      );

      const balance = await synapse.payments.walletBalance(TOKENS.USDFC);

      if (balance < amount) {
        throw new Error("Insufficient USDFC balance");
      }

      if (allowance < amount) {
        setStatus("💰 Approving USDFC to cover storage costs...");
        const transaction = await synapse.payments.approve(
          paymentsAddress,
          amount,
          TOKENS.USDFC
        );
        await transaction.wait(1);
        setStatus("💰 Successfully approved USDFC to cover storage costs");
      }
      if (amount > 0n) {
        setStatus("💰 Depositing USDFC to cover storage costs...");
        const transaction = await synapse.payments.deposit(amount);
        await transaction.wait(1);
        setStatus("💰 Successfully deposited USDFC to cover storage costs");
      }

      setStatus(
        "💰 Approving Filecoin Warm Storage service USDFC spending rates..."
      );
      const transaction = await synapse.payments.approveService(
        synapse.getWarmStorageAddress(),
        epochRateAllowance,
        lockupAllowance + fee,
        TIME_CONSTANTS.EPOCHS_PER_DAY * BigInt(config.persistencePeriod)
      );
      await transaction.wait();
      setStatus(
        "💰 Successfully approved Filecoin Warm Storage spending rates"
      );
    },
    onSuccess: () => {
      setStatus("✅ Payment was successful!");
      triggerConfetti();
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
