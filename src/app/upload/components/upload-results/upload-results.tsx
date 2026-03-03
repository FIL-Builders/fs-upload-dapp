"use client";

import { useMemo } from "react";
import type { PieceResult, ResultData } from "@/app/upload/types";
import { config } from "@/lib";
import { AlertTriangle, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { formatFileSize, pluralize } from "@/lib/format";
import { ExplorerLink } from "@/components/layout/explorer-link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";

interface UploadResultsProps {
  result: ResultData;
  onReset: () => void;
}

export function UploadResults({ result, onReset }: UploadResultsProps) {
  const { pieces, failures, fileCount, copies, totalSize, kind } = result;
  const isPin = kind === "pin";
  const hasFailures = failures.length > 0;

  const successfulProviders = new Set(pieces.flatMap((p) => p.providers.map((u) => u.providerId)));
  const totalStoredBytes = pieces.reduce((sum, p) => sum + p.size * p.providers.length, 0);
  const providerGroups = useMemo(() => groupByProvider(pieces), [pieces]);

  return (
    <Card className="gap-0">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          {hasFailures ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500 mt-0.5" />
          )}
          <div className="space-y-1">
            <CardTitle className="text-base">
              {isPin
                ? hasFailures
                  ? "Partially pinned to Filecoin"
                  : "Pinned to Filecoin"
                : hasFailures
                  ? "Upload partially complete"
                  : "Upload complete"}
            </CardTitle>
            <CardDescription>
              {isPin
                ? `${fileCount} ${pluralize(fileCount, "file")} in a verified CAR upload`
                : `${fileCount} ${pluralize(fileCount, "file")} processed across ${copies} ${pluralize(copies, "provider")}`}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{formatFileSize(totalSize)} payload</Badge>
          <Badge variant="secondary">{formatFileSize(totalStoredBytes)} stored</Badge>
          <Badge variant="secondary">
            {successfulProviders.size}/{copies} {pluralize(copies, "provider")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Failure alerts */}
        {hasFailures && (
          <div className="space-y-2">
            {failures.map((f, i) => (
              <Alert key={`${f.providerIndex}-${i}`} variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>
                  {f.providerName} (Provider {f.providerIndex + 1}) failed
                </AlertTitle>
                <AlertDescription>{f.error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* IPFS Root CID (pin only) */}
        {isPin && result.ipfsRootCid && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              IPFS Root CID
            </p>
            <CopyButton value={result.ipfsRootCid} displayValue={result.ipfsRootCid} showTooltip />
          </div>
        )}

        {/* Provider commit cards */}
        {providerGroups.length > 0 && (
          <div className="space-y-2">
            {providerGroups.map((group) => (
              <div key={group.providerId} className="rounded-lg border bg-muted/40 p-2 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {group.providerName} (#{group.providerId})
                  </span>
                  <Badge variant="outline">Dataset #{group.dataSetId}</Badge>
                </div>
                <ExplorerLink hash={group.txHash} />
                <div className="space-y-1 p-2">
                  <p className="text-xs text-muted-foreground">
                    {group.pieceCids.length} piece {pluralize(group.pieceCids.length, "CID")}
                  </p>
                  {group.pieceCids.map((cid) => (
                    <CopyButton
                      key={cid}
                      value={cid}
                      displayValue={`${cid.slice(0, 15)}...${cid.slice(-15)}`}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gateway link (pin only) */}
        {isPin && result.ipfsRootCid && (
          <Button asChild variant="outline" className="w-full">
            <a
              href={`${config.ipfsGatewayUrl}${result.ipfsRootCid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open on IPFS Gateway
            </a>
          </Button>
        )}

        <Button onClick={onReset} className="w-full">
          Upload More Files
        </Button>
      </CardContent>
    </Card>
  );
}

interface ProviderGroup {
  providerId: string;
  providerName: string;
  dataSetId: string;
  txHash: string;
  pieceCids: string[];
}

function groupByProvider(pieces: PieceResult[]): ProviderGroup[] {
  const map = new Map<string, ProviderGroup>();
  for (const piece of pieces) {
    for (const p of piece.providers) {
      const existing = map.get(p.providerId);
      if (existing) {
        existing.pieceCids.push(piece.pieceCid);
      } else {
        map.set(p.providerId, {
          providerId: p.providerId,
          providerName: p.providerName,
          dataSetId: p.dataSetId,
          txHash: p.txHash,
          pieceCids: [piece.pieceCid],
        });
      }
    }
  }
  return Array.from(map.values());
}
