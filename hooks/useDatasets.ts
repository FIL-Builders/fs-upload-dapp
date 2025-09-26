"use client";

import { useQuery } from "@tanstack/react-query";
import {
  DataSetPieceData,
  EnhancedDataSetInfo,
  PDPServer,
} from "@filoz/synapse-sdk";
import { useAccount } from "wagmi";
import { DataSet } from "@/types";
import { getDatasetsSizeInfo } from "@/utils/calculateStorageMetrics";
import { getPieceInfoFromCidBytes } from "@/utils/cids";
import { PieceSizeInfo } from "@/types";
import { useEthersSigner } from "./useEthers";
import { Synapse } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { getQueryKey } from "@/utils/constants";

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
 *
 * @returns React Query result containing enriched datasets with provider info
 *
 * @example
 * const { data, isLoading, error } = useDatasets();
 *
 * if (data?.datasets?.length > 0) {
 *   const firstPieceCid = data.datasets[0]?.data?.pieces[0]?.pieceCid;
 *   console.log('Flag (First Piece CID):', firstPieceCid);
 * }
 */
export const useDatasets = () => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  return useQuery({
    enabled: !!address && signer?.address === address,
    queryKey: getQueryKey("datasets", address),
    queryFn: async () => {
      // STEP 1: Validate prerequisites
      if (!signer) throw new Error("Signer not found");
      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      // STEP 3: Fetch providers and datasets in parallel for efficiency
      const datasets = await synapse.storage.findDataSets();

      // STEP 5: Fetch provider information with error handling
      const datasetsSizeInfo = await getDatasetsSizeInfo(datasets, synapse);

      const providers = await Promise.all(
        datasets.map((dataset) => synapse.getProviderInfo(dataset.providerId))
      );

      // STEP 6: Create provider ID to service URL mapping
      const providerIdToServiceUrlMap = providers.reduce((acc, provider) => {
        acc[provider.id] = provider.products.PDP?.data.serviceURL || "";
        return acc;
      }, {} as Record<string, string>);

      // STEP 7: Fetch detailed dataset information with PDP data
      const datasetDataResults = await Promise.all(
        datasets.map(async (dataset: EnhancedDataSetInfo) => {
          const serviceURL = providerIdToServiceUrlMap[dataset.providerId];
          const provider = providers.find((p) => p.id === dataset.providerId);

          try {
            // Connect to PDP server to get piece information
            const pdpServer = new PDPServer(null, serviceURL || "");
            const data = await pdpServer.getDataSet(
              dataset.pdpVerifierDataSetId
            );
            // CID PARSING METHOD: For exact piece sizes matching smart contract logic
            // Process pieces and calculate exact sizes from CID bytes
            const pieces = data.pieces.reduce(
              (acc, piece: DataSetPieceData) => {
                acc[piece.pieceCid.toV1().toString()] =
                  getPieceInfoFromCidBytes(piece.pieceCid.bytes);
                return acc;
              },
              {} as Record<string, PieceSizeInfo>
            );

            return {
              ...dataset,
              provider: provider,
              serviceURL: serviceURL,
              data, // Contains pieces array with CIDs
              pieceSizes: pieces,
              ...datasetsSizeInfo[dataset.pdpVerifierDataSetId],
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
              ...datasetsSizeInfo[dataset.pdpVerifierDataSetId],
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

      return { datasets: datasetsWithDetails };
    },
  });
};
