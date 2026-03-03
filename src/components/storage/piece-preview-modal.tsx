"use client";

import { useState } from "react";
import { Download, ExternalLink, Eye, FileIcon } from "lucide-react";
import { useConnection } from "wagmi";
import { Piece } from "@/lib/datasets";
import { buildPieceUrl, formatSizeMessage, type OpenPieceParams } from "@/lib/piece";
import { useDownloadPiece } from "@/hooks/use-download";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PiecePreviewModalProps {
  piece: Piece;
  accessParams: OpenPieceParams;
  dataSetId?: string;
  variant?: "ghost" | "outline";
}

export function PiecePreviewModal({
  piece,
  accessParams,
  dataSetId,
  variant = "ghost",
}: PiecePreviewModalProps) {
  const { address, chainId } = useConnection();
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { pieceCid, isCDN, serviceURL, withIPFSIndexing, ipfsRootCid } = accessParams;
  const filename = piece.metadata?.name;
  const { downloadMutation } = useDownloadPiece(piece.url, pieceCid, filename);

  const previewUrl = address
    ? buildPieceUrl({
        pieceCid,
        isCDN,
        address,
        serviceURL,
        withIPFSIndexing,
        ipfsRootCid,
        chainId,
      })
    : null;

  const isOnIPFS = withIPFSIndexing && !!ipfsRootCid;

  const handleOpenInBrowser = () => {
    if (!address || !chainId) return;
    const url = buildPieceUrl({
      pieceCid,
      isCDN,
      address,
      serviceURL,
      withIPFSIndexing,
      ipfsRootCid,
      chainId,
    });
    window.open(url, "_blank");
  };

  const metadata = piece.metadata || {};
  const metadataEntries = Object.entries(metadata).filter(([key]) => key !== "name");

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={variant} size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View details</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              File Details
            </DialogTitle>
            <DialogDescription>View piece information and metadata</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview Image */}
            <div className="flex justify-center">
              {imageError || !previewUrl ? (
                <div className="w-48 h-48 rounded-lg bg-muted flex items-center justify-center">
                  <FileIcon className="h-16 w-16 text-muted-foreground" />
                </div>
              ) : (
                <div className="relative w-48 h-48">
                  {imageLoading && <Skeleton className="absolute inset-0 rounded-lg" />}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={filename ?? "File preview"}
                    className={`w-48 h-48 rounded-lg object-cover ${imageLoading ? "opacity-0" : "opacity-100"}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">File Name</span>
                <span className="text-sm font-medium truncate max-w-[200px]">{filename}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Piece CID</span>
                <CopyButton value={pieceCid} size="sm" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">{formatSizeMessage(piece)}</span>
              </div>

              {dataSetId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dataset</span>
                  <span className="text-sm font-medium">#{dataSetId}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Piece ID</span>
                <span className="text-sm font-medium">#{piece.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary">{isCDN ? "CDN" : isOnIPFS ? "IPFS" : "Standard"}</Badge>
              </div>
            </div>

            {/* Metadata Section */}
            {metadataEntries.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Metadata</h4>
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                    {metadataEntries.map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-2">
                        <span className="text-xs text-muted-foreground break-all">{key}</span>
                        <span className="text-xs font-medium text-right break-all max-w-[180px]">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleOpenInBrowser}
                disabled={!address || !chainId}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Browser
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
