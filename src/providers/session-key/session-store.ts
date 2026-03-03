import { scopeKey } from "@/lib";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HOUR_SECONDS } from "./constants";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SessionStatus = "none" | "expired" | "expiring" | "valid";

export interface StoredSessionData {
  privateKey: string;
  expiresAt: number; // Unix timestamp (seconds)
  durationDays: number; // User-selected duration
}

// ─── Pure derivation ─────────────────────────────────────────────────────────

export function deriveSessionStatus(expiresAt: number): {
  status: SessionStatus;
  expiresAt: number;
} {
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt === 0) return { status: "expiring", expiresAt: 0 };
  if (expiresAt < now) return { status: "expired", expiresAt };
  if (expiresAt < now + HOUR_SECONDS) return { status: "expiring", expiresAt };
  return { status: "valid", expiresAt };
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface SessionState {
  status: SessionStatus;
  expiresAt: number | undefined;
  modalOpen: boolean;

  scope: { address: string; chainId: number } | null;
  sessions: Record<string, StoredSessionData>;

  hydrate: (address: string, chainId: number) => void;
  save: (address: string, chainId: number, data: StoredSessionData) => void;
  clear: (address: string, chainId: number) => void;
  setStatus: (status: SessionStatus, expiresAt?: number) => void;
  openModal: () => void;
  closeModal: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      status: "none",
      expiresAt: undefined,
      modalOpen: false,
      scope: null,
      sessions: {},

      hydrate: (address, chainId) => {
        set({ scope: { address, chainId } });
      },

      save: (address, chainId, data) => {
        const key = scopeKey(address, chainId);
        set((s) => ({ sessions: { ...s.sessions, [key]: data } }));
      },

      clear: (address, chainId) => {
        const key = scopeKey(address, chainId);
        set((s) => {
          const { [key]: _, ...rest } = s.sessions;
          return { sessions: rest, status: "none", expiresAt: undefined };
        });
      },

      setStatus: (status, expiresAt) => set({ status, expiresAt }),

      openModal: () => set({ modalOpen: true }),
      closeModal: () => set({ modalOpen: false }),
    }),
    {
      name: "session-store",
      partialize: (state) => ({ sessions: state.sessions }),
    },
  ),
);

// ─── Non-React accessor ─────────────────────────────────────────────────────

export function getSessionData(): StoredSessionData | null {
  const { scope, sessions } = useSessionStore.getState();
  if (!scope) return null;
  return sessions[scopeKey(scope.address, scope.chainId)] ?? null;
}
