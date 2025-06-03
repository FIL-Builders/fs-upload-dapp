import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useConfetti } from "@/hooks/useConfetti";

export function useFileUpload() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<{
    fileName: string;
    fileSize: number;
    commp: string;
    txHash: string;
  } | null>(null);

  const signer = useEthersSigner();
  const { triggerConfetti } = useConfetti();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!signer) throw new Error("Signer not found");
      setProgress(0);
      setUploadedInfo(null);
      setStatus("Preparing upload...");
      // 1) Convert File → ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      // 2) Convert ArrayBuffer → Uint8Array
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);
      // 3) Create Synapse instance
      const synapse = await Synapse.create({ signer });
      // 4) Create (mock) StorageService
      const storage = await synapse.createStorage({
        storageProvider: "f01234",
      });
      setStatus("Uploading to mock storage service...");
      setProgress(10);

      // 5) Kick off upload
      const uploadTask = storage.upload(uint8ArrayBytes);
      // 6) Wait for CommP calculation (mock)
      const commp = await uploadTask.commp();
      setProgress(50);
      setStatus("Finalizing upload...");
      // 7) Wait for "chain commit" (mock)
      const txHash = await uploadTask.done();
      setProgress(100);
      setStatus("✅ File uploaded successfully (mock)!");
      setUploadedInfo({
        fileName: file.name,
        fileSize: file.size,
        commp: commp.toLocaleString(),
        txHash: txHash,
      });
      triggerConfetti();
    },
    onSuccess: () => {
      setStatus("✅ File uploaded successfully (mock)!");
    },
    onError: (error) => {
      setStatus(`❌ ${error.message || "Upload failed. Please try again."}`);
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
}
