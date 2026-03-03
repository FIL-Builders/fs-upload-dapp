"use client";

import { useStorageConfigStore } from "@/providers/storage-config";

export function useStorageConfig() {
  const config = useStorageConfigStore((s) => s.config);
  const updateConfig = useStorageConfigStore((s) => s.updateConfig);
  const resetConfig = useStorageConfigStore((s) => s.resetConfig);
  return { config, updateConfig, resetConfig };
}
