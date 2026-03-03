"use client";

import { useIsMounted } from "@/hooks";
import { BalanceCards, QuickActions, StorageDashboard } from "@/components/home";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function HomeSkeleton() {
  return (
    <div className="px-4 py-8 space-y-10">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage Health Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56 mt-1" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const isMounted = useIsMounted();

  if (!isMounted) {
    return <HomeSkeleton />;
  }

  return (
    <div className="px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Filecoin Cloud</h1>
        <p className="text-muted-foreground mt-1">Manage your decentralized storage on Filecoin</p>
      </div>

      {/* Balance Cards */}
      <BalanceCards />

      {/* Unified Storage Health Dashboard */}
      <StorageDashboard />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
