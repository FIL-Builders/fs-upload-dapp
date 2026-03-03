import type { ProviderProgress, StepStatus, UploadStep } from "@/app/upload/types";
import { CheckCircle2, Circle, Loader2, MinusCircle, XCircle, type LucideIcon } from "lucide-react";
import { pluralize } from "@/lib/format";

const STATUS_ICON_MAP: Record<StepStatus, LucideIcon> = {
  done: CheckCircle2,
  active: Loader2,
  failed: XCircle,
  skipped: MinusCircle,
  pending: Circle,
};

const STATUS_TEXT_CLASS_MAP: Record<StepStatus, string> = {
  done: "text-green-600 dark:text-green-400",
  active: "text-primary",
  failed: "text-destructive",
  skipped: "text-muted-foreground",
  pending: "text-muted-foreground",
};

const STATUS_BADGE_CLASS_MAP: Record<StepStatus, string> = {
  done: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  active: "border-primary/30 bg-primary/10 text-primary",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  skipped: "border-muted bg-muted text-muted-foreground",
  pending: "border-border bg-muted/40 text-muted-foreground",
};

const STATUS_PANEL_CLASS_MAP: Record<StepStatus, string> = {
  done: "border-green-500/30 bg-green-500/5",
  active: "border-primary/30 bg-primary/5",
  failed: "border-destructive/30 bg-destructive/5",
  skipped: "border-border bg-muted/20",
  pending: "border-border bg-muted/20",
};

export function formatUploadSummary(fileCount: number, copies: number): string {
  if (fileCount === 0 || copies === 0) {
    return "Preparing upload pipeline";
  }

  const totalCopies = fileCount * copies;
  return `Uploading ${fileCount} ${pluralize(fileCount, "file")} to ${copies} ${pluralize(copies, "provider")} (${totalCopies} total ${pluralize(totalCopies, "copy", "copies")})`;
}

export function getStatusIcon(status: StepStatus): LucideIcon {
  return STATUS_ICON_MAP[status];
}

export function getStatusTextClass(status: StepStatus): string {
  return STATUS_TEXT_CLASS_MAP[status];
}

export function getStatusBadgeClass(status: StepStatus): string {
  return STATUS_BADGE_CLASS_MAP[status];
}

export function getStatusPanelClass(status: StepStatus): string {
  return STATUS_PANEL_CLASS_MAP[status];
}

export function getProviderOverallStatus(steps: UploadStep[]): StepStatus {
  if (steps.some((step) => step.status === "failed")) return "failed";
  if (steps.some((step) => step.status === "active")) return "active";
  if (steps.every((step) => step.status === "done" || step.status === "skipped")) return "done";
  return "pending";
}

export function getProviderLabel(provider: ProviderProgress, index: number): string {
  return provider.label || `Provider ${index + 1}`;
}
