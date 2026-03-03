"use client";

import { useState } from "react";
import type { ProviderProgress, UploadStep } from "@/app/upload/types";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  getProviderLabel,
  getProviderOverallStatus,
  getStatusBadgeClass,
  getStatusIcon,
  getStatusPanelClass,
} from "./upload-status-utils";

interface UploadProvidersListProps {
  providers: ProviderProgress[];
}

export function UploadProvidersList({ providers }: UploadProvidersListProps) {
  const [isOpen, setIsOpen] = useState(providers.length <= 4);
  const shouldScroll = providers.length > 4;

  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Provider statuses
            </p>
            <Badge variant="outline">{providers.length}</Badge>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              {isOpen ? "Hide" : "Show"}
              <ChevronDown
                className={cn("ml-1 h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <ScrollArea className={cn(shouldScroll && "h-52 pr-3")}>
            <div className="space-y-2">
              {providers.map((provider, index) => (
                <ProviderRow key={`${provider.label}-${index}`} provider={provider} index={index} />
              ))}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

function ProviderRow({ provider, index }: { provider: ProviderProgress; index: number }) {
  const overallStatus = getProviderOverallStatus(provider.steps);
  const Icon = getStatusIcon(overallStatus);

  return (
    <div className={cn("rounded-md border px-3 py-2", getStatusPanelClass(overallStatus))}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", overallStatus === "active" && "animate-spin")} />
        <span className="text-xs font-medium">{getProviderLabel(provider, index)}</span>
        <Badge
          variant="outline"
          className={cn("ml-auto capitalize", getStatusBadgeClass(overallStatus))}
        >
          {overallStatus}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {provider.steps.map((step) => (
          <ProviderStepBadge key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}

function ProviderStepBadge({ step }: { step: UploadStep }) {
  const Icon = getStatusIcon(step.status);
  const details = step.error ?? step.detail;
  const isError = Boolean(step.error);

  const content = (
    <Badge variant="outline" className={cn("gap-1.5", getStatusBadgeClass(step.status))}>
      <Icon className={cn("h-3 w-3", step.status === "active" && "animate-spin")} />
      <span>{step.label}</span>
    </Badge>
  );

  if (!details) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <p className={cn("text-xs", isError && "text-destructive")}>{details}</p>
      </TooltipContent>
    </Tooltip>
  );
}
