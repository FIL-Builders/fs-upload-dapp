"use client";

import { useEffect } from "react";
import { scopeKey } from "@/lib";
import * as SessionKey from "@filoz/synapse-core/session-key";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WalletClient } from "viem";
import { generatePrivateKey } from "viem/accounts";
import { waitForTransactionReceipt } from "viem/actions";
import { useConnection, useWalletClient } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { DAY_SECONDS, DEFAULT_DURATION_DAYS } from "./constants";
import { deriveSessionStatus, useSessionStore, type StoredSessionData } from "./session-store";

// ─── Internal helpers ────────────────────────────────────────────────────────

function buildSessionKey(privateKey: string, walletClient: WalletClient) {
  return SessionKey.fromSecp256k1({
    privateKey: privateKey as `0x${string}`,
    root: walletClient.account!,
    chain: walletClient.chain!,
  });
}

function getStoredSession(
  address: string | undefined,
  chainId: number | undefined,
): StoredSessionData | null {
  if (!address || !chainId) return null;
  return useSessionStore.getState().sessions[scopeKey(address, chainId)] ?? null;
}

async function loginSession(
  walletClient: WalletClient,
  address: string,
  chainId: number,
  durationDays: number = DEFAULT_DURATION_DAYS,
  existingPrivateKey?: string,
) {
  const privateKey = existingPrivateKey ?? generatePrivateKey();
  const stored = getStoredSession(address, chainId);
  const sessionData: StoredSessionData = stored ?? {
    privateKey,
    expiresAt: 0,
    durationDays,
  };
  sessionData.privateKey = existingPrivateKey ?? sessionData.privateKey;

  const sessionKey = buildSessionKey(sessionData.privateKey, walletClient);
  const newExpiry = Math.floor(Date.now() / 1000) + durationDays * DAY_SECONDS;
  const targetExpiry = BigInt(newExpiry);

  await sessionKey.syncExpirations();

  const needsLogin = SessionKey.DefaultFwssPermissions.some(
    (perm) => (sessionKey.expirations[perm] ?? 0n) < targetExpiry,
  );

  if (needsLogin) {
    if (!walletClient.account || !walletClient.chain) {
      throw new Error("Wallet client missing account or chain");
    }
    const loginTx = await SessionKey.login(walletClient as Parameters<typeof SessionKey.login>[0], {
      address: sessionKey.address,
      expiresAt: targetExpiry,
    });
    await waitForTransactionReceipt(walletClient, { hash: loginTx });
  }

  useSessionStore.getState().save(address, chainId, {
    ...sessionData,
    expiresAt: newExpiry,
    durationDays,
  });

  return sessionKey;
}

async function revokeSession(walletClient: WalletClient, chainId: number) {
  const sessionKey = getSessionKey(walletClient, chainId);
  if (!sessionKey) throw new Error("Session key not found");
  const revokeTx = await SessionKey.revoke(walletClient as Parameters<typeof SessionKey.revoke>[0], {
    address: sessionKey.address,
  });
  await waitForTransactionReceipt(walletClient, { hash: revokeTx });
}

async function validateSession(walletClient: WalletClient, address: string, chainId: number) {
  const sessionData = getStoredSession(address, chainId);
  if (!sessionData) return { isValid: false, expiresAt: undefined };
  if (!walletClient.account || !walletClient.chain) return { isValid: false, expiresAt: undefined };

  const sessionKey = buildSessionKey(sessionData.privateKey, walletClient);
  await sessionKey.syncExpirations();

  const now = BigInt(Math.floor(Date.now() / 1000));
  const minExpiry = SessionKey.DefaultFwssPermissions.reduce((min, perm) => {
    const exp = sessionKey.expirations[perm] ?? 0n;
    return exp < min ? exp : min;
  }, BigInt(Number.MAX_SAFE_INTEGER));

  const isValid = minExpiry > now;
  return { isValid, expiresAt: minExpiry > 0n ? Number(minExpiry) : undefined };
}

// ─── Exported accessor (non-React) ──────────────────────────────────────────

export function getSessionKey(walletClient: WalletClient, chainId: number) {
  if (!walletClient.account) return undefined;
  const address = walletClient.account.address;

  const data = getStoredSession(address, chainId);
  if (!data?.privateKey) return undefined;

  const { status } = deriveSessionStatus(data.expiresAt);
  if (status === "none" || status === "expired") return undefined;

  return buildSessionKey(data.privateKey, walletClient);
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useSessionStatus() {
  const { address, chainId, isConnected } = useConnection();
  const { data: walletClient } = useWalletClient();
  const setStatus = useSessionStore((s) => s.setStatus);

  const query = useQuery({
    queryKey: queryKeys.session(address, chainId),
    queryFn: async () => {
      if (!address || !chainId || !walletClient) return { isValid: false, expiresAt: undefined };
      return validateSession(walletClient, address, chainId);
    },
    enabled: !!address && !!chainId && !!walletClient,
    staleTime: 30_000,
    retry: 1,
  });

  const onChainExpiresAt = query.data?.expiresAt;
  let status = useSessionStore((s) => s.status);
  let expiresAt = useSessionStore((s) => s.expiresAt);

  if (address && chainId) {
    if (onChainExpiresAt !== undefined) {
      const derived = deriveSessionStatus(onChainExpiresAt);
      status = derived.status;
      expiresAt = derived.expiresAt;
    } else {
      const data = getStoredSession(address, chainId);
      if (data) {
        const derived = deriveSessionStatus(data.expiresAt);
        status = derived.status;
        expiresAt = derived.expiresAt;
      } else {
        status = "none";
      }
    }
  }

  useEffect(() => {
    if (address && chainId) setStatus(status, expiresAt);
  }, [address, chainId, status, expiresAt, setStatus]);

  const hasValidSession = isConnected && (query.data?.isValid === true || status === "valid");

  return { status, expiresAt, hasValidSession, isLoading: query.isLoading, refetch: query.refetch };
}

export function useLoginSession() {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const closeModal = useSessionStore((s) => s.closeModal);

  return useMutation({
    mutationKey: queryKeys.loginSession(address, chainId),
    mutationFn: async (durationDays: number = DEFAULT_DURATION_DAYS) => {
      if (!address || !chainId || !walletClient) throw new Error("Wallet not connected");
      const existing = getStoredSession(address, chainId);
      const label = existing?.privateKey ? "Extending" : "Creating";
      toast.loading(`${label} session...`, { id: "session" });
      return loginSession(walletClient, address, chainId, durationDays, existing?.privateKey);
    },
    onSuccess: () => {
      const existing = getStoredSession(address, chainId);
      toast.success(existing ? "Session extended!" : "Session created!", { id: "session" });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(address, chainId) });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Session failed", { id: "session" });
    },
    onSettled: () => {
      closeModal();
    },
  });
}

export function useRevokeSession() {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const clear = useSessionStore((s) => s.clear);

  return useMutation({
    mutationKey: queryKeys.revokeSession(address, chainId),
    mutationFn: async () => {
      if (!address || !chainId || !walletClient) throw new Error("Wallet not connected");
      await revokeSession(walletClient, chainId);
      clear(address, chainId);
    },
    onSuccess: () => {
      toast.success("Session revoked", { id: "session" });
      queryClient.invalidateQueries({ queryKey: queryKeys.session(address, chainId) });
    },
  });
}
