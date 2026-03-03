"use client";

import { WalletModal } from "./wallet-modal";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WalletModal />
    </>
  );
}
