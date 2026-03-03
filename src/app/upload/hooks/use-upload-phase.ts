"use client";

import { useState } from "react";
import type { ProviderProgress, StepId, UploadPhase, UploadStep } from "@/app/upload/types";
import { config } from "@/lib";
import { useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { useStorageConfig } from "@/providers/storage-config";

// ─── Step templates ──────────────────────────────────────────────────────────

type StepTemplate = Pick<UploadStep, "id" | "label">;

export const UPLOAD_STEPS: StepTemplate[] = [
  { id: "session", label: "Session key" },
  { id: "resolve", label: "Resolve providers" },
  { id: "calculate", label: "Calculate storage" },
  { id: "deposit", label: "Deposit funds" },
];

export const PIN_STEPS: StepTemplate[] = [
  { id: "car", label: "Build CAR file" },
  { id: "session", label: "Session key" },
  { id: "resolve", label: "Resolve providers" },
  { id: "calculate", label: "Calculate storage" },
  { id: "deposit", label: "Deposit funds" },
];

const PRIMARY_PROVIDER_STEPS: StepTemplate[] = [
  { id: "upload", label: "Upload pieces" },
  { id: "confirm", label: "Confirm on-chain" },
];

const SECONDARY_PROVIDER_STEPS: StepTemplate[] = [
  { id: "pull", label: "Pull pieces" },
  { id: "confirm", label: "Confirm on-chain" },
];

export const APP_METADATA = { DAPPID: config.dappId } as const;

export type UploadParams = {
  copies: number;
  files: File[];
  withCDN?: boolean;
};

type UploadPhaseController = ReturnType<typeof useUploadPhase>;

export function activateProviderUploadSteps(
  phase: Pick<UploadPhaseController, "initProviders" | "updateProvider">,
  providerCount: number,
) {
  phase.initProviders(providerCount);
  for (let i = 0; i < providerCount; i++) {
    phase.updateProvider(i, "upload", { status: "active" });
  }
}

// ─── Pure helpers ────────────────────────────────────────────────────────────

function toStep(template: StepTemplate, status: UploadStep["status"] = "pending"): UploadStep {
  return { ...template, status };
}

function calculateProgress(steps: UploadStep[], providers: ProviderProgress[]): number {
  const allSteps = [...steps, ...providers.flatMap((p) => p.steps)];
  const total = allSteps.length;
  if (total === 0) return 0;
  const done = allSteps.filter((s) => s.status === "done" || s.status === "skipped").length;
  return Math.round((done / total) * 100);
}

function withActive(
  phase: UploadPhase,
  fn: (p: Extract<UploadPhase, { phase: "active" }>) => UploadPhase,
): UploadPhase {
  return phase.phase === "active" ? fn(phase) : phase;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useUploadPhase() {
  const [phase, setPhase] = useState<UploadPhase>({ phase: "idle" });
  const queryClient = useQueryClient();
  const { address, chainId } = useConnection();
  const { config } = useStorageConfig();

  const start = (templates: StepTemplate[]) =>
    setPhase({
      phase: "active",
      steps: templates.map((t, i) => toStep(t, i === 0 ? "active" : "pending")),
      providers: [],
      progress: 0,
    });

  const advance = (fromId: StepId, toId: StepId, detail?: string) =>
    setPhase((p) =>
      withActive(p, (a) => {
        const steps = a.steps.map((s) => {
          if (s.id === fromId) return { ...s, status: "done" as const, detail: undefined };
          if (s.id === toId) return { ...s, status: "active" as const, detail };
          return s;
        });
        return { ...a, steps, progress: calculateProgress(steps, a.providers) };
      }),
    );

  const complete = (stepId: StepId) =>
    setPhase((p) =>
      withActive(p, (a) => {
        const steps = a.steps.map((s) =>
          s.id === stepId ? { ...s, status: "done" as const, detail: undefined } : s,
        );
        return { ...a, steps, progress: calculateProgress(steps, a.providers) };
      }),
    );

  const skip = (stepId: StepId) =>
    setPhase((p) =>
      withActive(p, (a) => {
        const steps = a.steps.map((s) =>
          s.id === stepId ? { ...s, status: "skipped" as const } : s,
        );
        return { ...a, steps, progress: calculateProgress(steps, a.providers) };
      }),
    );

  const activate = (stepId: StepId, detail?: string) =>
    setPhase((p) =>
      withActive(p, (a) => ({
        ...a,
        steps: a.steps.map((s) => (s.id === stepId ? { ...s, status: "active", detail } : s)),
      })),
    );

  const initProviders = (count: number) =>
    setPhase((p) =>
      withActive(p, (a) => ({
        ...a,
        providers: Array.from({ length: count }, (_, i) => ({
          label: `Provider ${i + 1}`,
          steps: (i === 0 ? PRIMARY_PROVIDER_STEPS : SECONDARY_PROVIDER_STEPS).map((t) =>
            toStep(t),
          ),
        })),
      })),
    );

  const updateProvider = (idx: number, stepId: StepId, update: Partial<UploadStep>) =>
    setPhase((p) =>
      withActive(p, (a) => {
        const providers = a.providers.map((prov, i) =>
          i === idx
            ? { ...prov, steps: prov.steps.map((s) => (s.id === stepId ? { ...s, ...update } : s)) }
            : prov,
        );
        return { ...a, providers, progress: calculateProgress(a.steps, providers) };
      }),
    );

  const finish = (result: Extract<UploadPhase, { phase: "done" }>["result"]) =>
    setPhase((p) => {
      if (p.phase !== "active") return p;
      return { phase: "done", steps: p.steps, providers: p.providers, result };
    });

  const fail = (error: string) =>
    setPhase((p) => {
      const base =
        p.phase === "active" || p.phase === "done" || p.phase === "failed"
          ? p
          : { steps: [] as UploadStep[], providers: [] as ProviderProgress[] };
      return { phase: "failed", steps: base.steps, providers: base.providers, error };
    });

  const reset = () => setPhase({ phase: "idle" });

  const invalidateAfterUpload = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.datasets(address, chainId) });
  };

  return {
    phase,
    start,
    advance,
    complete,
    skip,
    activate,
    initProviders,
    updateProvider,
    finish,
    fail,
    reset,
    invalidateAfterUpload,
  };
}
