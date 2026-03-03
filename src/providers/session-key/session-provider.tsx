"use client";

import { useEffect } from "react";
import { useConnection } from "wagmi";
import { SessionModal } from "./session-modal";
import { useSessionStore } from "./session-store";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { address, chainId } = useConnection();
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    if (address && chainId) hydrate(address, chainId);
  }, [address, chainId, hydrate]);

  return (
    <>
      {children}
      <SessionModal />
    </>
  );
}

SessionProvider.displayName = "SessionProvider";
