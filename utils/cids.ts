import { SIZE_CONSTANTS } from "@filoz/synapse-sdk";
import { PieceSizeInfo } from "@/types";

/**
 * Utilities for working with CommP v2 CIDs consistent with on-chain logic.
 * Mirrors Cids.sol: prefix validation, uvarint parsing, padding/height extraction,
 * piece size and leaf count calculations, and digest extraction.
 */

// 0x01 (CIDv1), 0x55 (Raw), 0x91 0x20 (fr32-sha2-256-trunc254-padded-binary-tree)
const COMMP_V2_PREFIX = new Uint8Array([0x01, 0x55, 0x91, 0x20]);

export interface ParsedCommP {
  padding: bigint;
  height: number;
  digestOffset: number;
  digest: Uint8Array; // 32 bytes
}

export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex: length must be even");
  }
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, "0");
    hex += h;
  }
  return hex;
}

// Reads uvarint (<= 256 bits) from bytes starting at offset. Returns [value, nextOffset]
function readUvarint(data: Uint8Array, offset: number): [bigint, number] {
  let i = 0;
  let value = BigInt(data[offset] & 0x7f);
  while (data[offset + i] >= 0x80) {
    i++;
    value = value | (BigInt(data[offset + i] & 0x7f) << BigInt(i * 7));
  }
  i++;
  return [value, offset + i];
}

export function validateCommPv2Prefix(cidBytes: Uint8Array): void {
  if (cidBytes.length < 4) {
    throw new Error("Cid data is too short");
  }
  for (let i = 0; i < 4; i++) {
    if (cidBytes[i] !== COMMP_V2_PREFIX[i]) {
      throw new Error("Cid must be CommPv2 (bad prefix)");
    }
  }
}

export function parseCommPFromCidBytes(cidBytes: Uint8Array): ParsedCommP {
  validateCommPv2Prefix(cidBytes);
  let offset = 4;

  // Read multihash length and validate full length
  const [mhLengthBig, afterMhLen] = readUvarint(cidBytes, offset);
  const mhLength = Number(mhLengthBig);
  if (!Number.isSafeInteger(mhLength)) {
    throw new Error("Multihash length is not a safe integer");
  }
  if (mhLength < 34) {
    throw new Error("CommPv2 multihash length must be at least 34");
  }
  if (afterMhLen + mhLength !== cidBytes.length) {
    throw new Error("CommPv2 multihash length does not match data length");
  }
  offset = afterMhLen;

  // Read padding (uvarint)
  const [padding, afterPadding] = readUvarint(cidBytes, offset);
  offset = afterPadding;

  // Height (uint8)
  if (offset >= cidBytes.length) {
    throw new Error("Cid data is too short for height");
  }
  const height = cidBytes[offset];
  offset += 1;

  // Digest is 32 bytes
  const remaining = cidBytes.length - offset;
  if (remaining < 32) {
    throw new Error("Cid data is too short for digest");
  }
  const digest = cidBytes.slice(offset, offset + 32);

  return {
    padding,
    height,
    digestOffset: offset,
    digest,
  };
}

export function isPaddingExcessive(padding: bigint, height: number): boolean {
  // (128 * padding) / 127 >= 1 << (height + 5)
  const expandedPadding = (128n * padding) / 127n;
  const capacity = 1n << BigInt(height + 5);
  return expandedPadding >= capacity;
}

export function computePieceSizeBytes(padding: bigint, height: number): bigint {
  // pieceSize = (1 << (height + 5)) - (128 * padding) / 127
  const capacity = 1n << BigInt(height + 5);
  const expandedPadding = (128n * padding) / 127n;
  const size = capacity - expandedPadding;
  return size >= 0n ? size : 0n;
}

export function computeLeafCount(padding: bigint, height: number): bigint {
  // paddingLeafs = (128*padding)/127 >> 5
  const paddingLeafs = ((128n * padding) / 127n) >> 5n;
  // total leaves = 1 << height
  const totalLeaves = 1n << BigInt(height);
  const withData = totalLeaves - paddingLeafs;
  return withData >= 0n ? withData : 0n;
}

/**
 * CID PARSING METHOD: Calculates exact piece size from CommP v2 CID bytes
 *
 * Use this method for:
 * - Smart contract compatibility (matches on-chain calculations exactly)
 * - Precise piece size calculations for individual files
 * - When you need exact file sizes that match contract logic
 * - Payment calculations requiring exact piece size
 *
 * Note: This parses the CID directly using padding/height formula:
 * pieceSize = (1 << (height + 5)) - (128 * padding) / 127
 * Results are exact and match smart contract behavior.
 *
 * @param input - CID bytes (as Uint8Array) or hex string
 * @returns PieceSizeInfo with exact piece size and metadata
 */
export function getPieceInfoFromCidBytes(
  input: string | Uint8Array
): PieceSizeInfo {
  const bytes = typeof input === "string" ? hexToBytes(input) : input;
  const parsed = parseCommPFromCidBytes(bytes);

  const sizeBytes = computePieceSizeBytes(parsed.padding, parsed.height);
  const leafCount = computeLeafCount(parsed.padding, parsed.height);
  const excessive = isPaddingExcessive(parsed.padding, parsed.height);

  // Convert to human-readable numbers where appropriate
  const sizeBytesNumber = Number(sizeBytes);
  const sizeKiB = sizeBytesNumber / Number(SIZE_CONSTANTS.KiB);
  const sizeMiB = sizeBytesNumber / Number(SIZE_CONSTANTS.MiB);
  const sizeGiB = sizeBytesNumber / Number(SIZE_CONSTANTS.GiB);

  return {
    padding: parsed.padding,
    height: parsed.height,
    digestHex: bytesToHex(parsed.digest),
    sizeBytes,
    sizeKiB,
    sizeMiB,
    sizeGiB,
    leafCount: Number(leafCount),
    isPaddingExcessive: excessive,
  };
}
