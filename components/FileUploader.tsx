"use client";
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { DataSet } from "@/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

/**
 * File upload interface with drag-and-drop, progress tracking, and automatic payment handling.
 * Requires dataset selection before upload. Displays upload status and results (CID, tx hash).
 *
 * @param datasetsData - Available datasets for file storage
 * @param isLoadingDatasets - Loading state for datasets
 */
export const FileUploader = ({
  datasetsData,
  isLoadingDatasets,
}: {
  datasetsData: DataSet[];
  isLoadingDatasets: boolean;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");

  const { isConnected } = useAccount();

  const { uploadFileMutation, uploadedInfo, handleReset, status, progress } =
    useFileUpload();

  const {
    isPending: isUploading,
    mutateAsync: uploadFile,
    isError,
  } = uploadFileMutation;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  if (!isConnected) {
    return null;
  }

  const hasDatasets = datasetsData.length > 0;

  // Map dataset IDs to CDN configuration for upload
  const datasetIdToWithCDN = datasetsData.reduce((acc, dataset) => {
    if (dataset) {
      acc[dataset.pdpVerifierDataSetId] = dataset.withCDN;
    }
    return acc;
  }, {} as Record<string, boolean>);

  return (
    <div className="mt-4 p-6">
      {/* Dataset Selection Section */}
      <div className="mb-6">
        {isLoadingDatasets ? (
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
            }}
          >
            Loading datasets...
          </div>
        ) : !hasDatasets ? (
          <div
            className="p-4 rounded-lg border text-center"
            style={{
              backgroundColor: "var(--muted)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="text-sm mb-3"
              style={{ color: "var(--muted-foreground)" }}
            >
              No active datasets found. You need to create a dataset before
              uploading files.
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              👉 Go to the <strong>Datasets</strong> tab to create a new dataset
              first.
            </p>
          </div>
        ) : (
          <Select
            label="Select Dataset"
            value={selectedDatasetId}
            onChange={setSelectedDatasetId}
            disabled={isUploading}
            placeholder="Select a dataset to upload to"
            helperText="Choose which dataset to store your file in"
            options={datasetsData.map((dataset) => ({
              value: dataset.pdpVerifierDataSetId.toString(),
              label: `Dataset #${dataset.pdpVerifierDataSetId} ${
                dataset.withCDN ? "⚡" : ""
              }`,
            }))}
          />
        )}
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${
          isUploading || !hasDatasets
            ? "cursor-not-allowed text-gray-400"
            : "cursor-pointer"
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (isUploading || !hasDatasets) return;
          document.getElementById("fileInput")?.click();
        }}
      >
        <input
          id="fileInput"
          type="file"
          onChange={(e) => {
            e.target.files && setFile(e.target.files[0]);
            e.target.value = "";
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-10 h-10 ${
              isDragging ? "text-blue-500" : "text-gray-400"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-lg font-medium">
            {!hasDatasets
              ? "Create a dataset first to upload files"
              : file
              ? file.name
              : "Drop your file here, or click to select"}
          </p>
          {!file && hasDatasets && (
            <p className="text-sm text-gray-500">
              Drag and drop your file, or click to browse
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <Button
          onClick={async () => {
            if (!file || !selectedDatasetId) return;
            await uploadFile({
              file,
              datasetId: selectedDatasetId,
              withCDN: datasetIdToWithCDN[selectedDatasetId],
            });
          }}
          disabled={
            (!file || !selectedDatasetId || isUploading || !!uploadedInfo) &&
            !isError
          }
        >
          {isUploading && !isError
            ? "Uploading..."
            : !uploadedInfo
            ? "Submit"
            : isError
            ? "Error(Try again) 🔄"
            : "Submitted"}
        </Button>
        <Button
          onClick={() => {
            handleReset();
            setFile(null);
          }}
          disabled={!file || (isUploading && !isError)}
        >
          Reset
        </Button>
      </div>
      {status && (
        <div className="mt-4 text-center">
          <p
            className={`text-sm
              ${
                status.includes("❌")
                  ? "text-red-500"
                  : status.includes("✅") || status.includes("🎉")
                  ? "text-green-500"
                  : "text-secondary"
              }
            `}
          >
            {status}
          </p>
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 ">
              <div
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      {uploadedInfo && !isUploading && (
        <div className="mt-6 bg-background border border-border rounded-xl p-4 text-left">
          <h4 className="font-semibold mb-2 text-foreground">
            File Upload Details
          </h4>
          <div className="text-sm text-foreground">
            <div>
              <span className="font-medium">File name:</span>{" "}
              {uploadedInfo.fileName}
            </div>
            <div>
              <span className="font-medium">File size:</span>{" "}
              {uploadedInfo.fileSize?.toLocaleString() || "N/A"} bytes
            </div>
            <div className="break-all">
              <span className="font-medium">Piece CID:</span>{" "}
              {uploadedInfo.pieceCid}
            </div>
            <div className="break-all">
              <span className="font-medium">Tx Hash:</span>{" "}
              {uploadedInfo.txHash}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
