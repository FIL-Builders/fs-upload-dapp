import type { PDPProvider } from "@filoz/synapse-core/sp-registry";
import { DEFAULT_BUFFER_EPOCHS } from "@filoz/synapse-core/utils";
import {
  calculateAdditionalLockupRequired,
  calculateBufferAmount,
  calculateEffectiveRate,
  calculateRunwayAmount,
  calculateUploadFees,
  selectProviders,
  type ProviderSelectionInput,
  type ResolvedLocation,
} from "@filoz/synapse-core/warm-storage";
import type { UsePriceListResult } from "@filoz/synapse-react";
import { TIME_CONSTANTS } from "@filoz/synapse-sdk";

/**
 * Offline mirror of the SDK's provider selection + cost calculation.
 *
 * `planContexts` mirrors `StorageContext.smartSelect` and `deriveUploadCosts`
 * mirrors `StorageManager.calculateMultiContextCosts`, both line-for-line
 * against the installed SDK, but driven by data fetched ONCE (see
 * `useUploadPlan`) instead of per-call network reads. Every sub-computation
 * uses the SDK's own exported pure functions (`selectProviders`,
 * `calculate*`), so only the orchestration is local.
 *
 * The real SDK functions still run at upload time (the upload hooks call
 * `createContexts` + `calculateMultiContextCosts`), so they remain
 * authoritative; this module is a faithful preview. If the SDK changes its
 * selection or cost orchestration, keep these two functions in sync.
 */

// ─── Provider health ─────────────────────────────────────────────────────────

export interface ProviderHealth {
  id: bigint;
  name: string;
  serviceURL: string;
  /** Provider-declared region/location, if any. */
  location?: string;
  endorsed: boolean;
  reachable: boolean;
  /** Failure reason when unreachable (timeout, HTTP status, network error). */
  pingError?: string;
}

/** Build the per-provider health table from approved providers + ping results. */
export function toProviderHealth(
  providers: PDPProvider[],
  endorsedIds: bigint[],
  pings: PromiseSettledResult<unknown>[],
): ProviderHealth[] {
  return providers.map((p, i) => {
    const result = pings[i];
    const reachable = result?.status === "fulfilled";
    return {
      id: p.id,
      name: p.name || `Provider #${p.id.toString()}`,
      serviceURL: p.pdp.serviceURL,
      location: p.pdp.location || undefined,
      endorsed: endorsedIds.includes(p.id),
      reachable,
      pingError:
        reachable || result == null
          ? undefined
          : result.reason instanceof Error
            ? result.reason.message
            : "Unreachable",
    };
  });
}

export interface PlanCounts {
  approved: number;
  endorsed: number;
  reachable: number;
  reachableEndorsed: number;
}

export function planCounts(health: ProviderHealth[]): PlanCounts {
  return {
    approved: health.length,
    endorsed: health.filter((h) => h.endorsed).length,
    reachable: health.filter((h) => h.reachable).length,
    reachableEndorsed: health.filter((h) => h.endorsed && h.reachable).length,
  };
}

// ─── Selection (mirrors StorageContext.smartSelect) ──────────────────────────

export interface ResolutionErrorInfo {
  headline: string;
  detail: string;
  /** Whether retrying is likely to help (transient cause). */
  retryable: boolean;
}

export function planContexts(
  input: ProviderSelectionInput,
  health: ProviderHealth[],
  opts: { metadata: Record<string, string>; count: number },
): { locations: ResolvedLocation[]; error?: ResolutionErrorInfo } {
  const reachable = new Map(health.map((h) => [h.id, h.reachable] as const));

  // Mirror smartSelect: endorsed primary slot, any-provider secondary slots,
  // using cached ping health in place of the SDK's live SP.ping.
  const locations: ResolvedLocation[] = [];
  const excludeProviderIds: bigint[] = [];
  let primaryPingFailures = 0;

  for (let i = 0; i < opts.count; i++) {
    const endorsedSlot = i === 0;
    let found = false;
    for (;;) {
      const candidates = selectProviders({
        providers: input.providers,
        endorsedIds: endorsedSlot ? input.endorsedIds : [],
        clientDataSets: input.clientDataSets,
        count: 1,
        excludeProviderIds,
        metadata: opts.metadata,
      });
      if (candidates.length === 0) break;
      const candidate = candidates[0];
      if (reachable.get(candidate.provider.id)) {
        locations.push(candidate);
        excludeProviderIds.push(candidate.provider.id);
        found = true;
        break;
      }
      excludeProviderIds.push(candidate.provider.id);
      if (endorsedSlot) primaryPingFailures++;
    }
    if (endorsedSlot && !found) {
      return {
        locations: [],
        error: describeResolutionError(
          new Error(
            primaryPingFailures > 0
              ? "No endorsed provider available — all endorsed provider(s) failed health check"
              : "No endorsed provider available",
          ),
        ),
      };
    }
    if (!found) break;
  }

  return { locations };
}

// ─── Costs (mirrors StorageManager.calculateMultiContextCosts) ───────────────

export interface UploadCostBreakdown {
  fees: { createDataSetFee: bigint; addPiecesFee: bigint; total: bigint };
  lockups: {
    lifecycleLockup: bigint;
    streamingLockup: bigint;
    cdnLockup: bigint;
    cacheMissLockup: bigint;
    total: bigint;
  };
  rates: { perEpoch: bigint; perMonth: bigint };
  depositNeeded: bigint;
  needsFwssMaxApproval: boolean;
  ready: boolean;
  newDatasetCount: number;
}

/** Account fields read from `Pay.getAccountSummary` (already settled). */
export interface AccountSnapshot {
  availableFunds: bigint;
  debt: bigint;
  runwayInEpochs: bigint;
  lockupRatePerEpoch: bigint;
}

