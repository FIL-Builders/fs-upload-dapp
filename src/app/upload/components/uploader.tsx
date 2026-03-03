"use client";

import { useCallback, useState } from "react";
import {
  CopiesSelector,
  FileDropZone,
  FileItem,
  StorageModeSelector,
  UploadFeedbackPanel,
} from "@/app/upload/components/upload-controls";
import { useFilecoinPinUpload } from "@/app/upload/hooks/use-pin-upload";
import { useUpload } from "@/app/upload/hooks/use-upload";
import { Trash2, Upload } from "lucide-react";
import { pluralize } from "@/lib/format";
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
      pinHook.upload({
        files,
        copies,
      });
    } else {
      setActivePinMode(false);
      uploadHook.upload({
        files,
        copies,
        withCDN: mode === "cdn",
      });
    }
  }, [files, mode, copies, uploadHook, pinHook]);

  // --- Derived values ---
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const canUpload = files.length > 0;

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

      <CopiesSelector copies={copies} onCopiesChange={setCopies} disabled={isActive} />

      <Separator />

      <Button className="w-full" size="lg" onClick={handleUpload} disabled={!canUpload || isActive}>
        <Upload className="mr-2 h-4 w-4" />
        {files.length === 0
          ? "Select files to upload"
          : `Upload ${files.length} ${pluralize(files.length, "file")} → ${copies} ${pluralize(copies, "destination")}`}
      </Button>
    </div>
  );
}
