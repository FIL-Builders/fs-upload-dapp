"use client";

import { Synapse } from "@filoz/synapse-sdk";
import { getWalletClient } from "wagmi/actions";
import { getSessionData, getSessionKey, useSessionStore } from "@/providers/session-key";
import { wagmiConfig } from "@/providers/web3-provider";
import { config } from "./utils";

function ensureSession(): Promise<void> {
  if (getSessionData()) return Promise.resolve();

  useSessionStore.getState().openModal();

  return new Promise<void>((resolve) => {
    const unsub = useSessionStore.subscribe((state, prev) => {
      if (getSessionData()) {
        unsub();
        resolve();
      } else if (!state.modalOpen && prev.modalOpen) {
        unsub();
        resolve();
      }
    });
  });
}

export async function getSynapseClient(withSession: boolean = true) {
  // Connector-backed viem client from wagmi — routes through the ACTIVE
  // connector (injected, WalletConnect, …), so it carries the correct account
  // and never depends on window.ethereum. Using this directly avoids the
  // WalletConnect crash and wrong-account hazards of re-wrapping window.ethereum.
  const walletClient = await getWalletClient(wagmiConfig);
  const chainId = walletClient.chain?.id;
  if (!walletClient.account || !chainId) throw new Error("Wallet not connected");

  let sessionKey = withSession ? getSessionKey(walletClient, chainId) : undefined;
  if (!sessionKey && withSession) {
    await ensureSession();
    sessionKey = getSessionKey(walletClient, chainId);
  }
  return new Synapse({
    client: walletClient,
    sessionClient: sessionKey?.client,
    source: config.dappId,
  });
}