export function deriveUploadCosts(args: {
  priceList: UsePriceListResult;
  account: AccountSnapshot;
  approved: boolean;
  locations: ResolvedLocation[];
  /** dataSetId → current stored bytes, for reused datasets. */
  sizeByDataSetId: Map<bigint, bigint>;
  dataSize: bigint;
  withCDN: boolean;
  /** Extra prepaid runway beyond the lockup reserve. Defaults to 0 (the SDK
   * default) — the upload deposit is the minimum shortfall, not a full
   * persistence-period prepayment. */
  extraRunwayEpochs?: bigint;
  bufferEpochs?: bigint;
}): UploadCostBreakdown {
  const { priceList, account, locations, sizeByDataSetId, dataSize, withCDN } = args;

  let totalRateDeltaPerEpoch = 0n;
  let totalLockup = 0n;
  let lifecycleLockup = 0n;
  let streamingLockup = 0n;
  let cdnLockup = 0n;
  let cacheMissLockup = 0n;
  let createDataSetFee = 0n;
  let addPiecesFee = 0n;
  let ratePerEpoch = 0n;
  let ratePerMonth = 0n;
  let newDatasetCount = 0;

  for (const loc of locations) {
    const isNewDataSet = loc.dataSetId == null;
    if (isNewDataSet) newDatasetCount++;
    const currentDataSetSize =
      loc.dataSetId == null ? 0n : (sizeByDataSetId.get(loc.dataSetId) ?? 0n);

    const lockup = calculateAdditionalLockupRequired({
      dataSize,
      currentDataSetSize,
      priceList,
      isNewDataSet,
      withCDN,
    });
    // Mirror the SDK: calculateUploadFees is called without pieceCount (defaults
    // to 1) so the previewed deposit matches the upload-time gate exactly.
    const fees = calculateUploadFees({ priceList, isNewDataSet });

    totalRateDeltaPerEpoch += lockup.rateDeltaPerEpoch;
    totalLockup += lockup.total;
    lifecycleLockup += lockup.lifecycleLockup;
    streamingLockup += lockup.streamingLockup;
    cdnLockup += lockup.cdnLockup;
    cacheMissLockup += lockup.cacheMissLockup;
    createDataSetFee += fees.createDataSetFee;
    addPiecesFee += fees.addPiecesFee;

    const rate = calculateEffectiveRate({
      sizeInBytes: currentDataSetSize + dataSize,
      storagePerTibPerMonth: priceList.rates.storagePerTibPerMonth,
      datasetFeePerMonth: priceList.rates.datasetFeePerMonth,
      epochsPerMonth: TIME_CONSTANTS.EPOCHS_PER_MONTH,
    });
    ratePerEpoch += rate.ratePerEpoch;
    ratePerMonth += rate.ratePerMonth;
  }

  const bufferEpochs = args.bufferEpochs ?? DEFAULT_BUFFER_EPOCHS;
  const netRateAfterUpload = account.lockupRatePerEpoch + totalRateDeltaPerEpoch;
  const runway = calculateRunwayAmount({
    netRateAfterUpload,
    extraRunwayEpochs: args.extraRunwayEpochs ?? 0n,
  });
  const totalFees = createDataSetFee + addPiecesFee;
  const rawDepositNeeded = totalLockup + totalFees + runway + account.debt - account.availableFunds;

  const allNewDatasets = locations.every((l) => l.dataSetId == null);
  const skipBuffer = account.lockupRatePerEpoch === 0n && allNewDatasets;
  const buffer = skipBuffer
    ? 0n
    : calculateBufferAmount({
        rawDepositNeeded,
        netRateAfterUpload,
        runwayInEpochs: account.runwayInEpochs,
        availableFunds: account.availableFunds,
        bufferEpochs,
      });

  const clamped = rawDepositNeeded > 0n ? rawDepositNeeded : 0n;
  const depositNeeded = clamped + buffer;
  const needsFwssMaxApproval = !args.approved;

  return {
    fees: { createDataSetFee, addPiecesFee, total: totalFees },
    lockups: { lifecycleLockup, streamingLockup, cdnLockup, cacheMissLockup, total: totalLockup },
    rates: { perEpoch: ratePerEpoch, perMonth: ratePerMonth },
    depositNeeded,
    needsFwssMaxApproval,
    ready: depositNeeded === 0n && !needsFwssMaxApproval,
    newDatasetCount,
  };
}

// ─── Error classification ────────────────────────────────────────────────────

/** Map a context-resolution error to a user-facing explanation. */
function describeResolutionError(error: unknown): ResolutionErrorInfo {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("all endorsed provider(s) failed health check")) {
    return {
      headline: "All endorsed storage providers are unreachable",
      detail:
        "Every provider eligible for your primary copy failed its health check (no answer on /pdp/ping within ~1 second). This is usually temporary — providers may be restarting, or your network may be blocking them.",
      retryable: true,
    };
  }
  if (message.includes("No endorsed provider available")) {
    return {
      headline: "No endorsed storage provider on this network",
      detail:
        "Uploads pick the primary provider from the on-chain endorsed set, and that set is empty (or fully excluded) on this network. Try the other network, or retry later.",
      retryable: false,
    };
  }
  if (message.includes("ConnectorNotConnected") || message.includes("Wallet not connected")) {
    return {
      headline: "Wallet not connected",
      detail: "Reconnect your wallet and try again.",
      retryable: true,
    };
  }
  if (message.includes("HTTP request failed") || message.includes("fetch failed")) {
    return {
      headline: "Network error talking to the Filecoin RPC",
      detail: "The chain RPC could not be reached. Check your connection and retry.",
      retryable: true,
    };
  }
  return {
    headline: "Storage provider resolution failed",
    detail: message,
    retryable: true,
  };
}
