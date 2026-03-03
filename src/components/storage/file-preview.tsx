"use client";

import { useState } from "react";
import { FileIcon } from "lucide-react";
import { useConnection } from "wagmi";
import { buildPieceUrl, type OpenPieceParams } from "@/lib/piece";
import { Skeleton } from "@/components/ui/skeleton";

interface FilePreviewProps {
  accessParams: OpenPieceParams;
  size?: number;
  className?: string;
  alt?: string;
}

export function FilePreview({
  accessParams,
  size = 25,
  className = "",
  alt = "Preview",
}: FilePreviewProps) {
  const { address } = useConnection();
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { pieceCid, isCDN, serviceURL, withIPFSIndexing, ipfsRootCid } = accessParams;
  const previewUrl = address
    ? buildPieceUrl({ pieceCid, isCDN, address, serviceURL, withIPFSIndexing, ipfsRootCid })
    : null;

  if (hasError || !previewUrl) {
    return (
      <div
        className={`rounded-md bg-muted flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <FileIcon className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {isLoading && (
        <Skeleton className="absolute inset-0 rounded-md" style={{ width: size, height: size }} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={previewUrl}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-md object-cover ${className} ${isLoading ? "opacity-0" : "opacity-100"}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
