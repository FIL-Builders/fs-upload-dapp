"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { DataSet } from "@/lib/datasets";
import { pluralize } from "@/lib/format";
import { formatSizeMessage, isDatasetOnIpfs } from "@/lib/piece";
import { useDeleteDataset } from "@/hooks/use-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatasetPreviewModal } from "./dataset-preview-modal";
import { PieceRow } from "./piece-row";

interface DatasetCardProps {
  dataset: DataSet;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteDataset = useDeleteDataset(dataset.dataSetId);
  const router = useRouter();
  const handleDelete = async () => {
    await deleteDataset.mutateAsync();
    setDeleteDialogOpen(false);
  };
  const isOnIpfs = isDatasetOnIpfs(dataset);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <button
                type="button"
                className="cursor-pointer hover:underline"
                onClick={() => router.push(`/datasets?id=${dataset.dataSetId.toString()}`)}
              >
                Dataset #{dataset.dataSetId.toString()}
              </button>
              {dataset.cdn && <Badge variant="secondary">CDN</Badge>}
              {isOnIpfs && <Badge variant="secondary">IPFS</Badge>}
            </CardTitle>
            <CardDescription>
              {dataset.pieces.length} {pluralize(dataset.pieces.length, "piece")} ·{" "}
              {formatSizeMessage(dataset.totalSize)}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <DatasetPreviewModal dataset={dataset} />
            <ConfirmDeleteDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onConfirm={handleDelete}
              isPending={deleteDataset.isPending}
              itemName="Dataset"
              trigger={
                <Button variant="outline" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
            />
            <Button variant="outline" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && dataset.pieces.length > 0 && (
        <CardContent className="pt-0">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Piece CID</TableHead>
                  <TableHead className="table-cell">Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.pieces.map((piece, index) => {
                  return (
                    <PieceRow
                      key={`${index}-${piece.id.toString()}`}
                      piece={piece}
                      dataSet={dataset}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}

      {expanded && dataset.pieces.length === 0 && (
        <CardContent className="pt-0">
          <p className="text-center text-muted-foreground py-4">No pieces in this dataset</p>
        </CardContent>
      )}
    </Card>
  );
}
