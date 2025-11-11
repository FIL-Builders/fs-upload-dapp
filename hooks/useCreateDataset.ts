import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { PDPAuthHelper, PDPServer, Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "./useEthers";
import { usePayment } from "@/hooks/usePayment";
import { CDN_DATA_SET_CREATION_COST } from "@/utils/constants";
import { waitForTransactionReceipt } from "viem/actions"
import { usePublicClient } from "wagmi";
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
  const { address, chainId } = useAccount();
  const signer = useEthersSigner();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { mutation: paymentMutation } = usePayment(true);
  const mutation = useMutation({
    mutationKey: ["createDataset", address],
    mutationFn: async ({
      withCDN,
      providerId,
    }: {
      withCDN: boolean;
      providerId: number | undefined;
    }) => {
      // === VALIDATION AND INITIALIZATION ===
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");
      if (!publicClient) throw new Error("Public client not found");
      // Reset state for new upload
      setProgress(0);
      setStatus("🔄 Initializing dataset creation...");

      // === SYNAPSE SDK INITIALIZATION ===
      // Create Synapse instance with user's configuration settings
      const synapse = await Synapse.create({
        signer,
      });

      if (withCDN) {
        setStatus("💰 Paying for cdn dataset egress credits...");
        setProgress(10);
        await paymentMutation.mutateAsync({
          depositAmount: CDN_DATA_SET_CREATION_COST,
        });
      }

      setStatus("🔗 Initializing dataset creation...");

      // Create storage service with comprehensive callback system for progress tracking
      const storageContext = await synapse.storage.createContext({
        providerId: providerId,
        forceCreateDataSet: true, // Force new dataset creation (don't reuse existing)
        withCDN: withCDN,
        callbacks: {
          // Called when dataset is found or created
          onDataSetResolved: (info) => {
            if (info.isExisting) {
              setStatus(`🔗 Existing dataset ${info.dataSetId} found and resolved`);
              setProgress(80);
            } else {
              setStatus(`⛓️ Created new dataset ${info.dataSetId}`);
              setProgress(80);
            }
          },
          // Called when storage provider is selected for the upload
          onProviderSelected: (provider) => {
            console.log("Storage provider selected:", provider);
            setStatus(`🏪 Storage provider selected`);
          },
        },
      });

      const authHelper = new PDPAuthHelper(synapse.getWarmStorageAddress(), signer, BigInt(chainId ?? 0));
      const pdpServer = new PDPServer(authHelper, storageContext.provider.products.PDP!.data.serviceURL);
      // Random bigint
      const clientDataSetId = BigInt(Math.floor(Math.random() * 1000000));
      // Verify provider is active
      try {
        await pdpServer.ping();
      } catch (error) {
        throw new Error(`Provider is not active: ${error}`);
      }

      const metadata = Object.entries(storageContext.dataSetMetadata).map(([key, value]) => ({
        key,
        value,
      }));

      if (withCDN) {
        metadata.push({
          key: "withCDN",
          value: "",
        });
      }

      // Create a data set
      const createResult = await pdpServer.createDataSet(
        clientDataSetId,
        storageContext.provider.payee,
        address,
        metadata,
        synapse.getWarmStorageAddress()
      );

      await waitForTransactionReceipt(publicClient, { hash: createResult.txHash as `0x${string}` });
    },
    onSuccess: () => {
      setStatus("🎉 Dataset successfully created!");
      setProgress(100);
      triggerConfetti();
      // Invalidate datasets query to trigger refetch and update UI with new dataset
      queryClient.invalidateQueries({
        queryKey: ["datasets", address],
      });
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
