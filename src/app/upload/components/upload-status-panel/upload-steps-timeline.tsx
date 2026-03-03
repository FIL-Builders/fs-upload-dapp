"use client";

import type { UploadStep } from "@/app/upload/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatusBadgeClass, getStatusIcon, getStatusTextClass } from "./upload-status-utils";

interface UploadStepsTimelineProps {
  steps: UploadStep[];
}

export function UploadStepsTimeline({ steps }: UploadStepsTimelineProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Upload pipeline
        </p>
        <Badge variant="outline">{steps.length} steps</Badge>
      </div>
      <div className="space-y-1.5">
        {steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}

function StepRow({ step }: { step: UploadStep }) {
  const Icon = getStatusIcon(step.status);
  const message = step.error ?? step.detail;
  const isError = Boolean(step.error);
  const isLongMessage = Boolean(message && message.length > 68);

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            getStatusTextClass(step.status),
            step.status === "active" && "animate-spin",
          )}
        />
        <span className={cn("text-xs font-medium", getStatusTextClass(step.status))}>
          {step.label}
        </span>
        <Badge
          variant="outline"
          className={cn("ml-auto capitalize", getStatusBadgeClass(step.status))}
        >
          {step.status}
        </Badge>
      </div>

      {message && (
        <div
          className={cn(
            "pl-5 pt-1 text-xs",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {isLongMessage ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {message.slice(0, 65)}
                  ...
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>{message}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{message}</span>
          )}
        </div>
      )}
    </div>
  );
}
