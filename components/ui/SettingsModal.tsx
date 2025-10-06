"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfig } from "@/providers/ConfigProvider";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { config, updateConfig, resetConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    updateConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    resetConfig();
    setLocalConfig({
      storageCapacity: 10,
      persistencePeriod: 30,
      minDaysThreshold: 10,
      withCDN: true,
    });
  };

  const handleInputChange = (key: keyof typeof localConfig, value: number | boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm  z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md z-50"
          >
            <div
              className="rounded-lg p-6 w-full max-h-full overflow-y-auto"
              style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="Close settings"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <div className="space-y-6">
                {/* Storage Capacity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Storage Capacity (GB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={localConfig.storageCapacity}
                    onChange={(e) => handleInputChange('storageCapacity', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    The number of GB of storage capacity needed to be sufficient
                  </p>
                </div>

                {/* Persistence Period */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Persistence Period (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={localConfig.persistencePeriod}
                    onChange={(e) => handleInputChange('persistencePeriod', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    The number of days of lockup needed to be sufficient
                  </p>
                </div>

                {/* Min Days Threshold */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Minimum Days Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={localConfig.minDaysThreshold}
                    onChange={(e) => handleInputChange('minDaysThreshold', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    The minimum number of days of lockup needed to notify for more storage
                  </p>
                </div>

                {/* CDN Option */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={localConfig.withCDN}
                      onChange={(e) => handleInputChange('withCDN', e.target.checked)}
                      className="w-4 h-4 rounded transition-colors"
                      style={{
                        accentColor: 'var(--primary)',
                      }}
                    />
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      Use CDN for faster retrieval
                    </span>
                  </label>
                  <p className="text-xs ml-7" style={{ color: 'var(--muted-foreground)' }}>
                    Whether to use CDN for the storage for faster retrieval
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--muted)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}