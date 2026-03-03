"use client";

import type { UploadMode } from "@/app/upload/types";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const MODES: { value: UploadMode; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "cdn", label: "Beam" },
  { value: "pin", label: "Filecoin Pin" },
];

interface StorageModeSelectorProps {
  mode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
  disabled?: boolean;
}

export function StorageModeSelector({ mode, onModeChange, disabled }: StorageModeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Storage Mode</Label>
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            disabled={disabled}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md font-medium transition-colors",
              mode === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "cdn" && (
        <p className="text-xs text-muted-foreground italic">
          Files served via CDN for fast delivery. Only CDN-enabled datasets shown.
        </p>
      )}
      {mode === "pin" && (
        <p className="text-xs text-muted-foreground italic">
          Files wrapped into a single (.car) file. Make your files available on IPFS.
        </p>
      )}
    </div>
  );
}
