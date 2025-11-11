import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { fileTypeFromBuffer } from "file-type";
import { useEthersSigner } from "./useEthers";
import { useAccount } from "wagmi";

/** Detects MIME type from binary data */
const identifyFileType = async (uint8Array: Uint8Array) =>
  await fileTypeFromBuffer(uint8Array);

/**
 * Hook for downloading files from Filecoin using piece CID (CommP).
 * Retrieves file, detects MIME type, and triggers browser download with original filename.
 * @param pieceCid - Piece CID identifying the file on Filecoin
 * @param filename - Original filename for download
 * @returns Mutation object for download operation
 */
export const useDownloadPiece = (pieceCid: string, filename: string) => {
  const signer = useEthersSigner();

  const mutation = useMutation({
    mutationKey: ["download", pieceCid],
    mutationFn: async () => {
      if (!signer) throw new Error("Signer not found");

      const synapse = await Synapse.create({ signer });
      const uint8ArrayBytes = await synapse.storage.download(pieceCid);
      const fileType = await identifyFileType(uint8ArrayBytes);

      const file = new File([uint8ArrayBytes as BlobPart], filename, {
        type: fileType?.mime,
      });

      // Trigger browser download
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

/**
 * Hook for opening piece data in a new tab.
 * Opens the piece data in a new tab using the piece CID and URL.
 * @param pieceCid - Piece CID identifying the file on Filecoin
 * @param isCDN - Whether the piece is stored on CDN
 * @param url - URL of the PDP service
 * @returns Mutation object for opening piece data in a new tab
 */
export const useOpenPieceDataInNewTab = (pieceCid: string, isCDN: boolean, url: string) => {
  const { address } = useAccount();
  const signer = useEthersSigner();

  const mutation = useMutation({
    mutationKey: ["openPieceDataInNewTab", `${pieceCid}-${isCDN}`],
    mutationFn: async () => {
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");
      if (isCDN) {
        window.open(
          `https://${address}.calibration.filbeam.io/${pieceCid}`,
          "_blank"
        );
        return;
      } else {
        window.open(`${url}/piece/${pieceCid}`, "_blank");
        return;
      }
    },
    onSuccess: () => {
      console.log("Piece data opened in new tab", pieceCid);
    },
    onError: (error) => {
      console.error("Error opening piece data in new tab", error);
    },
  });

  return {
    openPieceDataInNewTabMutation: mutation,
  };
};
