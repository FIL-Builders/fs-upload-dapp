"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDataSets } from "@filoz/synapse-react";
import { Database, Upload } from "lucide-react";
import { useConnection } from "wagmi";
import { transformDatasets } from "@/lib/datasets";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DatasetCard } from "./dataset-card";
import { DatasetsListSkeleton } from "./skeletons";

export function DatasetsListContent() {
  const { address, chainId } = useConnection();
  const { data: raw, isLoading, refetch, isRefetching } = useDataSets({ address });
  const datasets = useMemo(() => {
    if (!chainId) return [];
    return transformDatasets(raw);
  }, [raw, chainId]);

  if (isLoading) {
    return <DatasetsListSkeleton />;
  }

  return (
    <div className="px-4 py-8">
      <PageHeader
        title="Datasets"
        description="Manage your stored files on Filecoin"
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

      {datasets.length > 0 ? (
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.dataSetId.toString()} dataset={dataset} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Database}
          title="No Datasets"
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
