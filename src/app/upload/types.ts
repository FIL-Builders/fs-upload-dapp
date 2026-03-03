export type UploadMode = "standard" | "cdn" | "pin";

// Upload step identifiers — typed to catch typos at compile time
export type StepId =
  | "session"
  | "resolve"
  | "calculate"
  | "deposit"
  | "upload"
  | "confirm"
  | "pull"
  | "car";

// Step status for the persistent progress timeline
export type StepStatus = "pending" | "active" | "done" | "skipped" | "failed";

// A single step in the upload process
export interface UploadStep {
  id: StepId;
  label: string;
  status: StepStatus;
  detail?: string;
  error?: string;
}

// Per-provider tracked state during parallel upload phase
export interface ProviderProgress {
  label: string;
  steps: UploadStep[];
}

// Per-provider successful upload record
export interface ProviderUpload {
  providerId: string;
  providerName: string;
  dataSetId: string;
  txHash: string;
  ipfsRootCid?: string;
}

// A single piece with all its successful provider uploads
export interface PieceResult {
  pieceCid: string;
  size: number;
  providers: ProviderUpload[];
}

// A provider-level failure (commit or pull)
export interface ProviderFailure {
  providerIndex: number;
  providerName: string;
  error: string;
}

/**
 * `kind` is "standard" | "pin" (not "cdn") because CDN is a variant of
 * standard upload — same flow, different provider config. UploadMode has
 * 3 values for UI purposes; `kind` has 2 for result shape.
 */
export interface ResultData {
  kind: "standard" | "pin";
  pieces: PieceResult[];
  failures: ProviderFailure[];
  fileCount: number;
  copies: number;
  totalSize: number;
  ipfsRootCid?: string;
}

// Persistent upload phase — accumulates completed steps and per-provider progress.
// Unlike the old model, completed steps never disappear from the UI.
export type UploadPhase =
  | { phase: "idle" }
  | {
      phase: "active";
      steps: UploadStep[];
      providers: ProviderProgress[];
      progress: number;
    }
  | {
      phase: "done";
      steps: UploadStep[];
      providers: ProviderProgress[];
      result: ResultData;
    }
  | {
      phase: "failed";
      steps: UploadStep[];
      providers: ProviderProgress[];
      error: string;
    };
