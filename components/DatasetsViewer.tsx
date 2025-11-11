// components/DatasetsViewer.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import {
  useDownloadPiece,
  useOpenPieceDataInNewTab,
} from "@/hooks/useDownloadPiece";
import { CopyableURL } from "@/components/ui/CopyableURL";
import { CreateDatasetModal } from "@/components/ui/CreateDatasetModal";
import { DownloadIcon, EyeIcon, Loader2Icon } from "lucide-react";
import {
  getPieceInfoFromCidBytes,
  getDatasetSizeMessage,
} from "@/utils/storageCalculations";
import { DataSet } from "@/types";
import { DataSetPieceData } from "@filoz/synapse-sdk";
/**
 * Displays and manages user's Filecoin storage datasets.
 * Shows dataset metadata, status, files (pieces), and provides download functionality.
 * Allows creation of new datasets via modal dialog.
 *
 * @param datasetsData - Array of user datasets with pieces and metadata
 * @param isLoadingDatasets - Loading state for datasets fetch
 *
 * @example
 * ```tsx
 * <DatasetsViewer
 *   datasetsData={datasets}
 *   isLoadingDatasets={isLoading}
 * />
 * ```
 */
export const DatasetsViewer = ({
  datasetsData,
  isLoadingDatasets,
}: {
  datasetsData: DataSet[];
  isLoadingDatasets: boolean;
}) => {
  const { isConnected, address } = useAccount();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div
      className="mt-4 p-6 border rounded-lg shadow-sm max-h-[900px] overflow-y-auto"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="flex justify-between items-center pb-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="sticky top-0 z-10"
          style={{ backgroundColor: "var(--card)" }}
        >
          <h3
            className="text-xl font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Datasets
          </h3>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            View and manage your storage datasets
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="sm:px-4 sm:py-1 px-2 py-1 text-sm rounded-lg transition-colors touch-manipulation "
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Create New Dataset
        </button>
      </div>

      {isLoadingDatasets ? (
        <div className="flex justify-center items-center py-8">
          <p style={{ color: "var(--muted-foreground)" }}>
            Loading datasets...
          </p>
        </div>
      ) : datasetsData && datasetsData.length > 0 ? (
        <div className="mt-4 space-y-6">
          {datasetsData.map(
            (dataset: DataSet | undefined) =>
              dataset && (
                <div
                  key={dataset.dataSetId.toString()}
                  className="rounded-lg p-4 border flex flex-col justify-between w-full"
                  style={{
                    backgroundColor: "var(--muted)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex sm:flex-row flex-col justify-between">
                    <div>
                      <h4
                        className="text-lg font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        Dataset #{dataset.dataSetId}
                      </h4>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {/* Status: "Live" = active and accepting files, "Inactive" = not accepting new files */}
                        Status:{" "}
                        <span
                          className="font-medium"
                          style={{
                            color: dataset.isLive
                              ? "var(--success)"
                              : "var(--destructive)",
                          }}
                        >
                          {dataset.isLive ? "Live" : "Inactive"}
                        </span>
                      </p>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        With CDN:{" "}
                        <span
                          className="font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          {dataset.withCDN ? "⚡ Yes ⚡" : "No"}
                        </span>
                      </p>
                      <div
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {/* PDP (Proof of Data Possession) service URL for piece verification and retrieval */}
                        PDP URL: <CopyableURL url={dataset.serviceURL} />
                      </div>
                    </div>
                    <div>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {getDatasetSizeMessage(dataset)}
                      </p>

                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {/* Commission basis points divided by 100 to get percentage (e.g., 500 BPS = 5%) */}
                        Commission: {Number(dataset.commissionBps) / 100}%
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Managed: {dataset.isManaged ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div
                      className="rounded-lg border p-4"
                      style={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      {dataset.data?.pieces && (
                        <div className="w-full">
                          <div className="sm:flex flex-col sm:justify-between items-start mb-2 w-full">
                            <h6
                              className="text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              {`Stored Files: #${dataset.data?.pieces.length}`}
                            </h6>
                          </div>
                          <div className="space-y-2">
                            {dataset.data?.pieces.reverse().map((piece) => (
                              <PieceDetails
                                key={piece.pieceId.toString()}
                                piece={piece}
                                isCDN={dataset.withCDN}
                                pieceSizeMiB={
                                  getPieceInfoFromCidBytes(piece.pieceCid)
                                    .sizeMiB
                                }
                                url={dataset.serviceURL}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center py-8">
          <p style={{ color: "var(--muted-foreground)" }}>No datasets found</p>
        </div>
      )}

      <CreateDatasetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

/**
 * Displays individual piece (file) within a dataset.
 * Shows piece metadata and provides download functionality.
 *
 * @param piece - Piece data including CID and size
 * @param pieceSizeMiB - File size in megabytes
 */
const PieceDetails = ({
  piece,
  pieceSizeMiB,
  isCDN,
  url,
}: {
  piece: DataSetPieceData;
  pieceSizeMiB: number;
  isCDN: boolean;
  url: string;
}) => {
  const filename = `piece-${piece.pieceCid}`;
  const { downloadMutation } = useDownloadPiece(
    piece.pieceCid.toString(),
    filename
  );

  const { openPieceDataInNewTabMutation } = useOpenPieceDataInNewTab(
    piece.pieceCid.toString(),
    isCDN,
    url
  );

  return (
    <div
      key={piece.pieceId.toString()}
      className="sm:flex flex-col justify-between p-2 rounded border"
      style={{
        backgroundColor: "var(--muted)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--foreground)" }}
        >
          Piece #{piece.pieceId}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          {piece?.pieceCid?.toString()}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          {`File size: ${Number(pieceSizeMiB.toFixed(4))} MB`}
        </p>
      </div>
      <div className="flex flex-row justify-end gap-2 p-2">
        <button
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: downloadMutation.isPending
              ? "var(--muted)"
              : "var(--primary)",
            backgroundColor: downloadMutation.isPending
              ? "var(--muted)"
              : "var(--primary)",
            color: downloadMutation.isPending
              ? "var(--muted-foreground)"
              : "var(--primary-foreground)",
          }}
          onMouseEnter={(e) => {
            if (!downloadMutation.isPending) {
              e.currentTarget.style.backgroundColor = "var(--background)";
              e.currentTarget.style.color = "var(--primary)";
            }
          }}
          onMouseLeave={(e) => {
            if (!downloadMutation.isPending) {
              e.currentTarget.style.backgroundColor = "var(--primary)";
              e.currentTarget.style.color = "var(--primary-foreground)";
            }
          }}
        >
          {downloadMutation.isPending ? (
            <Loader2Icon className="sm:size-4 size-2 animate-spin" />
          ) : (
            <DownloadIcon className="sm:size-4 size-2" />
          )}
        </button>
        <button
          onClick={() => openPieceDataInNewTabMutation.mutate()}
          className="sm:ml-4 sm:p-2 p-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
          style={{
            borderColor: "var(--primary)",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {openPieceDataInNewTabMutation.isPending ? (
            <Loader2Icon className="w-4 h-4 animate-spin" />
          ) : (
            <EyeIcon className="w-4 h-4" />
          )}{" "}
        </button>
      </div>
    </div>
  );
};
