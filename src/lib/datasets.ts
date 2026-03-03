import type { PieceWithMetadata } from "@filoz/synapse-core/warm-storage";
import { DataSetWithPieces, UseServicePriceResult } from "@filoz/synapse-react";
import type { PDPProvider } from "@filoz/synapse-sdk";
import { getPieceInfoFromCid, normalizePieceCid, type SizeInfo } from "@/lib/piece";
import {
  bytesToGiB,
  calculateMinimumCapacityThreshold,
  computeMonthlyStorageCost,
} from "./decimal";
import { DECIMAL_PLACES } from "./format";

export interface Piece extends PieceWithMetadata, SizeInfo {}

/** Capital-S "DataSet" and "dataSetId" match the Synapse SDK naming convention. */
export interface DataSet extends Omit<DataSetWithPieces, "pieces"> {
  pieces: Piece[];
  totalSize: SizeInfo;
  provider: PDPProvider;
  serviceURL: string;
}

export interface UniquePiece {
  pieceCid: string;
  piece: Piece;
  datasets: { dataset: DataSet; pieceIndex: number }[];
}

export function transformDatasets(raw: DataSetWithPieces[] | undefined): DataSet[] {
  if (!raw) return [];

  return (
    raw
      .map((dataset) => {
        const pieces: Piece[] = [];
        let totalSizeBytes = 0n;

        for (const piece of dataset.pieces) {
          if (!piece.cid) continue;
          const sizeInfo = getPieceInfoFromCid(piece.cid);
          totalSizeBytes += sizeInfo.sizeBytes;
          pieces.push({ ...piece, ...sizeInfo });
        }

        return {
          ...dataset,
          pieces,
          totalSize: { sizeBytes: totalSizeBytes },
          provider: dataset.provider,
          serviceURL: dataset.provider.pdp.serviceURL,
        };
      })
      // pdpEndEpoch === 0n means the dataset has not been terminated
      .filter((dataset) => dataset.pdpEndEpoch === 0n)
  );
}

export function computeUniquePieces(datasets: DataSet[]): UniquePiece[] {
  if (datasets.length === 0) return [];

  const pieceMap = new Map<
    string,
    { piece: Piece; datasets: { dataset: DataSet; pieceIndex: number }[] }
  >();

  for (const dataset of datasets) {
    for (let pieceIndex = 0; pieceIndex < dataset.pieces.length; pieceIndex++) {
      const piece = dataset.pieces[pieceIndex];
      const cidString = normalizePieceCid(piece.cid);

      const existing = pieceMap.get(cidString);
      if (existing) {
        if (!existing.datasets.some((d) => d.dataset.dataSetId === dataset.dataSetId)) {
          existing.datasets.push({ dataset, pieceIndex });
        }
      } else {
        pieceMap.set(cidString, {
          piece: { ...piece, metadata: { ...piece.metadata, ...dataset.metadata } },
          datasets: [{ dataset, pieceIndex }],
        });
      }
    }
  }

  return Array.from(pieceMap.entries()).map(([pieceCid, { piece, datasets }]) => ({
    pieceCid,
    piece,
    datasets,
  }));
}

export function getDatasetsCostInfo(datasets: DataSet[], pricing: UseServicePriceResult) {
  const minimumCapacityGiB = calculateMinimumCapacityThreshold(
    pricing.pricePerTiBPerMonthNoCDN,
    pricing.minimumPricePerMonth,
  );

  return datasets.map((dataset) => {
    const sizeGiB = bytesToGiB(dataset.totalSize.sizeBytes);
    const { perMonth, isMinimumApplied } = computeMonthlyStorageCost(sizeGiB, pricing);

    // Calculate paid capacity and utilization
    const paidCapacityGiB = isMinimumApplied ? minimumCapacityGiB : sizeGiB;
    const utilizationPercent = paidCapacityGiB.gt(0)
      ? sizeGiB.div(paidCapacityGiB).mul(100).toNumber()
      : 100;
    const remainingFreeCapacityGiB = isMinimumApplied
      ? Math.max(0, minimumCapacityGiB.sub(sizeGiB).toNumber())
      : 0;

    return {
      datasetId: dataset.dataSetId.toString(),
      providerName: dataset.provider.name,
      sizeGiB: sizeGiB.toNumber(),
      isCDN: dataset.cdn,
      pieceCount: dataset.pieces.length,
      monthlyRateStr: perMonth.toFixed(DECIMAL_PLACES.RATE),
      isMinimumApplied,
      paidCapacityGiB: paidCapacityGiB.toNumber(),
      utilizationPercent: utilizationPercent,
      remainingFreeCapacityGiB: remainingFreeCapacityGiB,
    };
  });
}
