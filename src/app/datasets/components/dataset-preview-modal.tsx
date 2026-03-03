"use client";

import { useState } from "react";
import { Calendar, Database, Eye, HardDrive, Server } from "lucide-react";
import { DataSet } from "@/lib/datasets";
import { pluralize } from "@/lib/format";
import { formatSizeMessage, isDatasetOnIpfs } from "@/lib/piece";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DatasetPreviewModalProps {
  dataset: DataSet;
  variant?: "ghost" | "outline";
}

export function DatasetPreviewModal({ dataset, variant = "outline" }: DatasetPreviewModalProps) {
  const [open, setOpen] = useState(false);
  const datasetId = dataset.dataSetId.toString();
  const isIpfs = isDatasetOnIpfs(dataset);
  const sizeStr = formatSizeMessage(dataset.totalSize);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={variant} size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View details</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dataset Details
            </DialogTitle>
            <DialogDescription>View dataset information and configuration</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Dataset Header */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Dataset #{datasetId}</h3>
                  <p className="text-xs text-muted-foreground">
                    {dataset.pieces.length} {pluralize(dataset.pieces.length, "piece")}
                  </p>
                </div>
              </div>
              {dataset.cdn && <Badge variant="secondary">CDN</Badge>}
            </div>

            {/* Dataset Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Size</span>
                </div>
                <span className="text-sm font-medium">{sizeStr}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Provider</span>
                </div>
                <span className="text-sm font-medium">{dataset.provider.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Storage Type</span>
                </div>
                <Badge variant={dataset.cdn ? "default" : isIpfs ? "default" : "secondary"}>
                  {dataset.cdn ? "CDN Enabled" : isIpfs ? "IPFS Enabled" : "Standard"}
                </Badge>
              </div>
            </div>

            {/* Provider Details */}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Provider Information</h4>
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Provider ID</span>
                  <span className="text-xs font-medium font-mono">
                    {dataset.provider.id.toString()}
                  </span>
                </div>
                {dataset.serviceURL && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Service URL</span>
                    <span className="text-xs font-medium text-right break-all max-w-[200px]">
                      {dataset.serviceURL}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Storage Stats */}
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Storage Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{dataset.pieces.length}</p>
                  <p className="text-xs text-muted-foreground">Total Pieces</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-2xl font-bold">{sizeStr.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{sizeStr.split(" ")[1] || "Size"}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
