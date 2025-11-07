import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount, usePublicClient } from "wagmi";
import { useConfig } from "@/providers/ConfigProvider";
import { usePayment } from "@/hooks/usePayment";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";
import { useUpload } from "@filoz/synapse-react";
import * as Piece from "@filoz/synapse-core/piece";
import * as Payments from "@filoz/synapse-core/pay";
import * as WarmStorage from "@filoz/synapse-core/warm-storage";

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
  const { address, chainId } = useAccount();
  const { config } = useConfig();
  const { mutation: paymentMutation } = usePayment(true);
  const client = usePublicClient();
  const { mutateAsync: upload } = useUpload({
    onHash: (hash) => {
      setUploadedInfo((prev) => ({
        ...prev,
        txHash: hash,
      }));
      setStatus(`🔗 File upload transaction submitted: ${hash}`);
      setProgress(70);
    },
  });
  const mutation = useMutation({
    mutationKey: ["upload", address],
    mutationFn: async ({
      file,
      datasetId,
    }: {
      file: File;
      datasetId: string;
    }) => {
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain id not found");
      if (!client) throw new Error("Public client not found");

      const { availableFunds: paymentsRaw } = await Payments.accountInfo(client, {
        address,
      });

      const prices = await WarmStorage.servicePrice(client);

      const operatorApprovals = await Payments.operatorApprovals(client, {
        address,
      });

      setProgress(0);
      setUploadedInfo(null);
      setStatus("🔄 Initializing file upload to Filecoin...");

      const pieceCid = Piece.calculate(new Uint8Array(await file.arrayBuffer()))

      // Validate user has sufficient USDFC for storage
      setStatus(
        "💰 Checking if you have enough USDFC to cover the storage costs..."
      );
      setProgress(5);

      const { isSufficient, depositNeeded } =
        await calculateStorageMetrics({
          prices,
          operatorApprovals,
          availableFunds: paymentsRaw,
          config,
          fileSize: file.size,
        });

      // Automatically top up storage allowances if insufficient
      if (!isSufficient) {
        setStatus(
          "💰 Insufficient storage balance, setting up your storage configuration..."
        );

        await paymentMutation.mutateAsync({
          amount: depositNeeded,
        });
        setStatus("💰 Storage configuration setup complete");
      }

      setStatus("📁 Uploading file to storage provider...");
      setProgress(55);

      await upload({
        files: [file],
        dataSetId: BigInt(datasetId),
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
