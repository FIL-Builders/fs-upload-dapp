"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CopiesSelector,
  FileDropZone,
  FileItem,
  StorageModeSelector,
  UploadCostPreview,
  UploadFeedbackPanel,
} from "@/app/upload/components/upload-controls";
import { useFilecoinPinUpload } from "@/app/upload/hooks/use-pin-upload";
import { useUpload } from "@/app/upload/hooks/use-upload";
import { useUploadCostPreview } from "@/app/upload/hooks/use-upload-cost-preview";
import { AlertTriangle, Loader2, RotateCcw, Trash2, Upload } from "lucide-react";
import { pluralize } from "@/lib/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { UploadMode } from "../types";

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function Uploader() {
  const uploadHook = useUpload();
  const pinHook = useFilecoinPinUpload();

  // --- Files ---
  const [files, setFiles] = useState<File[]>([]);

  // --- Mode ---
  const [mode, setMode] = useState<UploadMode>("standard");

  // --- Copies + Destinations ---
  const [copies, setCopies] = useState(1);

  // --- Derived values ---
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  // --- Upload plan + cost preview (single source of truth) ---
  const preview = useUploadCostPreview({ sizeBytes: totalSize, copies, mode });

  // --- Provider availability caps copies (one copy per distinct provider) ---
  const counts = preview.counts;
  const maxCopies = counts ? Math.max(1, counts.reachable) : undefined;
  const copiesHint =
    counts && counts.reachable < 5
      ? `${counts.reachable} of ${counts.approved} ${pluralize(counts.approved, "provider")} reachable`
      : undefined;

  // Clamp copies down if provider availability shrank below the selection
  useEffect(() => {
    if (maxCopies != null && copies > maxCopies) setCopies(maxCopies);
  }, [maxCopies, copies]);

  // --- Active hook tracking ---
  const [activePinMode, setActivePinMode] = useState(false);
  const active = activePinMode ? pinHook : uploadHook;
  const currentPhase = active.phase;
  const isActive = currentPhase.phase !== "idle" && currentPhase.phase !== "done";

  // --- File handlers ---
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map(fileKey));
      return [...prev, ...newFiles.filter((f) => !existing.has(fileKey(f)))];
    });
  }, []);

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Reset ---
  const handleReset = useCallback(() => {
    uploadHook.reset();
    pinHook.reset();
    setActivePinMode(false);
    setFiles([]);
  }, [uploadHook, pinHook]);

  // --- Upload ---
  const handleUpload = useCallback(() => {
    if (files.length === 0) return;

    if (mode === "pin") {
      setActivePinMode(true);
      pinHook.upload({ files, copies });
    } else {
      setActivePinMode(false);
      uploadHook.upload({ files, copies, withCDN: mode === "cdn" });
    }
  }, [files, mode, copies, uploadHook, pinHook]);

  // Upload is allowed only once the current configuration resolves to a provider
  const canUpload = files.length > 0 && !!preview.locations && !preview.error;

  // --- Render: feedback (active / failed / done) ---
  if (currentPhase.phase !== "idle") {
    return (
      <UploadFeedbackPanel
        phase={currentPhase}
        fileCount={files.length}
        copies={copies}
        onReset={handleReset}
      />
    );
  }

  // --- Gate: block all actions until storage providers are resolved ---
  if (!preview.ready) {
    if (preview.fetchError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{preview.fetchError.headline}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{preview.fetchError.detail}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={preview.retry}
              disabled={preview.isRefreshing}
              className="w-full"
            >
              {preview.isRefreshing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
              )}
              {preview.isRefreshing ? "Retrying…" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking available storage providers…</p>
      </div>
    );
  }

  // --- Render: main form ---
  return (
    <div className="space-y-6">
      <FileDropZone onFilesSelected={handleFilesSelected} disabled={isActive} allowFolders />

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {files.length} {pluralize(files.length, "file")}
              <span className="text-muted-foreground ml-2">
                ({(totalSize / 1024 / 1024).toFixed(2)} MB)
              </span>
            </p>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                disabled={isActive}
                className="text-muted-foreground hover:text-destructive h-7 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            )}
          </div>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {files.map((file, index) => (
              <FileItem
                key={fileKey(file)}
                file={file}
                onRemove={() => handleRemoveFile(index)}
                disabled={isActive}
              />
            ))}
          </div>
        </div>
      )}

      <Separator />

      <StorageModeSelector mode={mode} onModeChange={setMode} disabled={isActive} />

      <CopiesSelector
        copies={copies}
        onCopiesChange={setCopies}
        disabled={isActive}
        max={maxCopies}
        hint={copiesHint}
      />

      <Separator />

      <UploadCostPreview preview={preview} fileCount={files.length} mode={mode} />

      <Button className="w-full" size="lg" onClick={handleUpload} disabled={!canUpload || isActive}>
        <Upload className="mr-2 h-4 w-4" />
        {files.length === 0
          ? "Select files to upload"
          : `Upload ${files.length} ${pluralize(files.length, "file")} → ${copies} ${pluralize(copies, "destination")}`}
      </Button>
    </div>
  );
}
