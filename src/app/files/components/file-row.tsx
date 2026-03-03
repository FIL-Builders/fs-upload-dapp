"use client";

import Link from "next/link";
import { ChevronDown, Database } from "lucide-react";
import type { UniquePiece } from "@/lib/datasets";
import { pluralize } from "@/lib/format";
import { formatSizeMessage, isIpfsIndexed } from "@/lib/piece";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";

interface FileRowProps {
  uniquePiece: UniquePiece;
}

export function FileRow({ uniquePiece }: FileRowProps) {
  const { pieceCid, piece, datasets } = uniquePiece;

  const hasCDN = datasets.some((d) => d.dataset.cdn);
  const ipfsRootCid = piece.metadata?.ipfsRootCid;
  const withIPFSIndexing = !!ipfsRootCid && datasets.some((d) => isIpfsIndexed(d.dataset.metadata));

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <CopyButton value={pieceCid} size="sm" />
          </div>
        </div>
      </TableCell>
      <TableCell className="table-cell">{formatSizeMessage(piece)}</TableCell>
      <TableCell className="table-cell text-center">
        <div className="flex items-center justify-start gap-1 flex-wrap">
          <Badge variant="secondary">{datasets.length}</Badge>
          {hasCDN && (
            <Badge variant="outline" className="text-xs">
              CDN
            </Badge>
          )}
          {withIPFSIndexing && (
            <Badge variant="outline" className="text-xs">
              IPFS
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="table-cell">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Database className="h-3 w-3 mr-1" />
              {datasets.length} {pluralize(datasets.length, "dataset")}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Stored in datasets</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {datasets.map(({ dataset, pieceIndex }) => (
              <DropdownMenuItem key={`${dataset.dataSetId}-${pieceIndex}`} asChild>
                <Link
                  href={`/datasets?id=${dataset.dataSetId}`}
                  className="flex flex-col items-start gap-0.5 cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium">#{dataset.dataSetId.toString()}</span>
                    {dataset.cdn && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        CDN
                      </Badge>
                    )}
                    {isIpfsIndexed(dataset.metadata) && withIPFSIndexing && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        IPFS
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {dataset.provider.name} · {dataset.pieces.length}{" "}
                    {pluralize(dataset.pieces.length, "piece")}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
