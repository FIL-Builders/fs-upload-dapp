import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";

export function usePayment() {
  const signer = useEthersSigner();
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const mutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!signer) throw new Error("Signer not found");
      setStatus("Preparing transaction...");
      // 1) Create Synapse instance
      const synapse = await Synapse.create({ signer });
      // 2) Get decimals for USDFC
      const decimals: number = synapse.decimals(Synapse.USDFC);
      // 3) Parse amount to base units (bigint)
      const amt = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
      setStatus("Executing transaction...");
      // 4) Deposit USDFC
      const tx = await synapse.deposit(amt);
      // 5) Return transaction hash
      return tx;
    },
    onSuccess: () => {
      setStatus("✅ Payment successful!");
      triggerConfetti();
    },
    onError: (error) => {
      setStatus(
        `❌ ${error.message || "Transaction failed. Please try again."}`
      );
    },
  });
  return { mutation, status };
}
