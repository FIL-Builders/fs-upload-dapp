import { config } from "@/lib";
import { asPieceCID, getSize, PieceCID } from "@filoz/synapse-core/piece";
import { bytesToGiB, bytesToKiB, bytesToMiB } from "@/lib/decimal";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SizeInfo {
  sizeBytes: bigint;
}

// ─── CID utilities ───────────────────────────────────────────────────────────

export const normalizePieceCid = (pieceCid: PieceCID | unknown): string => {
  // SDK PieceCID class instance — call toV1() to get canonical string
  if (
    pieceCid &&
    typeof pieceCid === "object" &&
    "toV1" in pieceCid &&
    typeof (pieceCid as PieceCID).toV1 === "function"
  ) {
    return (pieceCid as PieceCID).toV1().toString();
  }

  // CID-link object from IPLD/CBOR (shape: { "/": "bafy..." })
  if (pieceCid && typeof pieceCid === "object") {
    return JSON.parse(JSON.stringify(pieceCid))["/"];
  }

  // String CID — reconstruct via SDK to normalize formatting
  const cidString = typeof pieceCid === "string" ? pieceCid : String(pieceCid);
  const reconstructed = asPieceCID(cidString);
  if (reconstructed) {
    return reconstructed.toString();
  }

  // Unrecognizable input
  return "";
};

export function getPieceInfoFromCid(input: PieceCID): SizeInfo {
  const cidString = normalizePieceCid(input);
  const pieceCid = asPieceCID(cidString);
  if (!pieceCid) return { sizeBytes: 0n };
  return { sizeBytes: BigInt(getSize(pieceCid)) };
}

// ─── Size formatting ─────────────────────────────────────────────────────────

export const formatSizeMessage = (size: SizeInfo): string => {
  const gib = bytesToGiB(size.sizeBytes).toNumber();
  if (gib > 0.1) return `${gib.toFixed(4)} GB`;
  const mib = bytesToMiB(size.sizeBytes).toNumber();
  if (mib > 0.1) return `${mib.toFixed(4)} MB`;
  const kib = bytesToKiB(size.sizeBytes).toNumber();
  if (kib > 0.1) return `${kib.toFixed(4)} KB`;
  return `${size.sizeBytes} Bytes`;
};

// ─── Metadata checks ─────────────────────────────────────────────────────────

// Synapse SDK convention: presence of a metadata key with empty-string value acts as a boolean flag
export const isIpfsIndexed = (metadata: Record<string, string> | undefined): boolean =>
  metadata?.withIPFSIndexing === "";

export const isDatasetOnIpfs = (dataset: {
  metadata: Record<string, string>;
  pieces: { metadata?: Record<string, string> }[];
}): boolean =>
  isIpfsIndexed(dataset.metadata) && dataset.pieces.some((p) => p.metadata?.ipfsRootCid);

// ─── Access params ──────────────────────────────────────────────────────────

export interface OpenPieceParams {
  pieceCid: string;
  isCDN: boolean;
  serviceURL: string;
  withIPFSIndexing: boolean;
  ipfsRootCid?: string;
}

// ─── URL building ────────────────────────────────────────────────────────────

const FILECOIN_MAINNET_CHAIN_ID = 314;

function resolveNetwork(chainId?: number): string {
  return chainId === FILECOIN_MAINNET_CHAIN_ID ? "mainnet" : "calibration";
}

export function getPdpScannerUrl(dataSetId: bigint | string, chainId?: number): string {
  const network = resolveNetwork(chainId);
  return `https://pdp.vxb.ai/${network}/dataset/${dataSetId}`;
}

export function buildPieceUrl(
  params: OpenPieceParams & { address: string; chainId?: number },
): string {
  const { pieceCid, isCDN, address, serviceURL, withIPFSIndexing, ipfsRootCid, chainId } = params;

  if (withIPFSIndexing && ipfsRootCid) {
    return `${config.ipfsGatewayUrl}${ipfsRootCid}`;
  }
  if (isCDN) {
    const network = resolveNetwork(chainId);
    return `https://${address}.${network}.filbeam.io/${pieceCid}`;
  }
  return `${serviceURL}/piece/${pieceCid}`;
}
