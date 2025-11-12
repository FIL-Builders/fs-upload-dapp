import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { Synapse } from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { useConfig } from "@/providers/ConfigProvider";
import { useEthersSigner } from "./useEthers";

/**
 * Hook for withdrawing funds from the wallet.
 * Withdraws funds from the wallet using the Synapse SDK.
 * @param ignoreConfetti - Whether to ignore confetti animation
 * @returns Mutation object for withdrawing funds
 */
export const useWithdraw = (ignoreConfetti = false) => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { address, chainId } = useAccount();
  const signer = useEthersSigner();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["withdraw", address, chainId],
    mutationFn: async ({ amount }: { amount: bigint }) => {
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

      setStatus("💰 Withdrawing your funds...");
      const tx = await synapse.payments.withdraw(amount);
      await tx.wait(1);
      setStatus("💰 You successfully withdrew your funds");
      return;
    },
    onSuccess: () => {
      setStatus("✅ Withdrawal was successful!");
      if (!ignoreConfetti) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({
        queryKey: ["balances", address, config, chainId],
      });
    },
    onError: (error) => {
      console.error("Withdrawal failed:", error);
      setStatus(
        `❌ ${error.message || "Transaction failed. Please try again."}`
      );
    },
  });
  return { mutation, status };
};
