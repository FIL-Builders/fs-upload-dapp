"use client";

import { useState } from "react";
import { useConfig } from "@/providers/ConfigProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/** Props for SettingsModal component */
type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal for configuring storage settings.
 * Allows users to set storage capacity, persistence period, minimum threshold, and CDN preference.
 * Settings are persisted via ConfigProvider context and affect all storage calculations.
 *
 * @param isOpen - Modal visibility state
 * @param onClose - Callback to close modal
 *
 * @example
 * ```tsx
 * <SettingsModal
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 * />
 * ```
 */
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, updateConfig, resetConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);

  /** Saves configuration to context and closes modal */
  const handleSave = () => {
    updateConfig(localConfig);
    onClose();
  };

  /**
   * Resets settings to default values.
   * Defaults: 10 GB capacity, 30 days persistence, 10 days threshold, CDN enabled.
   * These provide reasonable starting values for typical storage needs.
   */
  const handleReset = () => {
    resetConfig();
    setLocalConfig(config);
  };

  /** Type-safe input change handler using keyof pattern */
  const handleInputChange = (
    key: keyof typeof localConfig,
    value: number | boolean
  ) => {
    setLocalConfig((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      footer={
        <>
          <Button onClick={handleReset} variant="secondary">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} variant="primary">
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Storage Capacity: Total GB allocated for file storage (affects cost calculations) */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Storage Capacity (GB)
          </label>
          <input
            type="number"
            min="25"
            max="1000"
            value={localConfig.storageCapacity}
            onChange={(e) =>
              handleInputChange(
                "storageCapacity",
                parseInt(e.target.value) || 1
              )
            }
            className="w-full px-3 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            The number of GB of storage capacity you want to allocate.
          </p>
        </div>

        {/* Persistence Period: Days to keep files stored (determines lockup amount) */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Persistence Period (days)
          </label>
          <input
            type="number"
            min="30"
            value={localConfig.persistencePeriod}
            onChange={(e) =>
              handleInputChange(
                "persistencePeriod",
                parseInt(e.target.value) || 1
              )
            }
            className="w-full px-3 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            The number of days that you want to keep your files stored.
          </p>
        </div>

        {/* Min Days Threshold: Minimum days required before insufficient warning (safety buffer) */}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium"
            style={{ color: "var(--foreground)" }}
          >
            Notification Period
          </label>
          <input
            type="number"
            min="30"
            value={localConfig.minDaysThreshold}
            onChange={(e) =>
              handleInputChange(
                "minDaysThreshold",
                parseInt(e.target.value) || 1
              )
            }
            className="w-full px-3 py-2 rounded-lg border transition-colors"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            The number of days before the app will notify you to pay for more
            storage. By default you always need to pay for 30 days in advance.
          </p>
        </div>

        {/* CDN: Content Delivery Network for faster file retrieval (higher cost) */}
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={localConfig.withCDN}
              onChange={(e) => handleInputChange("withCDN", e.target.checked)}
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
            Whether to use CDN for the storage for faster retrieval
          </p>
        </div>
      </div>
    </Modal>
  );
}
