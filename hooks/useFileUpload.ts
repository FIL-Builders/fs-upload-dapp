import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useConfetti } from "@/hooks/useConfetti";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "./useEthers";
import { useConfig } from "@/providers/ConfigProvider";
import { getQueryKey } from "@/utils/constants";
import { usePayment } from "@/hooks/usePayment";
import { calculateStorageMetrics } from "@/utils/calculateStorageMetrics";

export type UploadedInfo = {
  fileName?: string;
  fileSize?: number;
  pieceCid?: string;
  txHash?: string;
};

/**
 * Custom hook for uploading files to the Filecoin network with comprehensive progress tracking
 *
 * @description
 * This hook orchestrates the complete file upload workflow to Filecoin storage, from initial
 * file processing through storage provider selection, dataset creation, and final piece confirmation.
 * It provides real-time progress updates and automatically handles storage payments when needed.
 *
 * @workflow File Upload Process:
 * 1. **File Processing**: Convert File to Uint8Array for Synapse compatibility
 * 2. **Storage Validation**: Check if user has sufficient USDFC for storage costs
 * 3. **Payment Processing**: Automatically top up storage if insufficient funds
 * 4. **Storage Service**: Create or resolve existing dataset for the user
 * 5. **Provider Selection**: Choose optimal storage provider based on requirements
 * 6. **File Upload**: Upload file data to selected storage provider
 * 7. **Piece Addition**: Add file pieces to blockchain dataset
 * 8. **Confirmation**: Wait for blockchain confirmation of piece addition
 *
 * @features
 * - Automatic storage cost calculation and payment handling
 * - Real-time progress updates (0-100%) with descriptive status messages
 * - Comprehensive callback system for each upload phase
 * - Error handling with user-friendly error messages
 * - Confetti celebration on successful completion
 * - Upload state management with reset functionality
 *
 * @returns {Object} Upload functionality and state
 * @returns {Object} uploadFileMutation - TanStack Query mutation for file upload
 * @returns {number} progress - Upload progress percentage (0-100)
 * @returns {UploadedInfo|null} uploadedInfo - Details about uploaded file
 * @returns {Function} handleReset - Function to reset upload state
 * @returns {string} status - Current upload status message
 *
 * @example
 * ```tsx
 * function FileUploadComponent() {
 *   const {
 *     uploadFileMutation,
 *     progress,
 *     uploadedInfo,
 *     handleReset,
 *     status
 *   } = useFileUpload();
 *
 *   const { mutateAsync: uploadFile, isPending } = uploadFileMutation;
 *
 *   const handleFileUpload = async (file: File) => {
 *     try {
 *       await uploadFile(file);
 *       console.log("Upload successful!");
 *     } catch (error) {
 *       console.error("Upload failed:", error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
 *       />
 *       {isPending && (
 *         <div>
 *           <p>{status}</p>
 *           <progress value={progress} max={100} />
 *         </div>
 *       )}
 *       {uploadedInfo && (
 *         <div>
 *           <h3>Upload Complete!</h3>
 *           <p>File: {uploadedInfo.fileName}</p>
 *           <p>Piece CID: {uploadedInfo.pieceCid}</p>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @throws {Error} When signer is not available
 * @throws {Error} When wallet address is not found
 * @throws {Error} When storage cost calculation fails
 * @throws {Error} When payment processing fails (insufficient funds)
 * @throws {Error} When storage service creation fails
 * @throws {Error} When file upload to provider fails
 * @throws {Error} When piece addition to dataset fails
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
  const mutation = useMutation({
    mutationKey: getQueryKey("upload", address),
    mutationFn: async (file: File) => {
      // === VALIDATION AND INITIALIZATION ===
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      // Reset state for new upload
      setProgress(0);
      setUploadedInfo(null);
      setStatus("🔄 Initializing file upload to Filecoin...");

      // === FILE PROCESSING ===
      // Convert browser File object to format compatible with Synapse SDK
      const arrayBuffer = await file.arrayBuffer(); // File → ArrayBuffer
      const uint8ArrayBytes = new Uint8Array(arrayBuffer); // ArrayBuffer → Uint8Array

      // === SYNAPSE SDK INITIALIZATION ===
      // Create Synapse instance with user's configuration settings
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN, // Use CDN storage if configured
      });

      // === STORAGE COST VALIDATION ===
      // Calculate if user has sufficient allowances for this file size
      setStatus(
        "💰 Checking if you have enough USDFC to cover the storage costs..."
      );
      setProgress(5);

      const { isSufficient, totalLockupNeeded, rateNeeded, depositNeeded } =
        await calculateStorageMetrics(
          synapse,
          config,
          file.size // Check specifically for this file's storage requirements
        );

      // === AUTOMATIC PAYMENT PROCESSING ===
      // If insufficient funds, automatically trigger payment flow
      if (!isSufficient) {
        setStatus(
          "💰 Insufficient storage balance, setting up your storage configuration..."
        );

        // Call payment mutation with calculated requirements
        await paymentMutation.mutateAsync({
          lockupAllowance: totalLockupNeeded, // Total USDFC for long-term commitments
          epochRateAllowance: rateNeeded, // Per-epoch spending rate
          depositAmount: depositNeeded, // Immediate deposit required
        });

        setStatus("💰 Storage configuration setup complete");
      }

      // === STORAGE SERVICE INITIALIZATION ===
      setStatus("🔗 Setting up storage service and dataset...");
      setProgress(25);

      // Create storage service with comprehensive callback system for progress tracking
      const storageService = await synapse.createStorage({
        callbacks: {
          // Called when existing dataset is found and reused
          onDataSetResolved: (info) => {
            console.log("Dataset resolved:", info);
            setStatus("🔗 Existing dataset found and resolved");
            setProgress(30);
          },

          // Called when new dataset creation transaction is submitted
          onDataSetCreationStarted: (transactionResponse, statusUrl) => {
            console.log("Dataset creation started:", transactionResponse);
            console.log("Dataset creation status URL:", statusUrl);
            setStatus("🏗️ Creating new dataset on blockchain...");
            setProgress(35);
          },

          // Called during dataset creation progress updates
          onDataSetCreationProgress: (status) => {
            console.log("Dataset creation progress:", status);

            // Transaction confirmed on blockchain
            if (status.transactionSuccess) {
              setStatus(`⛓️ Dataset transaction confirmed on chain`);
              setProgress(45);
            }

            // Storage provider has confirmed dataset readiness
            if (status.serverConfirmed) {
              setStatus(
                `🎉 Dataset ready! (${Math.round(status.elapsedMs / 1000)}s)`
              );
              setProgress(50);
            }
          },

          // Called when storage provider is selected for the upload
          onProviderSelected: (provider) => {
            console.log("Storage provider selected:", provider);
            setStatus(`🏪 Storage provider selected`);
          },
        },
      });

      // === FILE UPLOAD TO STORAGE PROVIDER ===
      setStatus("📁 Uploading file to storage provider...");
      setProgress(55);

      // Upload file with metadata and progress callbacks
      const { pieceCid } = await storageService.upload(uint8ArrayBytes, {
        // Include file metadata for reference
        metadata: {
          fileName: file.name,
          fileSize: file.size.toString(),
        },

        // === UPLOAD PROGRESS CALLBACKS ===

        // Called when file upload to provider completes
        onUploadComplete: (piece) => {
          setStatus(
            `📊 File uploaded! Signing msg to add pieces to the dataset`
          );

          // Update uploaded info with file details and piece CID
          setUploadedInfo((prev) => ({
            ...prev,
            fileName: file.name,
            fileSize: file.size,
            pieceCid: piece.toV1().toString(), // Convert to v1 CID format
          }));
          setProgress(80);
        },

        // Called when transaction to add piece to dataset is submitted
        onPieceAdded: (transactionResponse) => {
          setStatus(
            `🔄 Waiting for transaction to be confirmed on chain${
              transactionResponse ? `(txHash: ${transactionResponse.hash})` : ""
            }`
          );

          // Store transaction hash if available
          if (transactionResponse) {
            console.log("Transaction response:", transactionResponse);
            setUploadedInfo((prev) => ({
              ...prev,
              txHash: transactionResponse?.hash,
            }));
          }
        },

        // Called when piece addition is confirmed on blockchain
        onPieceConfirmed: () => {
          setStatus("🌳 Data pieces added to dataset successfully");
          setProgress(90);
        },
      });

      // === FINAL STATE UPDATE ===
      setProgress(95);

      // Ensure final uploaded info is complete
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
