import type { PieceResult, ProviderFailure, StepId, UploadStep } from "@/app/upload/types";
import { PDPProvider } from "@filoz/synapse-sdk";
import type { StorageContext } from "@filoz/synapse-sdk/storage";

type UploadableFile = {
  name: string;
  size: number;
  stream: () => ReadableStream<Uint8Array>;
};

type ProviderPhaseUpdater = {
  updateProvider: (providerIdx: number, stepId: StepId, update: Partial<UploadStep>) => void;
};

interface UploadToContextsResult {
  pieces: PieceResult[];
  failures: ProviderFailure[];
}

export async function uploadToContexts(
  contexts: StorageContext[],
  files: UploadableFile[],
  phase: ProviderPhaseUpdater,
  options?: {
    metadata?: Record<string, string>;
    onProviderError?: (provider: PDPProvider, error: string) => void;
  },
): Promise<UploadToContextsResult> {
  const idxOf = new Map<bigint, number>();
  contexts.forEach((ctx, i) => idxOf.set(ctx.provider.id, i));

  const [primary, ...secondaries] = contexts;
  const ipfsRootCid = options?.metadata?.ipfsRootCid;

  // ── 1. Store files on primary ──────────────────────────────────────────────

  const storeResults = await Promise.all(files.map((f) => primary.store(f.stream())));

  phase.updateProvider(idxOf.get(primary.provider.id)!, "upload", {
    status: "done",
    detail: "Stored on primary",
  });

  // ── 2. Presign commits (avoids wallet prompts during commit phase) ─────────

  const commitPieces = storeResults.map((r) => ({
    pieceCid: r.pieceCid,
    pieceMetadata: options?.metadata,
  }));

  const extraData = await Promise.all(contexts.map((ctx) => ctx.presignForCommit(commitPieces)));
  const secondaryExtraData = extraData.slice(1);

  // ── 3. Pull pieces to secondaries ──────────────────────────────────────────

  const pieceCids = storeResults.map((r) => r.pieceCid);
  const pullSucceeded = new Set<bigint>([primary.provider.id]);

  const pullResults = await Promise.allSettled(
    secondaries.map((ctx, i) =>
      ctx.pull({
        pieces: pieceCids,
        from: (cid) => primary.getPieceUrl(cid),
        extraData: secondaryExtraData[i],
        onProgress: (_, status) => {
          const i = idxOf.get(ctx.provider.id);
          if (i == null) return;
          phase.updateProvider(i, "pull", {
            status: status === "failed" ? "failed" : "active",
            detail: `Pull ${status}`,
          });
        },
      }),
    ),
  );

  const failures: ProviderFailure[] = [];

  pullResults.forEach((result, i) => {
    const ctx = secondaries[i];
    const provIdx = idxOf.get(ctx.provider.id);
    if (provIdx == null) return;

    if (result.status === "fulfilled" && result.value.status === "complete") {
      pullSucceeded.add(ctx.provider.id);
      phase.updateProvider(provIdx, "pull", { status: "done" });
    } else {
      const error =
        result.status === "rejected"
          ? (result.reason?.message ?? "Pull failed")
          : "Some pieces failed to pull";
      phase.updateProvider(provIdx, "pull", { status: "failed", error });
      options?.onProviderError?.(ctx.provider, error);
      failures.push({ providerIndex: provIdx, providerName: ctx.provider.name, error });
    }
  });

  // ── 4. Commit (only providers that have the data) ──────────────────────────

  const commitResults = await Promise.allSettled(
    contexts.map((ctx, i) => {
      if (!pullSucceeded.has(ctx.provider.id)) {
        return Promise.reject(new Error("Skipped: pull did not complete"));
      }
      return ctx.commit({
        pieces: commitPieces,
        extraData: extraData[i],
        onSubmitted: () => {
          const provIdx = idxOf.get(ctx.provider.id);
          if (provIdx != null) {
            phase.updateProvider(provIdx, "confirm", {
              status: "active",
              detail: "Transaction submitted",
            });
          }
        },
      });
    }),
  );

  // ── 5. Build results (piece-first grouping) ───────────────────────────────

  // Initialize pieces from storeResults
  const pieceMap = new Map<string, PieceResult>();
  for (const r of storeResults) {
    const cid = r.pieceCid.toString();
    pieceMap.set(cid, { pieceCid: cid, size: r.size, providers: [] });
  }

  // Collect successful commits into pieces, failed commits into failures
  for (let ctxIdx = 0; ctxIdx < contexts.length; ctxIdx++) {
    const ctx = contexts[ctxIdx];
    const commit = commitResults[ctxIdx];
    const provIdx = idxOf.get(ctx.provider.id) ?? 0;

    if (commit.status === "rejected") {
      const error: string = commit.reason?.message ?? "Commit failed";
      phase.updateProvider(provIdx, "confirm", { status: "failed", error });
      if (pullSucceeded.has(ctx.provider.id)) {
        options?.onProviderError?.(ctx.provider, error);
        failures.push({ providerIndex: provIdx, providerName: ctx.provider.name, error });
      }
      continue;
    }

    phase.updateProvider(provIdx, "confirm", {
      status: "done",
      detail: `Confirmed in dataset ${commit.value.dataSetId}`,
    });

    const { txHash, dataSetId } = commit.value;

    for (const piece of pieceMap.values()) {
      piece.providers.push({
        providerId: ctx.provider.id.toString(),
        providerName: ctx.provider.name,
        dataSetId: dataSetId.toString(),
        txHash,
        ipfsRootCid,
      });
    }
  }

  const pieces = Array.from(pieceMap.values());

  if (pieces.every((p) => p.providers.length === 0)) {
    throw new Error(`All ${contexts.length} provider uploads failed`);
  }

  return { pieces, failures };
}
