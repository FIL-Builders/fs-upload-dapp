"use client";

import { uploadToContexts } from "@/app/upload/lib";
import { getErrorMessage } from "@/lib";
import { useDepositAndApprove } from "@filoz/synapse-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConnection, useWalletClient } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { getSynapseClient } from "@/lib/synapse-client";
import {
  activateProviderUploadSteps,
  UPLOAD_STEPS,
  uploadMetadataForMode,
  UploadParams,
  useUploadPhase,
} from "./use-upload-phase";

// ─── Standard / CDN upload ───────────────────────────────────────────────────

export const useUpload = () => {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();
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

      const metadata = uploadMetadataForMode(withCDN ? "cdn" : "standard");
      const contexts = await synapse.storage.createContexts({ copies, metadata, withCDN });

      phase.advance("resolve", "calculate", "Calculating storage...");

      const totalSize = files.reduce((acc, file) => acc + file.size, 0);

      // Exact on-chain costs for the resolved contexts. depositNeeded is the
      // minimum shortfall after netting available balance (lockups + fees +
      // debt − available); funds the upload for the protocol lockup period.
      const costs = await synapse.storage.calculateMultiContextCosts(contexts, {
        dataSize: BigInt(totalSize),
      });

      phase.complete("calculate");

      if (!costs.ready) {
        phase.activate("deposit", "Depositing funds...");
        await depositAndApprove({ amount: costs.depositNeeded });
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
        // Actual destinations resolved (may differ from requested copies)
        copies: contexts.length,
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
