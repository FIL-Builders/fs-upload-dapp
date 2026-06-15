"use client";

import { useState } from "react";
import type { UploadCostPreview as PreviewState } from "@/app/upload/hooks/use-upload-cost-preview";
import type { ProviderHealth } from "@/app/upload/lib/upload-plan";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Receipt,
  RefreshCw,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { DECIMAL_PLACES, formatBalance, pluralize } from "@/lib/format";
import { formatFee } from "@/lib/operation-costs";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UploadMode } from "../../types";

interface UploadCostPreviewProps {
  /** Preview state, computed once in the Uploader (single source of truth). */
  preview: PreviewState;
  fileCount: number;
  mode: UploadMode;
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <div className="min-w-0">
        <span className="text-muted-foreground">{label}</span>
        {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
      </div>
      <span className="font-medium whitespace-nowrap">{value}</span>
    </div>
  );
}

/** Per-provider detail row: status dot, name, endorsement, location, reach status. */
function ProviderHealthList({
  providers,
  selectedIds,
}: {
  providers: ProviderHealth[];
  selectedIds?: Set<bigint>;
}) {
  return (
    <ul className="space-y-1.5">
      {providers.map((p) => {
        const isSelected = selectedIds?.has(p.id);
        return (
          <li
            key={p.id.toString()}
            className="flex items-center justify-between gap-2 rounded-md border bg-background/50 px-2.5 py-1.5 text-xs"
          >
            <div className="flex min-w-0 items-start gap-2">
              <span
                className={cn(
                  "mt-1 h-2 w-2 shrink-0 rounded-full",
                  p.reachable ? "bg-green-500" : "bg-red-500",
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-medium">{p.name}</span>
                  {p.endorsed && (
                    <Badge variant="outline" className="h-4 px-1 text-[10px]">
                      endorsed
                    </Badge>
                  )}
                  {isSelected && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                      selected
                    </Badge>
                  )}
                </div>
                <p className="truncate text-muted-foreground/70">
                  {p.location ? `${p.location} · ` : ""}
                  {p.serviceURL.replace(/^https?:\/\//, "")}
                </p>
                {!p.reachable && p.pingError && (
                  <p className="truncate text-red-600/80 dark:text-red-400/80">{p.pingError}</p>
                )}
              </div>
            </div>
            {p.reachable ? (
              <span className="flex shrink-0 items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Reachable
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 text-red-600 dark:text-red-400">
                <XCircle className="h-3 w-3" /> Unreachable
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Collapsible summary + full provider health list, with a refresh control. */
function ProviderHealthDisclosure({
  summary,
  preview,
  selectedIds,
  defaultOpen = false,
}: {
  summary: React.ReactNode;
  preview: PreviewState;
  selectedIds?: Set<bigint>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between gap-2">
        {summary}
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={preview.retry}
                disabled={preview.isRefreshing}
                aria-label="Refresh provider availability"
              >
                <RefreshCw className={cn("h-3 w-3", preview.isRefreshing && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Re-check which storage providers are reachable</TooltipContent>
          </Tooltip>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
              Details
              <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="mt-2">
        <ProviderHealthList providers={preview.providers} selectedIds={selectedIds} />
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Detailed failure card: classified reason, per-provider health table (from the
 * one-time plan fetch), and retry.
 */
function ResolutionFailureCard({ preview }: { preview: PreviewState }) {
  const { error, providers, counts } = preview;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{error?.headline ?? "Storage provider resolution failed"}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error?.detail}</p>

        {counts && (
          <p className="text-xs">
            {counts.approved} approved {pluralize(counts.approved, "provider")} on this network ·{" "}
            {counts.endorsed} endorsed · {counts.reachableEndorsed} endorsed reachable right now
          </p>
        )}

        {providers.length > 0 && <ProviderHealthList providers={providers} />}

        {error?.retryable && (
          <Button
            variant="outline"
            size="sm"
            onClick={preview.retry}
            disabled={preview.isRefreshing}
            className="w-full"
          >
            <RotateCcw className={cn("mr-2 h-3.5 w-3.5", preview.isRefreshing && "animate-spin")} />
            {preview.isRefreshing ? "Retrying…" : "Retry"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Pre-flight receipt for the upcoming upload.
 *
 * Backed by {@link useUploadCostPreview}, which loads provider/account data
 * ONCE and recomputes selection + exact costs offline on every config change.
 * Before files are picked it shows an expandable readiness panel with live
 * provider health; with files it shows the exact cost receipt; on failure, a
 * diagnostic card.
 */
export function UploadCostPreview({ preview, fileCount, mode }: UploadCostPreviewProps) {
  const selectedIds = new Set((preview.locations ?? []).map((l) => l.provider.id));

  // Resolution failed — show the diagnostic card regardless of file state,
  // since the upload itself would hit the same wall
  if (preview.error) {
    return <ResolutionFailureCard preview={preview} />;
  }

  // Defensive: the Uploader gates rendering until the plan is ready, so
  // locations should be present here
  if (!preview.locations) {
    return <Skeleton className="h-24 w-full" />;
  }

  // Pre-files readiness check — expandable provider details
  if (fileCount === 0) {
    return (
      <ProviderHealthDisclosure
        summary={
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
            <span className="truncate">
              Storage ready — {preview.locations.map((c) => c.provider.name).join(", ")}
              {preview.counts && ` · ${preview.counts.reachable}/${preview.counts.approved} online`}
            </span>
          </p>
        }
        preview={preview}
        selectedIds={selectedIds}
      />
    );
  }

  if (!preview.costs) {
    return <Skeleton className="h-24 w-full" />;
  }

  const { costs } = preview;
  const available = preview.availableFunds;
  const remainingAfter = available - costs.lockups.total;
  const newDatasetCount = costs.newDatasetCount;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4" />
          Cost preview
          {preview.isRefreshing && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>

        <Row
          label="One-time fees"
          value={`${formatFee(costs.fees.total)} USDFC`}
          hint={
            newDatasetCount > 0
              ? `Create ${newDatasetCount} ${pluralize(newDatasetCount, "data set")} + add-piece fees — paid to the provider like gas, from the data set reserve`
              : "Add-piece fees — paid to the provider like gas, from the data set reserve"
          }
        />
        <Row
          label="Newly locked funds"
          value={`${formatFee(costs.lockups.total)} USDFC`}
          hint={
            mode === "cdn"
              ? "Refundable lockups (lifecycle reserve, runway + CDN egress/cache-miss credits) — returned when the rail is finalised"
              : "Refundable lockups (lifecycle reserve + runway) — returned when the rail is finalised"
          }
        />
        <Row
          label="Monthly rate after upload"
          value={`${formatFee(costs.rates.perMonth)} USDFC/mo`}
          hint={
            mode === "pin"
              ? "Storage + flat proving-service fee · CAR overhead not included"
              : "Storage rate + flat proving-service fee per data set"
          }
        />

        <div className="border-t pt-2">
          <Row
            label="Available balance"
            value={`${formatBalance(available, 18, DECIMAL_PLACES.USDFC)} → ~${formatBalance(
              remainingAfter > 0n ? remainingAfter : 0n,
              18,
              DECIMAL_PLACES.USDFC,
            )} USDFC`}
          />
        </div>

        {costs.depositNeeded > 0n ? (
          <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Your available balance covers {formatBalance(available, 18, DECIMAL_PLACES.USDFC)}{" "}
              USDFC — you&apos;ll be asked to deposit{" "}
              {formatBalance(costs.depositNeeded, 18, DECIMAL_PLACES.USDFC)} USDFC more during the
              upload.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Covered by your available balance — no deposit needed.
              {costs.needsFwssMaxApproval && " A one-time approval will be requested."}
            </span>
          </div>
        )}
      </div>

      <ProviderHealthDisclosure
        summary={
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
            <span className="truncate">
              Destinations — {preview.locations.map((c) => c.provider.name).join(", ")}
            </span>
          </p>
        }
        preview={preview}
        selectedIds={selectedIds}
      />
    </div>
  );
}
