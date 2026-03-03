"use client";

import type { UploadPhase } from "@/app/upload/types";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatUploadSummary, getStatusBadgeClass } from "./upload-status-utils";

interface UploadStatusHeaderProps {
  phase: UploadPhase;
  fileCount: number;
  copies: number;
}

export function UploadStatusHeader({ phase, fileCount, copies }: UploadStatusHeaderProps) {
  const progress = phase.phase === "active" ? phase.progress : 0;
  const totalCopies = fileCount * copies;

  return (
    <CardHeader className="gap-3 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {phase.phase === "active" ? "Upload in progress" : "Upload failed"}
          </CardTitle>
          <CardDescription>{formatUploadSummary(fileCount, copies)}</CardDescription>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "capitalize",
            getStatusBadgeClass(phase.phase === "active" ? "active" : "failed"),
          )}
        >
          {phase.phase === "active" ? "active" : "failed"}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-normal">
          {fileCount} {pluralize(fileCount, "file")}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {copies} {pluralize(copies, "provider")}
        </Badge>
        <Badge variant="secondary" className="font-normal">
          {totalCopies} {pluralize(totalCopies, "copy", "copies")}
        </Badge>
      </div>

      {phase.phase === "active" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Pipeline progress</span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}
    </CardHeader>
  );
}
