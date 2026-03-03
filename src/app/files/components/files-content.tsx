"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDataSets } from "@filoz/synapse-react";
import { FileIcon, Upload } from "lucide-react";
import { useConnection } from "wagmi";
import { computeUniquePieces, transformDatasets } from "@/lib/datasets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileRow } from "./file-row";

export function FilesContent() {
  const { address, chainId } = useConnection();
  const { data: raw, isLoading, isRefetching, refetch } = useDataSets({ address });
  const datasets = useMemo(() => {
    if (!chainId) return [];
    return transformDatasets(raw);
  }, [raw, chainId]);
  const pieces = useMemo(() => computeUniquePieces(datasets), [datasets]);

  if (isLoading) {
    return <FilesSkeleton />;
  }

  return (
    <div className="px-4 py-8">
      <PageHeader
        title="Files"
        description="All your files stored on Filecoin"
        onRefresh={() => refetch()}
        isRefreshing={isRefetching}
        actions={
          <Button asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Link>
          </Button>
        }
      />

      {pieces.length > 0 ? (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead className="table-cell">Size</TableHead>
                  <TableHead className="table-cell">Replicas</TableHead>
                  <TableHead className="table-cell">Datasets</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pieces.map((uniquePiece) => (
                  <FileRow key={uniquePiece.pieceCid} uniquePiece={uniquePiece} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={FileIcon}
          title="No Files"
          description="You haven't uploaded any files yet. Start by uploading your first file."
          action={
            <Button asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-4 w-4" /> Upload Your First File
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function FilesSkeleton() {
  return (
    <div className="px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
