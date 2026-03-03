"use client";

import { uploadToContexts } from "@/app/upload/lib";
import { getErrorMessage } from "@/lib";
import { useDepositAndApprove } from "@filoz/synapse-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConnection, useWalletClient } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { fetchStorageMetrics } from "@/lib/storage-metrics";
import { getSynapseClient } from "@/lib/synapse-client";
import { useStorageConfig } from "@/providers/storage-config";
import {
  activateProviderUploadSteps,
  APP_METADATA,
  UPLOAD_STEPS,
  UploadParams,
  useUploadPhase,
} from "./use-upload-phase";

// ─── Standard / CDN upload ───────────────────────────────────────────────────

export const useUpload = () => {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();
  const { config } = useStorageConfig();
  const { mutateAsync: depositAndApprove } = useDepositAndApprove();
  const phase = useUploadPhase();

  const mutation = useMutation({
    mutationKey: queryKeys.upload(address, chainId),
    mutationFn: async ({ copies, files, withCDN }: UploadParams) => {
      if (!walletClient || !address || !chainId)
        throw new Error("Invalid wallet client or address or chain ID");

      phase.start(UPLOAD_STEPS);

      const synapse = await getSynapseClient();

      phase.advance("session", "resolve");

      const contexts = await synapse.storage.createContexts({
        count: copies,
        metadata: withCDN ? { ...APP_METADATA, withCDN: "" } : APP_METADATA,
        withCDN,
      });

      phase.advance("resolve", "calculate", "Calculating storage...");
      const datasetsToCreate = contexts.filter((c) => c.dataSetId === undefined).length;

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      // Storage metrics
      const { isSufficient, depositNeeded } = await fetchStorageMetrics(
        walletClient,
        address,
        config,
        totalSize * copies,
        { count: datasetsToCreate, withCDN: !!withCDN },
      );

      phase.complete("calculate");

      if (!isSufficient) {
        phase.activate("deposit", "Depositing funds...");
        await depositAndApprove({ amount: depositNeeded });
        phase.complete("deposit");
      } else {
        phase.skip("deposit");
      }

      activateProviderUploadSteps(phase, contexts.length);

      const { pieces, failures } = await uploadToContexts(contexts, files, phase, {
        onProviderError: (provider, msg) => {
          toast.error(`Provider ${provider.name} failed: ${msg}`);
        },
      });

      return {
        pieces,
        failures,
        fileCount: files.length,
        copies,
        totalSize,
        hasFailures: failures.length > 0,
      };
    },
    onSuccess: (data) => {
      phase.finish({ kind: "standard", ...data });
      if (data.hasFailures) {
        toast.warning("Stored with some failures");
      } else {
        toast.success("Stored on Filecoin!");
      }
      phase.invalidateAfterUpload();
    },
    onError: (err) => {
      const errorMessage = getErrorMessage(err);
      phase.fail(errorMessage);
      toast.error(errorMessage, { id: "upload" });
    },
  });

  return {
    upload: (params: UploadParams) => mutation.mutate(params),
    phase: phase.phase,
    isPending: mutation.isPending,
    reset: () => {
      phase.reset();
      mutation.reset();
    },
  };
};
