import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount, useConfig as useWagmiConfig, useWalletClient } from "wagmi";
import * as Payments from "@filoz/synapse-core/pay";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useConfig } from "@/providers/ConfigProvider";

export const useWithdraw = (ignoreConfetti = false) => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { address } = useAccount();
  const wagmiConfig = useWagmiConfig();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const { data: client } = useWalletClient();
  const mutation = useMutation({
    mutationKey: ["withdraw", address],
    mutationFn: async ({ amount }: { amount: bigint }) => {
      if (!client) throw new Error("Wallet client not found");

      setStatus("💰 Withdrawing your funds...");
      const hash = await Payments.withdraw(client, {
        amount,
        address: address,
      });
      await waitForTransactionReceipt(wagmiConfig, {
        hash: hash,
      });
      setStatus(`💰 Withdrawal transaction submitted: ${hash}`);
      return
    },
    onSuccess: () => {
      setStatus("✅ Withdrawal was successful!");
      if (!ignoreConfetti) {
        triggerConfetti();
      }
      queryClient.invalidateQueries({
        queryKey: ["balances", address, config],
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
