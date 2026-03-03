"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useIsMounted } from "@/hooks";
import {
  DatasetDetailContent,
  DatasetDetailSkeleton,
  DatasetsListContent,
  DatasetsListSkeleton,
} from "./components";

export default function DatasetsPage() {
  return (
    <Suspense fallback={<DatasetsListSkeleton />}>
      <DatasetsRouter />
    </Suspense>
  );
}

function DatasetsRouter() {
  const isMounted = useIsMounted();
  const searchParams = useSearchParams();
  const datasetId = searchParams.get("id");

  if (!isMounted) {
    return datasetId ? <DatasetDetailSkeleton /> : <DatasetsListSkeleton />;
  }

  if (datasetId) {
    return <DatasetDetailContent datasetId={datasetId} />;
  }

  return <DatasetsListContent />;
}
