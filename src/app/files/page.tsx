"use client";

import { useIsMounted } from "@/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilesContent } from "./components";

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

export default function FilesPage() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <FilesSkeleton />;
  }

  return <FilesContent />;
}
