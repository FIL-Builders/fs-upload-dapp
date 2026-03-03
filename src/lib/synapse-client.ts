"use client";

import { getChain, Synapse } from "@filoz/synapse-sdk";
import { createWalletClient, custom } from "viem";
import { getWalletClient } from "wagmi/actions";
import { getSessionData, getSessionKey, useSessionStore } from "@/providers/session-key";
import { wagmiConfig } from "@/providers/web3-provider";

function ensureSession(): Promise<void> {
  if (getSessionData()) return Promise.resolve();

  useSessionStore.getState().openModal();

  return new Promise((resolve) => {
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
  const walletClient = await getWalletClient(wagmiConfig);
  const address = walletClient.account?.address;
  const chainId = walletClient.chain?.id;
  if (!address || !chainId) throw new Error("Wallet not connected");
  const client = createWalletClient({
    account: walletClient.account,
    chain: getChain(chainId),
    transport: custom(walletClient.transport),
  });
  let sessionKey = withSession ? getSessionKey(walletClient, chainId) : undefined;
  if (!sessionKey && withSession) {
    await ensureSession();
    sessionKey = getSessionKey(walletClient, chainId);
  }
  return new Synapse({ client, sessionClient: sessionKey?.client });
}
