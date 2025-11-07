import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { usePayment } from "@/hooks/usePayment";
import { useCreateDataSet } from "@filoz/synapse-react";
import { PDPProvider } from "@filoz/synapse-core/warm-storage";
import { CDN_DATA_SET_CREATION_FEE } from "@/utils";
/**
 * Hook for creating new storage datasets on Filecoin.
 * Handles payment processing and dataset creation with progress tracking.
 * Progress stages: 10% payment, 45% creation started, 80% tx confirmed, 90% provider confirmed.
 *
 * @returns Mutation object with progress tracking and status
 *
 * @example
 * ```tsx
 * const { uploadFileMutation, progress, status } = useCreateDataset();
 * await uploadFileMutation.mutateAsync({ withCDN: true, providerId: undefined });
 * ```
 */
export const useCreateDataset = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const { triggerConfetti } = useConfetti();
  const { address } = useAccount();
  const { mutation: paymentMutation } = usePayment(true);
  const { mutateAsync: createDataSet } = useCreateDataSet({
    onHash: (hash) => {
      setStatus(`🔗 Dataset creation transaction submitted`);
      setProgress(70);
    },
  });
  const mutation = useMutation({
    mutationKey: ["createDataset", address],
    mutationFn: async ({
      withCDN,
      provider,
    }: {
      withCDN: boolean;
      provider: PDPProvider;
    }) => {
      // === VALIDATION AND INITIALIZATION ===
      if (!address) throw new Error("Address not found");

      // Reset state for new upload
      setProgress(0);
      setStatus("🔄 Initializing dataset creation...");


      if (withCDN) {
        setStatus("💰 Paying for cdn dataset egress credits...");
        setProgress(10);
        await paymentMutation.mutateAsync({
          amount: CDN_DATA_SET_CREATION_FEE,
        });
      }

      setStatus("🏗️ Creating new dataset on blockchain...");
      setProgress(45);

      await createDataSet({
        provider: provider,
        cdn: withCDN,
      });

    },
    onSuccess: () => {
      setStatus("🎉 Dataset successfully created!");
      setProgress(100);
      triggerConfetti();
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setStatus(`❌ Upload failed: ${error.message || "Please try again"}`);
      setProgress(0);
    },
  });

  const handleReset = () => {
    mutation.reset();
  };

  return {
    createDataSetMutation: mutation,
    progress,
    handleReset,
    status,
  };
};
