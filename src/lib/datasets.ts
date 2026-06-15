import { calculateEffectiveRate, type PieceWithMetadata } from "@filoz/synapse-core/warm-storage";
import { DataSetWithPieces, UsePriceListResult } from "@filoz/synapse-react";
import { TIME_CONSTANTS, type PDPProvider } from "@filoz/synapse-sdk";
import { getPieceInfoFromCid, normalizePieceCid, type SizeInfo } from "@/lib/piece";
import { bigIntToDecimal, bytesToGiB } from "./decimal";
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

export function getDatasetsCostInfo(datasets: DataSet[], pricing: UsePriceListResult) {
  return datasets.map((dataset) => {
    const sizeGiB = bytesToGiB(dataset.totalSize.sizeBytes);

    // Contract-accurate recurring rate: size-based storage + flat dataset fee
    const { ratePerMonth } = calculateEffectiveRate({
      sizeInBytes: dataset.totalSize.sizeBytes,
      storagePerTibPerMonth: pricing.rates.storagePerTibPerMonth,
      datasetFeePerMonth: pricing.rates.datasetFeePerMonth,
      epochsPerMonth: TIME_CONSTANTS.EPOCHS_PER_MONTH,
    });

    const perMonth = bigIntToDecimal(ratePerMonth, 18);
    const datasetFee =
      dataset.totalSize.sizeBytes > 0n
        ? bigIntToDecimal(pricing.rates.datasetFeePerMonth, 18)
        : bigIntToDecimal(0n, 18);
    const storagePerMonth = perMonth.sub(datasetFee);
    const feeOverheadPercent = perMonth.gt(0) ? datasetFee.div(perMonth).mul(100).toNumber() : 0;

    return {
      datasetId: dataset.dataSetId.toString(),
      providerName: dataset.provider.name,
      sizeGiB: sizeGiB.toNumber(),
      isCDN: dataset.cdn,
      pieceCount: dataset.pieces.length,
      monthlyRateStr: perMonth.toFixed(DECIMAL_PLACES.RATE),
      storageMonthlyStr: storagePerMonth.toFixed(DECIMAL_PLACES.RATE),
      datasetFeeStr: datasetFee.toFixed(DECIMAL_PLACES.RATE),
      /** Share of the monthly rate consumed by the flat per-dataset fee. */
      feeOverheadPercent,
    };
  });
}
