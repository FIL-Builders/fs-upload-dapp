"use client";

import { useCallback, useRef, useState } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  allowFolders?: boolean;
}

// Extended File interface with webkitRelativePath
interface FileWithPath extends File {
  webkitRelativePath: string;
}

// Recursively read all files from a directory entry
async function readDirectoryEntries(
  dirEntry: FileSystemDirectoryEntry,
  basePath: string = "",
): Promise<FileWithPath[]> {
  const files: FileWithPath[] = [];
  const reader = dirEntry.createReader();

  // Read entries in batches (readEntries may not return all entries at once)
  const readBatch = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  let entries: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];
  do {
    batch = await readBatch();
    entries = entries.concat(batch);
  } while (batch.length > 0);

  for (const entry of entries) {
    const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      // Create a new File object with the relative path
      const fileWithPath = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified,
      }) as FileWithPath;
      Object.defineProperty(fileWithPath, "webkitRelativePath", {
        value: entryPath,
        writable: false,
      });
      files.push(fileWithPath);
    } else if (entry.isDirectory) {
      const subFiles = await readDirectoryEntries(entry as FileSystemDirectoryEntry, entryPath);
      files.push(...subFiles);
    }
  }

  return files;
}

// Process dropped items (files and directories)
async function processDroppedItems(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = [];
  const items = Array.from(dataTransfer.items);

  for (const item of items) {
    if (item.kind !== "file") continue;

    const entry = item.webkitGetAsEntry?.();
    if (!entry) {
      // Fallback: just get the file directly
      const file = item.getAsFile();
      if (file) files.push(file);
      continue;
    }

    if (entry.isFile) {
      const file = item.getAsFile();
      if (file) files.push(file);
    } else if (entry.isDirectory) {
      const dirFiles = await readDirectoryEntries(entry as FileSystemDirectoryEntry, entry.name);
      files.push(...dirFiles);
    }
  }

  return files;
}

export function FileDropZone({ onFilesSelected, disabled, allowFolders = true }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      // Process items to handle directories
      const droppedFiles = await processDroppedItems(e.dataTransfer);
      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      }
    },
    [disabled, onFilesSelected],
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const handleFolderClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        folderInputRef.current?.click();
      }
    },
    [disabled],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFilesSelected(selectedFiles);
      }
      // Reset input so same files can be selected again
      e.target.value = "";
    },
    [onFilesSelected],
  );

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-muted-foreground/25 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      {allowFolders && (
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error - webkitdirectory is not in the type definitions
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      )}
      <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
      <p className="text-sm font-medium mb-1">
        {isDragging ? "Drop files or folders here" : "Drag & drop files or folders here"}
      </p>
      <p className="text-xs text-muted-foreground mb-2">or click to select files</p>
      {allowFolders && (
        <button
          type="button"
          onClick={handleFolderClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs text-primary hover:underline",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Select a folder
        </button>
      )}
    </div>
  );
}
