import { useMutation } from "@tanstack/react-query";
import { fileTypeFromBuffer } from "file-type";

/** Detects MIME type from binary data */
const identifyFileType = async (uint8Array: Uint8Array) =>
  await fileTypeFromBuffer(uint8Array);

/**
 * Hook for downloading files from Filecoin using piece CID (CommP).
 * Retrieves file, detects MIME type, and triggers browser download with original filename.
 *
 * @param commp - Piece CID identifying the file on Filecoin
 * @param filename - Original filename for download
 * @returns Mutation object for download operation
 *
 * @example
 * ```tsx
 * const { downloadMutation } = useDownloadPiece(pieceCid, fileName);
 * await downloadMutation.mutateAsync();
 * ```
 */
export const useDownloadPiece = (url: string, filename: string) => {

  const mutation = useMutation({
    mutationKey: ["download", url],
    mutationFn: async () => {
      const uint8ArrayBytes = await fetch(url).then((res) => res.arrayBuffer());
      const fileType = await identifyFileType(new Uint8Array(uint8ArrayBytes as ArrayBuffer));

      const file = new File([uint8ArrayBytes as BlobPart], filename, {
        type: fileType?.mime,
      });

      // Trigger browser download
      const objectUrl = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.click();
      return;
    },
  });

  return {
    downloadMutation: mutation,
  };
};
