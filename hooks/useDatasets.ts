"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DataSetPieceData,
  EnhancedDataSetInfo,
  PDPServer,
} from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { DataSet } from "@/types";
import { getDatasetSizeMessage } from "@/utils/storageCalculations";
import { UnifiedSizeInfo as PieceSizeInfo } from "@/types";
import { useEthersSigner } from "@/hooks/useEthers";
import { Synapse } from "@filoz/synapse-sdk";
import { useConfig } from "@/providers/ConfigProvider";
import { getPieceInfoFromCidBytes } from "@/utils/storageCalculations";

/**
 * Hook to fetch and manage user datasets from Filecoin storage
 *
 * @description This hook demonstrates a complex data fetching workflow:
 * 1. Initialize Synapse and WarmStorage services
 * 2. Fetch approved providers and user datasets in parallel
 * 3. Map provider relationships and fetch provider details
 * 4. Enrich datasets with provider information and PDP data
 * 5. Handle errors gracefully while maintaining data integrity
 * 6. Implement caching and background refresh strategies
 */
export const useDatasets = () => {
  const { address, chainId } = useAccount();
  const signer = useEthersSigner();
  const { config } = useConfig();
  return useQuery({
    enabled: !!address && signer?.address === address,
    queryKey: ["datasets", address, chainId],
    queryFn: async () => {
      // STEP 1: Validate prerequisites
      if (!signer) throw new Error("Signer not found");
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      // STEP 2: Fetch providers and datasets in parallel for efficiency
      const datasets = await synapse.storage.findDataSets();

      // STEP 3: Fetch provider information with error handling
      const providers = await Promise.all(
        datasets.map((dataset) => synapse.getProviderInfo(dataset.providerId))
      );

      // STEP 5: Fetch detailed dataset information with PDP data
      const datasetDataResults = await Promise.all(
        datasets.map(async (dataset: EnhancedDataSetInfo) => {
          const provider = providers.find((p) => p.id === dataset.providerId)!
          const serviceURL = provider.products.PDP?.data.serviceURL || "";

          try {
            // STEP 6: Connect to PDP server to get piece information
            const pdpServer = new PDPServer(null, serviceURL);
            const data = await pdpServer
              .getDataSet(dataset.pdpVerifierDataSetId)
              .then((data) => {
                // Reverse to show most recent uploads first in UI
                data.pieces.reverse();
                return data;
              });

            // STEP 7: Create pieces map
            const pieces = data.pieces.reduce(
              (acc, piece: DataSetPieceData) => {
                acc[piece.pieceCid.toV1().toString()] =
                  getPieceInfoFromCidBytes(piece.pieceCid);
                return acc;
              },
              {} as Record<string, PieceSizeInfo>
            );

            const datasetSizeInfo = data.pieces.reduce((acc, piece: DataSetPieceData) => {
              acc.sizeInBytes += Number(pieces[piece.pieceCid.toV1().toString()].sizeBytes);
              acc.sizeInKiB += Number(pieces[piece.pieceCid.toV1().toString()].sizeKiB);
              acc.sizeInMiB += Number(pieces[piece.pieceCid.toV1().toString()].sizeMiB);
              acc.sizeInGB += Number(pieces[piece.pieceCid.toV1().toString()].sizeGiB);
              return acc;
            }, { sizeInBytes: 0, sizeInKiB: 0, sizeInMiB: 0, sizeInGB: 0, message: "" });

            return {
              ...dataset,
              ...{ ...datasetSizeInfo, message: getDatasetSizeMessage(datasetSizeInfo) },
              serviceURL: serviceURL,
              data, // Contains pieces array with CIDs
              pieceSizes: pieces,
            } as DataSet;
          } catch (error) {
            console.warn(
              `Failed to fetch dataset details for ${dataset.pdpVerifierDataSetId}:`,
              error
            );
            // Return dataset without detailed data but preserve basic info
            return {
              ...dataset,
              provider: provider,
              serviceURL: serviceURL,
            } as unknown as DataSet;
          }
        })
      );

      // STEP 9: Map results back to original dataset order
      const datasetsWithDetails = datasets.map((dataset) => {
        const dataResult = datasetDataResults.find(
          (result) =>
            result.pdpVerifierDataSetId === dataset.pdpVerifierDataSetId
        );
        return dataResult;
      });

      return datasetsWithDetails.filter((dataset) => !!dataset);
    },
  });
};
