"use client";

import { useIsMounted } from "@/hooks";
import { Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Uploader } from "./components/uploader";

function UploadSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function UploadPage() {
  const isMounted = useIsMounted();

  return (
    <div className="px-4 py-8 mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Upload Files</h1>
          <p className="text-sm text-muted-foreground">
            Store files on the Filecoin network with verifiable proofs
          </p>
        </div>
      </div>

      {isMounted ? <Uploader /> : <UploadSkeleton />}
    </div>
  );
}
