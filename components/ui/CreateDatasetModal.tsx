"use client";

import { useState, useEffect } from "react";
import { useCreateDataset } from "@/hooks/useCreateDataset";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useProviders } from "@filoz/synapse-react";

/** Props for CreateDatasetModal component */
type CreateDatasetModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal for creating new Filecoin storage datasets.
 * Dataset: A container for storing multiple files (pieces) on Filecoin with a specific provider.
 * Allows provider selection (random or manual) and CDN configuration.
 * Progress stages: 10% payment, 45% creation started, 80% transaction, 90% provider, 100% complete.
 * Automatically closes 2 seconds after successful creation.
 *
 * @param isOpen - Modal visibility state
 * @param onClose - Callback to close modal
 *
 * @example
 * ```tsx
 * <CreateDatasetModal
 *   isOpen={showCreate}
 *   onClose={() => setShowCreate(false)}
 * />
 * ```
 */
export function CreateDatasetModal({
  isOpen,
  onClose,
}: CreateDatasetModalProps) {
  const [withCDN, setWithCDN] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<
    number | undefined
  >(undefined);
  const [useRandomProvider, setUseRandomProvider] = useState(true);

  const { createDataSetMutation, progress, status, handleReset } =
    useCreateDataset();
  const {
    data: providers = [],
    isLoading: providersLoading,
    error: providersError,
  } = useProviders();

  // Auto-close modal when dataset creation is complete
  // 2-second delay allows user to see success message before modal closes
  useEffect(() => {
    if (createDataSetMutation.isSuccess && progress === 100) {
      const timer = setTimeout(() => {
        onClose();
        handleReset();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [createDataSetMutation.isSuccess, progress, onClose, handleReset]);

  /** Initiates dataset creation with selected provider and CDN configuration */
  const handleCreate = () => {
    const providerId = useRandomProvider ? undefined : selectedProviderId;
    const provider =
      providers.find((p) => p.id.toString() === providerId?.toString()) ??
      providers[Math.floor(Math.random() * providers.length)];
    createDataSetMutation.mutate({ withCDN, provider });
  };

  /** Prevents closing during creation to avoid interrupting transaction */
  const handleClose = () => {
    if (!createDataSetMutation.isPending) {
      onClose();
      handleReset();
    }
  };

  const isCreating = createDataSetMutation.isPending;
  const hasError = createDataSetMutation.isError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Dataset"
      closeOnBackdrop={!isCreating}
      footer={
        <>
          <Button
            onClick={handleClose}
            disabled={isCreating}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || (!useRandomProvider && !selectedProviderId)}
            variant="primary"
          >
            {isCreating ? "Creating..." : "Create Dataset"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Storage Provider
          </label>

          {/* Provider Selection:
                      Random (recommended): SDK selects optimal provider based on availability and performance
                      Manual selection: Useful for specific provider requirements or testing */}
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={useRandomProvider}
                onChange={() => setUseRandomProvider(true)}
                disabled={isCreating}
                className="w-4 h-4 transition-colors"
                style={{
                  accentColor: "var(--primary)",
                }}
              />
              <span className="text-sm" style={{ color: "var(--foreground)" }}>
                Use random provider (recommended)
              </span>
            </label>

            {/* Manual Provider Selection */}
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={!useRandomProvider}
                onChange={() => setUseRandomProvider(false)}
                disabled={isCreating}
                className="w-4 h-4 transition-colors"
                style={{
                  accentColor: "var(--primary)",
                }}
              />
              <span className="text-sm" style={{ color: "var(--foreground)" }}>
                Choose specific provider
              </span>
            </label>

            {/* Provider dropdown - filtered to show active and approved storage providers */}
            {!useRandomProvider && (
              <div className="ml-7 space-y-2">
                {providersLoading ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Loading providers...
                  </p>
                ) : providersError ? (
                  <p
                    className="text-sm"
                    style={{ color: "var(--destructive)" }}
                  >
                    Error loading providers: {providersError.message}
                  </p>
                ) : providers && providers.length > 0 ? (
                  <Select
                    value={selectedProviderId?.toString() || ""}
                    onChange={(value) =>
                      setSelectedProviderId(value ? Number(value) : undefined)
                    }
                    disabled={isCreating}
                    placeholder="Select a provider"
                    options={providers.map((provider) => ({
                      value: provider.id.toString(),
                      label: provider.name || `Provider ${provider.id}`,
                    }))}
                  />
                ) : (
                  <p
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    No providers available
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Choose a storage provider for your dataset
          </p>
        </div>

        {/* CDN Option */}
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={withCDN}
              onChange={(e) => setWithCDN(e.target.checked)}
              disabled={isCreating}
              className="w-4 h-4 rounded transition-colors"
              style={{
                accentColor: "var(--primary)",
              }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--foreground)" }}
            >
              Use CDN for faster retrieval
            </span>
          </label>
          <p
            className="text-xs ml-7"
            style={{ color: "var(--muted-foreground)" }}
          >
            Enable CDN for improved download speeds
          </p>
        </div>

        {/* Status Display */}
        {(isCreating || hasError || createDataSetMutation.isSuccess) && (
          <div className="space-y-3">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: hasError
                  ? "var(--destructive-bg)"
                  : "var(--muted)",
                borderColor: hasError ? "var(--destructive)" : "var(--border)",
              }}
            >
              <p
                className="text-sm font-medium"
                style={{
                  color: hasError ? "var(--destructive)" : "var(--foreground)",
                }}
              >
                {status}
              </p>

              {/* Progress Bar */}
              {isCreating && progress > 0 && (
                <div className="mt-3">
                  <div
                    className="w-full bg-gray-200 rounded-full h-2"
                    style={{ backgroundColor: "var(--muted-foreground)" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: "var(--primary)",
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {progress}% complete
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
