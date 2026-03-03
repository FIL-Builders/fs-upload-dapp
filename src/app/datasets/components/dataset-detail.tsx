"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDataSets } from "@filoz/synapse-react";
import { ArrowLeft, Database, RefreshCw, Trash2, Upload } from "lucide-react";
import { useConnection } from "wagmi";
import { transformDatasets } from "@/lib/datasets";
import { pluralize } from "@/lib/format";
import { formatSizeMessage, getPdpScannerUrl, isDatasetOnIpfs } from "@/lib/piece";
import { cn } from "@/lib/utils";
import { useDeleteDataset } from "@/hooks/use-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieceRow } from "./piece-row";
import { DatasetDetailSkeleton } from "./skeletons";

export function DatasetDetailContent({ datasetId }: { datasetId: string }) {
  const { address, chainId } = useConnection();
  const { data: raw, isLoading, refetch, isRefetching } = useDataSets({ address });
  const datasets = useMemo(() => {
    if (!chainId) return [];
    return transformDatasets(raw);
  }, [raw, chainId]);
  const dataset = datasets.find((d) => d.dataSetId.toString() === datasetId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteDataset = useDeleteDataset(dataset?.dataSetId ?? 0n);
  const isOnIpfs = dataset ? isDatasetOnIpfs(dataset) : false;

  const handleDelete = async () => {
    await deleteDataset.mutateAsync();
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <DatasetDetailSkeleton />;
  }

  if (!dataset) {
    return (
      <div className="px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Dataset Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This dataset doesn&apos;t exist or has been deleted.
          </p>
          <Link href="/datasets">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Datasets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <Link
        href="/datasets"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Datasets
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Dataset #{datasetId}</h1>
            {dataset.cdn && <Badge variant="secondary">CDN</Badge>}
            {isOnIpfs && <Badge variant="secondary">IPFS</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {dataset.pieces.length} {pluralize(dataset.pieces.length, "piece")} ·{" "}
            {formatSizeMessage(dataset.totalSize)}
          </p>
          <dl className="text-sm text-muted-foreground space-y-0.5">
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Provider:</dt>
              <dd>{dataset.provider.name}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Service URL:</dt>
              <dd className="truncate max-w-xs">{dataset.serviceURL}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">PDP Scan:</dt>
              <dd>
                <a
                  href={getPdpScannerUrl(dataset.dataSetId, chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View on PDP Scanner
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-busy={isRefetching}
            aria-label="Refresh dataset"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
          <ConfirmDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDelete}
            isPending={deleteDataset.isPending}
            itemName="Dataset"
            description="Are you sure you want to delete this dataset and all its pieces? This action cannot be undone."
            trigger={
              <Button variant="outline" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      {dataset.pieces.length > 0 ? (
        <Card>
          <CardContent className="pt-6">
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
                    return <PieceRow key={`${index}`} piece={piece} dataSet={dataset} />;
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Database}
          title="No Pieces"
          description="This dataset has no pieces. Upload files to add pieces."
          action={
            <Link href="/upload">
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload Files
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
