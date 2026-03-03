"use client";

import { DataSet, Piece } from "@/lib/datasets";
import {
  formatSizeMessage,
  isIpfsIndexed,
  normalizePieceCid,
  type OpenPieceParams,
} from "@/lib/piece";
import { PieceActions } from "@/components/storage";
import { FilePreview } from "@/components/storage/file-preview";
import { CopyButton } from "@/components/ui/copy-button";
import { TableCell, TableRow } from "@/components/ui/table";

interface PieceRowProps {
  piece: Piece;
  dataSet: DataSet;
}

export function PieceRow({ piece, dataSet }: PieceRowProps) {
  const pieceCid = normalizePieceCid(piece.cid);
  const filename = piece.metadata?.name;
  const ipfsRootCid = piece.metadata?.ipfsRootCid;
  const withIPFSIndexing = isIpfsIndexed(dataSet.metadata) && !!ipfsRootCid;

  const accessParams: OpenPieceParams = {
    pieceCid,
    isCDN: dataSet.cdn,
    serviceURL: dataSet.serviceURL,
    withIPFSIndexing,
    ipfsRootCid: withIPFSIndexing ? ipfsRootCid : undefined,
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <FilePreview accessParams={accessParams} alt={filename} />
          <CopyButton value={pieceCid} size="sm" />
        </div>
        {filename && <p className="text-xs text-muted-foreground mt-1">{filename}</p>}
      </TableCell>
      <TableCell className="table-cell">{formatSizeMessage(piece)}</TableCell>
      <TableCell className="text-right">
        <PieceActions
          piece={piece}
          pieceCid={pieceCid}
          accessParams={accessParams}
          dataSetId={dataSet.dataSetId}
        />
      </TableCell>
    </TableRow>
  );
}
