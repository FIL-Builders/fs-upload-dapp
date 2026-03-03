"use client";

import { getErrorMessage } from "@/lib";
import { asPieceCID, downloadAndValidate } from "@filoz/synapse-core/piece";
import { useMutation } from "@tanstack/react-query";
import { fileTypeFromBuffer } from "file-type";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

export const useDownloadPiece = (pieceUrl: string, pieceCid: string, filename?: string) => {
  const toastId = `download-${pieceCid}`;
  const mutation = useMutation({
    mutationKey: queryKeys.download(pieceCid),
    mutationFn: async () => {
      const pieceCID = asPieceCID(pieceCid);
      if (!pieceCID) {
        throw new Error("Invalid piece CID");
      }

      const fileName = filename ?? pieceCid;

      const uint8ArrayBytes = await downloadAndValidate({
        url: pieceUrl,
        expectedPieceCid: pieceCid,
      });
      const fileType = await fileTypeFromBuffer(uint8ArrayBytes);

      const file = new File([uint8ArrayBytes as BlobPart], fileName, {
        type: fileType?.mime,
      });

      const objectUrl = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      return file;
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: toastId });
    },
  });

  return { downloadMutation: mutation };
};
