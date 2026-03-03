"use client";

import { useState } from "react";
import { useDeletePiece } from "@/hooks";
import { config } from "@/lib";
import { Download, Globe, Link as LinkIcon, Server, Trash2 } from "lucide-react";
import { useConnection } from "wagmi";
import type { Piece } from "@/lib/datasets";
import { buildPieceUrl, type OpenPieceParams } from "@/lib/piece";
import { useDownloadPiece } from "@/hooks/use-download";
import { PiecePreviewModal } from "@/components/storage";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PieceActionsProps {
  piece: Piece;
  pieceCid: string;
  accessParams: OpenPieceParams;
  dataSetId: bigint;
}

export function PieceActions({ piece, pieceCid, accessParams, dataSetId }: PieceActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { address, chainId } = useConnection();

  const { downloadMutation } = useDownloadPiece(piece.url, pieceCid, piece.metadata?.name);

  const deletePiece = useDeletePiece(dataSetId, piece.id);

  // Determine available access methods
  const hasCDN = accessParams.isCDN;
  const hasIPFS = accessParams.withIPFSIndexing && accessParams.ipfsRootCid;
  const hasSP = !!accessParams.serviceURL;

  // Build URLs for each access method
  const cdnUrl =
    hasCDN && address && chainId
      ? buildPieceUrl({
          pieceCid,
          isCDN: true,
          address,
          serviceURL: accessParams.serviceURL,
          withIPFSIndexing: false,
          chainId,
        })
      : null;

  const ipfsUrl =
    hasIPFS && accessParams.ipfsRootCid
      ? `${config.ipfsGatewayUrl}${accessParams.ipfsRootCid}`
      : null;

  const spUrl = hasSP ? `${accessParams.serviceURL}/piece/${pieceCid}` : null;

  const openInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex justify-end gap-1">
      <PiecePreviewModal
        piece={piece}
        accessParams={accessParams}
        dataSetId={dataSetId.toString()}
      />

      {/* CDN Access (Filbeam) */}
      {cdnUrl && (
        <ActionButton
          icon={Globe}
          tooltip="Open via CDN (Filbeam)"
          onClick={() => openInNewTab(cdnUrl)}
        />
      )}

      {/* IPFS Gateway Access */}
      {ipfsUrl && (
        <ActionButton
          icon={LinkIcon}
          tooltip="Open via IPFS Gateway"
          onClick={() => openInNewTab(ipfsUrl)}
        />
      )}

      {/* Storage Provider Direct Access */}
      {spUrl && (
        <ActionButton
          icon={Server}
          tooltip="Open via Storage Provider"
          onClick={() => openInNewTab(spUrl)}
        />
      )}

      <ActionButton
        icon={Download}
        tooltip="Download"
        onClick={() => downloadMutation.mutate()}
        disabled={downloadMutation.isPending}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deletePiece.mutateAsync()}
        isPending={deletePiece.isPending}
        itemName="Piece"
        trigger={
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        }
      />
    </div>
  );
}
