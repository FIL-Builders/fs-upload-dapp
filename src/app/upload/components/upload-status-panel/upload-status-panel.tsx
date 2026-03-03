"use client";

import type { UploadPhase } from "@/app/upload/types";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadProvidersList } from "./upload-providers-list";
import { UploadStatusHeader } from "./upload-status-header";
import { UploadStepsTimeline } from "./upload-steps-timeline";

interface UploadStatusPanelProps {
  phase: UploadPhase;
  fileCount: number;
  copies: number;
  onRetry?: () => void;
}

export function UploadStatusPanel({ phase, fileCount, copies, onRetry }: UploadStatusPanelProps) {
  if (phase.phase === "idle" || phase.phase === "done") {
    return null;
  }

  return (
    <Card className="gap-0">
      <UploadStatusHeader phase={phase} fileCount={fileCount} copies={copies} />
      <CardContent className="space-y-4">
        <UploadStepsTimeline steps={phase.steps} />
        <UploadProvidersList providers={phase.providers} />

        {phase.phase === "failed" && (
          <div className="space-y-3 pt-1">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{phase.error}</AlertDescription>
            </Alert>
            {onRetry && (
              <Button variant="outline" onClick={onRetry} className="w-full">
                Try again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
