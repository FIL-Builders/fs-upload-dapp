"use client";

import { getErrorMessage } from "@/lib";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConnection } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { getSynapseClient } from "@/lib/synapse-client";
import { useStorageConfig } from "@/providers/storage-config";

export const useDeletePiece = (dataSetId: bigint, pieceId: bigint) => {
  const { address, chainId, isConnected } = useConnection();
  const queryClient = useQueryClient();
  const { config } = useStorageConfig();
  const toastId = `delete-piece-${dataSetId.toString()}-${pieceId.toString()}`;
  return useMutation({
    mutationKey: queryKeys.deletePiece(address, chainId, dataSetId.toString(), pieceId.toString()),
    mutationFn: async () => {
      if (!isConnected) throw new Error("Wallet not connected");
      const synapse = await getSynapseClient();
      toast.loading("Deleting piece...", { id: toastId });

      const context = await synapse.storage.createContext({
        dataSetId,
      });

      const hash = await context.deletePiece({
        piece: pieceId,
      });

      await synapse.client.waitForTransactionReceipt({
        hash,
      });
    },
    onSuccess: () => {
      toast.success("Piece deleted!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets(address, chainId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: toastId });
    },
  });
};

export const useDeleteDataset = (dataSetId: bigint) => {
  const { address, chainId, isConnected } = useConnection();
  const queryClient = useQueryClient();
  const { config } = useStorageConfig();
  const toastId = `delete-dataset-${dataSetId}`;
  return useMutation({
    mutationKey: queryKeys.deleteDataset(address, chainId, dataSetId.toString()),
    mutationFn: async () => {
      if (!isConnected) throw new Error("Wallet not connected");
      const synapse = await getSynapseClient(false);

      const context = await synapse.storage.createContext({
        dataSetId,
      });
      toast.loading("Deleting dataset...", { id: toastId });

      // Provider-relayed by default; txHash is only set when an on-chain
      // transaction was submitted (fallback path)
      const result = await context.terminate();
      if (result.txHash) {
        await synapse.client.waitForTransactionReceipt({
          hash: result.txHash,
        });
      }
    },
    onSuccess: () => {
      toast.success("Dataset deleted!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasets(address, chainId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(address, config, chainId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error), { id: toastId });
    },
  });
};
