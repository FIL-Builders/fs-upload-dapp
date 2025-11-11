import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useConfig } from "@/providers/ConfigProvider";
import { usePayment } from "@/hooks/usePayment";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";

export type UploadedInfo = {
  fileName?: string;
  fileSize?: number;
  pieceCid?: string;
  txHash?: string;
};

/**
 * Hook for uploading files to Filecoin with automatic payment handling and progress tracking.
 * Workflow: File processing → validation → payment → dataset creation → provider upload → piece confirmation.
 * Progress stages: 5% validation, 25% dataset setup, 55% upload, 80% piece added, 100% confirmed.
 *
 * @returns Mutation object with progress (0-100), status message, uploaded info, and reset function
 *
 * @example
 * ```tsx
 * const { uploadFileMutation, progress, status } = useFileUpload();
 * await uploadFileMutation.mutateAsync({ file, datasetId, withCDN: true });
 * ```
 */
export const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);
  const { triggerConfetti } = useConfetti();
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { config } = useConfig();
  const { mutation: paymentMutation } = usePayment(true);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["upload", address],
    mutationFn: async ({
      file,
      datasetId,
      withCDN,
    }: {
      file: File;
      datasetId?: string;
      withCDN?: boolean;
    }) => {
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      setProgress(0);
      setUploadedInfo(null);
      setStatus("🔄 Initializing file upload to Filecoin...");

      // Convert File to Uint8Array for Synapse SDK compatibility
      const arrayBuffer = await file.arrayBuffer();
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      const synapse = await Synapse.create({ signer, withCDN });

      // Validate user has sufficient USDFC for storage
      setStatus(
        "💰 Checking if you have enough USDFC to cover the storage costs..."
      );
      setProgress(5);

      const { isSufficient, depositNeeded } =
        await calculateStorageMetrics(synapse, config, file.size);

      // Automatically top up storage allowances if insufficient
      if (!isSufficient) {
        setStatus(
          "💰 Insufficient storage balance, setting up your storage configuration..."
        );
        await paymentMutation.mutateAsync({
          depositAmount: depositNeeded,
        });
        setStatus("💰 Storage configuration setup complete");
      }

      setStatus("🔗 Setting up storage service and dataset...");
      setProgress(25);

      // Progress callbacks track dataset creation and provider selection
      const storageService = await synapse.storage.createContext({
        dataSetId: datasetId ? parseInt(datasetId) : undefined,
        callbacks: {
          onDataSetResolved: (info) => {
            console.log("Dataset resolved:", info);
            setStatus("🔗 Existing dataset found and resolved");
            setProgress(30);
          },
          onProviderSelected: (provider) => {
            console.log("Storage provider selected:", provider);
            setStatus(`🏪 Storage provider selected`);
          },
        },
      });
      setStatus("📁 Uploading file to storage provider...");
      setProgress(55);

      // Upload with callbacks tracking completion, piece addition, and confirmation
      const { pieceCid } = await storageService.upload(uint8ArrayBytes, {
        metadata: { fileName: file.name, fileSize: file.size.toString() },
        onUploadComplete: (piece) => {
          setStatus(
            `📊 File uploaded! Signing msg to add pieces to the dataset`
          );
          setUploadedInfo((prev) => ({
            ...prev,
            fileName: file.name,
            fileSize: file.size,
            pieceCid: piece.toV1().toString(),
          }));
          setProgress(80);
        },
        onPieceAdded: (hash) => {
          setStatus(
            `🔄 Waiting for transaction to be confirmed on chain (txHash: ${hash})`
          );
          setUploadedInfo((prev) => ({
            ...prev,
            txHash: hash,
          }));
        },
        onPieceConfirmed: () => {
          setStatus("🌳 Data pieces added to dataset successfully");
          setProgress(90);
        },
      });

      setProgress(95);
      setUploadedInfo((prev) => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        pieceCid: pieceCid.toV1().toString(),
      }));
    },
    onSuccess: () => {
      setStatus("🎉 File successfully stored on Filecoin!");
      setProgress(100);
      triggerConfetti();
      queryClient.invalidateQueries({
        queryKey: ["balances", address, config],
      });
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

  /** Resets upload state for new upload */
  const handleReset = () => {
    setProgress(0);
    setUploadedInfo(null);
    setStatus("");
  };

  return {
    uploadFileMutation: mutation,
    progress,
    uploadedInfo,
    handleReset,
    status,
  };
};
