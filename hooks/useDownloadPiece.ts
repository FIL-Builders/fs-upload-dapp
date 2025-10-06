import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { fileTypeFromBuffer } from "file-type";
import { useEthersSigner } from "./useEthers";
import { getQueryKey } from "@/utils/constants";

/**
 * Identifies the MIME type of a file from its binary data
 *
 * @param {Uint8Array} uint8Array - Binary file data
 * @returns {Promise<Object|undefined>} File type information with MIME type and extension
 */
async function identifyFileType(uint8Array: Uint8Array) {
  const fileType = await fileTypeFromBuffer(uint8Array);
  return fileType;
}

/**
 * Custom hook for downloading files from Filecoin storage using CommP (piece CID)
 *
 * @description
 * This hook provides functionality to download previously uploaded files from Filecoin storage.
 * It uses the piece CID (CommP) to retrieve the file data, automatically detects the file type,
 * and triggers a browser download with the original filename.
 *
 * @functionality
 * - Retrieves file data from Filecoin storage using Synapse SDK
 * - Automatically detects file MIME type from binary data
 * - Creates a downloadable File object with proper type information
 * - Triggers browser download using the HTML5 download API
 * - Provides mutation state for loading indicators and error handling
 *
 * @param {string} commp - The piece CID (CommP) identifying the file on Filecoin
 * @param {string} filename - Original filename to use for the downloaded file
 *
 * @returns {Object} Download functionality
 * @returns {Object} downloadMutation - TanStack Query mutation for download operation
 *
 * @example
 * ```tsx
 * function FileDownloadButton({ pieceCid, fileName }) {
 *   const { downloadMutation } = useDownloadPiece(pieceCid, fileName);
 *   const { mutateAsync: downloadFile, isPending } = downloadMutation;
 *
 *   const handleDownload = async () => {
 *     try {
 *       await downloadFile();
 *       console.log("Download started successfully");
 *     } catch (error) {
 *       console.error("Download failed:", error);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleDownload} disabled={isPending}>
 *       {isPending ? "Downloading..." : "Download File"}
 *     </button>
 *   );
 * }
 * ```
 *
 * @throws {Error} When signer is not available
 * @throws {Error} When file retrieval from Filecoin fails
 * @throws {Error} When file type detection fails
 * @throws {Error} When browser download initiation fails
 */
export const useDownloadPiece = (commp: string, filename: string) => {
  const signer = useEthersSigner();

  const mutation = useMutation({
    // Keep keys serializable to avoid circular JSON errors
    mutationKey: getQueryKey("download", commp),
    mutationFn: async () => {
      if (!signer) throw new Error("Signer not found");

      const synapse = await Synapse.create({
        signer,
      });

      const uint8ArrayBytes = await synapse.storage.download(commp);

      const fileType = await identifyFileType(uint8ArrayBytes);

      const file = new File([uint8ArrayBytes as BlobPart], filename, {
        type: fileType?.mime,
      });

      // Download file to browser
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      return file;
    },
    onSuccess: () => {
      console.log("File downloaded", filename);
    },
    onError: (error) => {
      console.error("Error downloading piece", error);
    },
  });

  return {
    downloadMutation: mutation,
  };
};
