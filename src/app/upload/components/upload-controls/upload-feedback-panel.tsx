"use client";

import { UploadResults } from "@/app/upload/components/upload-results";
import { UploadStatusPanel } from "@/app/upload/components/upload-status-panel";
import type { UploadPhase } from "@/app/upload/types";

interface UploadFeedbackPanelProps {
  phase: UploadPhase;
  fileCount: number;
  copies: number;
  onReset: () => void;
}

export function UploadFeedbackPanel({
  phase,
  fileCount,
  copies,
  onReset,
}: UploadFeedbackPanelProps) {
  if (phase.phase === "idle") {
    return null;
  }

  if (phase.phase === "done") {
    return <UploadResults result={phase.result} onReset={onReset} />;
  }

  return (
    <UploadStatusPanel phase={phase} fileCount={fileCount} copies={copies} onRetry={onReset} />
  );
}
