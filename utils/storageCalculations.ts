/**
 * High-precision storage calculations using Decimal.js
 * Handles unit conversions, persistence projections, and cost calculations
 */

import Decimal from "decimal.js";
import * as Piece from "@filoz/synapse-core/piece";
import { SIZE_CONSTANTS } from "@filoz/synapse-core/utils";
import { DataSetWithPieces } from "@filoz/synapse-react";

// Configure Decimal.js: precision 34 handles Solidity uint256 and wei conversions
Decimal.set({
  precision: 34,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -21,
  toExpPos: 21,
  maxE: 9e15,
  minE: -9e15,
  modulo: Decimal.ROUND_DOWN,
});

// Type for values that can be converted to Decimal
type DecimalLike = bigint | string | number | Decimal;

/** Converts any numeric type to Decimal */
const toDecimal = (value: DecimalLike): Decimal =>
  value instanceof Decimal ? value : new Decimal(value.toString());

/** Converts bytes to KiB */
export const bytesToKiB = (bytes: DecimalLike): Decimal =>
  toDecimal(bytes).div(new Decimal(SIZE_CONSTANTS.KiB.toString()));

/** Converts bytes to MiB */
export const bytesToMiB = (bytes: DecimalLike): Decimal =>
  toDecimal(bytes).div(new Decimal(SIZE_CONSTANTS.MiB.toString()));

/** Converts bytes to GiB */
export const bytesToGiB = (bytes: DecimalLike): Decimal =>
  toDecimal(bytes).div(new Decimal(SIZE_CONSTANTS.GiB.toString()));

/** Converts TiB to bytes */
export const tibToBytes = (tib: DecimalLike): Decimal =>
  toDecimal(tib).mul(new Decimal(SIZE_CONSTANTS.TiB.toString()));

/**
 * Extracts piece size and metadata from CommP v2 CID.
 * Matches on-chain calculations exactly for smart contract compatibility.
 * Formula: pieceSize = (1 << (height+5)) - (128*padding)/127
 *
 * @param input - CID as Uint8Array or hex string
 * @returns Piece size info with bytes/KiB/MiB/GiB conversions
 */
export const getPieceInfoFromCidBytes = (
  input: Piece.PieceCID
) => {
  const isLink = Piece.isPieceCID(input);

  const sizeBytes = isLink ? BigInt(Piece.getSize((input))) : 0n;
  return {
    sizeBytes,
    sizeKiB: bytesToKiB(sizeBytes).toNumber(),
    sizeMiB: bytesToMiB(sizeBytes).toNumber(),
    sizeGiB: bytesToGiB(sizeBytes).toNumber(),
  };
};


export const getDatasetSizeMessageFromPieces = (dataset: DataSetWithPieces): string => {
  const sizeInBytes = dataset.pieces.reduce((acc, piece) => acc + getPieceInfoFromCidBytes(piece.cid).sizeBytes, 0n);
  return `Dataset size: ${bytesSizeToMessage(sizeInBytes)}`;
};

export const getDatasetsSizes = (datasets: DataSetWithPieces[]): {
  sizeInGiB: number;
  cdnSizeInGiB: number;
  nonCdnSizeInGiB: number;
} => {
  const sizes = datasets.reduce((acc, dataset) => {
    if (dataset.cdn) {
      acc.cdnSizeInBytes += Number(dataset.pieces.reduce((acc, piece) => acc + getPieceInfoFromCidBytes(piece.cid).sizeBytes, 0n));
    } else {
      acc.nonCdnSizeInBytes += Number(dataset.pieces.reduce((acc, piece) => acc + getPieceInfoFromCidBytes(piece.cid).sizeBytes, 0n));
    }
    acc.sizeInBytes += Number(dataset.pieces.reduce((acc, piece) => acc + getPieceInfoFromCidBytes(piece.cid).sizeBytes, 0n));
    return acc;
  }, { sizeInBytes: 0, cdnSizeInBytes: 0, nonCdnSizeInBytes: 0 } as {
    sizeInBytes: number;
    cdnSizeInBytes: number;
    nonCdnSizeInBytes: number;
  });
  return {
    sizeInGiB: Number(bytesToGiB(sizes.sizeInBytes).toNumber().toFixed(8)),
    cdnSizeInGiB: Number(bytesToGiB(sizes.cdnSizeInBytes).toNumber().toFixed(8)),
    nonCdnSizeInGiB: Number(bytesToGiB(sizes.nonCdnSizeInBytes).toNumber().toFixed(8)),
  };
}

const bytesSizeToMessage = (sizeInBytes: bigint): string => {
  if (sizeInBytes > SIZE_CONSTANTS.GiB) {
    return `${bytesToGiB(sizeInBytes).toNumber().toFixed(4)} GB`;
  }
  if (sizeInBytes > SIZE_CONSTANTS.MiB) {
    return `${bytesToMiB(sizeInBytes).toNumber().toFixed(4)} MB`;
  }
  if (sizeInBytes > SIZE_CONSTANTS.KiB) {
    return `${bytesToKiB(sizeInBytes).toNumber().toFixed(4)} KB`;
  }

  return `${sizeInBytes.toString()} B`;
};