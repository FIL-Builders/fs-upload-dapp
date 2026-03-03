import { scopeKey } from "@/lib";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  storageCapacity: 150,
  persistencePeriod: 365,
  minDaysThreshold: 50,
};

export interface StorageConfig {
  storageCapacity: number;
  persistencePeriod: number;
  minDaysThreshold: number;
}

interface StorageConfigState {
  config: StorageConfig;
  /** Current wallet scope for lookups. */
  scope: { address: string; chainId: number } | null;
  /** Persisted map of all configs keyed by address-chainId. */
  configs: Record<string, StorageConfig>;
  modalOpen: boolean;

  hydrate: (address: string, chainId: number) => void;
  updateConfig: (patch: Partial<StorageConfig>) => void;
  resetConfig: () => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useStorageConfigStore = create<StorageConfigState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_STORAGE_CONFIG,
      scope: null,
      configs: {},
      modalOpen: false,

      hydrate: (address, chainId) => {
        const key = scopeKey(address, chainId);
        set((s) => ({
          scope: { address, chainId },
          config: s.configs[key] ?? DEFAULT_STORAGE_CONFIG,
        }));
      },

      updateConfig: (patch) => {
        const { scope, config } = get();
        const updated = { ...config, ...patch };
        if (!scope) {
          set({ config: updated });
          return;
        }
        const key = scopeKey(scope.address, scope.chainId);
        set((s) => ({
          config: updated,
          configs: { ...s.configs, [key]: updated },
        }));
      },

      resetConfig: () => {
        const { scope } = get();
        if (!scope) {
          set({ config: DEFAULT_STORAGE_CONFIG });
          return;
        }
        const key = scopeKey(scope.address, scope.chainId);
        set((s) => {
          const { [key]: _, ...rest } = s.configs;
          return { config: DEFAULT_STORAGE_CONFIG, configs: rest };
        });
      },

      openModal: () => set({ modalOpen: true }),
      closeModal: () => set({ modalOpen: false }),
    }),
    {
      name: "storage-config-store",
      partialize: (state) => ({ configs: state.configs }),
    },
  ),
);
