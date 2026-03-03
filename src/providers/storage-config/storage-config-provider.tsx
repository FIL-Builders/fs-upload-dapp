"use client";

import { useEffect } from "react";
import { useConnection } from "wagmi";
import { StorageConfigModal } from "./storage-config-modal";
import { useStorageConfigStore } from "./storage-config-store";

export function StorageConfigProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId } = useConnection();
  const hydrate = useStorageConfigStore((s) => s.hydrate);

  useEffect(() => {
    if (address && chainId) hydrate(address, chainId);
  }, [address, chainId, hydrate]);

  return (
    <>
      {children}
      <StorageConfigModal />
    </>
  );
}

StorageConfigProvider.displayName = "StorageConfigProvider";
