"use client";

import { File, X } from "lucide-react";
import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileItemProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

export function FileItem({ file, onRemove, disabled }: FileItemProps) {
  return (
    <div className={cn("rounded-lg border bg-card", disabled && "opacity-60")}>
      <div className="flex items-center gap-3 px-3 py-2">
        <File className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={disabled}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
