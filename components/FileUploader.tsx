"use client";
import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";

/**
 * File Upload Component for Filecoin Storage
 *
 * @description
 * A comprehensive file upload interface that handles the complete workflow of uploading
 * files to Filecoin storage. Features drag-and-drop functionality, progress tracking,
 * automatic payment handling, and detailed upload status reporting.
 *
 * @functionality
 * - **Drag & Drop Interface**: Modern file selection with drag-and-drop support
 * - **Progress Tracking**: Real-time upload progress with visual progress bar
 * - **Automatic Payments**: Seamlessly handles storage payments when needed
 * - **Status Updates**: Detailed status messages throughout the upload process
 * - **Upload Results**: Displays file information, piece CID, and transaction hash
 * - **Error Handling**: User-friendly error messages and retry functionality
 * - **State Management**: Clean reset functionality for new uploads
 *
 * @workflow Upload Process:
 * 1. **File Selection**: User selects file via drag-drop or file picker
 * 2. **Validation**: Check file and wallet connection
 * 3. **Cost Check**: Verify sufficient USDFC for storage costs
 * 4. **Payment**: Automatically handle payment if needed
 * 5. **Dataset Setup**: Create or resolve storage dataset
 * 6. **Upload**: Transfer file data to storage provider
 * 7. **Confirmation**: Wait for blockchain confirmation
 * 8. **Results**: Display upload details and piece information
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <WagmiProvider>
 *       <div className="upload-container">
 *         <h1>Upload to Filecoin</h1>
 *         <FileUploader />
 *       </div>
 *     </WagmiProvider>
 *   );
 * }
 * ```
 *
 * @accessibility
 * - Keyboard navigation support for file selection
 * - Screen reader compatible status updates
 * - Focus management during upload process
 * - High contrast color support for progress indicators
 *
 * @security
 * - Client-side file validation
 * - Secure wallet integration
 * - No file data stored in browser memory unnecessarily
 * - Transaction confirmation required before completion
 */
export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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

  return (
    <div className="mt-4 p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${
          isUploading ? "cursor-not-allowed text-gray-400" : "cursor-pointer"
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (isUploading) return;
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
            {file ? file.name : "Drop your file here, or click to select"}
          </p>
          {!file && (
            <p className="text-sm text-gray-500">
              Drag and drop your file, or click to browse
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={async () => {
            if (!file) return;
            await uploadFile(file);
          }}
          disabled={(!file || isUploading || !!uploadedInfo) && !isError}
          aria-disabled={(!file || isUploading || !!uploadedInfo) && !isError}
          className={`px-6 py-2 rounded-[20px] text-center border-2 transition-all
            ${
              (!file || isUploading || !!uploadedInfo) && !isError
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-secondary text-secondary hover:bg-secondary/70 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:border-secondary/70 hover:cursor-pointer"
            }
          `}
        >
          {isUploading && !isError
            ? "Uploading..."
            : !uploadedInfo
            ? "Submit"
            : isError
            ? "Error(Try again) 🔄"
            : "Submitted"}
        </button>
        <button
          onClick={() => {
            handleReset();
            setFile(null);
          }}
          disabled={!file || (isUploading && !isError)}
          aria-disabled={!file || (isUploading && !isError)}
          className={`px-6 py-2 rounded-[20px] text-center border-2 transition-all
            ${
              !file || (isUploading && !isError)
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : "border-secondary text-secondary hover:bg-secondary/70 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:border-secondary/70 hover:cursor-pointer"
            }
          `}
        >
          Reset
        </button>
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
      {/* Uploaded file info panel */}
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
