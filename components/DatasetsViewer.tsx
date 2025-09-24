// components/ViewProofSets.tsx
"use client";

import { useAccount } from "wagmi";
import { useDatasets } from "@/hooks/useDatasets";
import { useDownloadPiece } from "@/hooks/useDownloadPiece";
import { DataSet } from "@/types";
import { DataSetPieceData } from "@filoz/synapse-sdk";
import { CopyableURL } from "@/components/ui/CopyableURL";
import { useQueryClient } from "@tanstack/react-query";
import { getAllQueryKeys } from "@/utils/constants";
import { useEffect } from "react";

export const DatasetsViewer = () => {
  const { isConnected } = useAccount();
  const { address } = useAccount();
  const { data, isLoading: isLoadingDatasets } = useDatasets();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (address) {
      queryClient.invalidateQueries({ queryKey: getAllQueryKeys(address) });
    }
  }, [address]);

  if (!isConnected) {
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
      </div>

      {isLoadingDatasets ? (
        <div className="flex justify-center items-center py-8">
          <p style={{ color: "var(--muted-foreground)" }}>
            Loading datasets...
          </p>
        </div>
      ) : data && data.datasets && data.datasets.length > 0 ? (
        <div className="mt-4 space-y-6">
          {data.datasets.map(
            (dataset: DataSet | undefined) =>
              dataset && (
                <div
                  key={dataset.clientDataSetId}
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: "var(--muted)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4
                        className="text-lg font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        Dataset #{dataset.pdpVerifierDataSetId}
                      </h4>
                      <p
                        className="text-sm mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
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
                        PDP URL:{" "}
                        <CopyableURL
                          url={dataset.provider?.products.PDP?.data.serviceURL}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {dataset.message}
                      </p>

                      <p
                        className="text-sm"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Commission: {dataset.commissionBps / 100}%
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
                    <h5
                      className="text-sm font-medium mb-2"
                      style={{ color: "var(--foreground)" }}
                    >
                      Piece Details
                    </h5>
                    <div
                      className="rounded-lg border p-4"
                      style={{
                        backgroundColor: "var(--card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Current Piece Count
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "var(--foreground)" }}
                          >
                            {dataset.currentPieceCount}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-sm"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Next Piece ID
                          </p>
                          <p
                            className="font-medium"
                            style={{ color: "var(--foreground)" }}
                          >
                            {dataset.nextPieceId}
                          </p>
                        </div>
                      </div>

                      {dataset.data?.pieces && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h6
                              className="text-sm font-medium"
                              style={{ color: "var(--foreground)" }}
                            >
                              Available Pieces
                            </h6>
                            <p
                              className="text-sm"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Next Challenge: Epoch{" "}
                              {dataset.data.nextChallengeEpoch}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {dataset.data.pieces.map((piece) => (
                              <PieceDetails
                                key={piece.pieceId}
                                piece={piece}
                                pieceSizeMiB={
                                  dataset.pieceSizes[piece.pieceCid.toString()]
                                    .sizeMiB
                                }
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
    </div>
  );
};

/**
 * Component to display a piece and a download button
 */
const PieceDetails = ({
  piece,
  pieceSizeMiB,
}: {
  piece: DataSetPieceData;
  pieceSizeMiB: number;
}) => {
  const filename = `piece-${piece.pieceCid}`;
  const { downloadMutation } = useDownloadPiece(
    piece.pieceCid.toString(),
    filename
  );

  return (
    <div
      key={piece.pieceId.toString()}
      className="flex items-center justify-between p-2 rounded border"
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
          {piece.pieceCid.toString()}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "var(--muted-foreground)" }}
        >
          {`File size: ${Number(pieceSizeMiB.toFixed(4))} MB`}
        </p>
      </div>
      <button
        onClick={() => downloadMutation.mutate()}
        disabled={downloadMutation.isPending}
        className="ml-4 px-3 py-1 text-sm rounded-lg border-2 cursor-pointer transition-all disabled:cursor-not-allowed"
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
        {downloadMutation.isPending ? "Downloading..." : "Download"}
      </button>
    </div>
  );
};
