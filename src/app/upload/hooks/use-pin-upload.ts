"use client";

import { buildCarFromFiles, uploadToContexts, waitForIpniProviderResults } from "@/app/upload/lib";
import { getErrorMessage } from "@/lib";
import { useApproveOperator, useDepositAndApprove } from "@filoz/synapse-react";
import { useMutation } from "@tanstack/react-query";
import { CID } from "multiformats/cid";
import { toast } from "sonner";
import { useConnection, useWalletClient } from "wagmi";
import { queryKeys } from "@/lib/query-keys";
import { getSynapseClient } from "@/lib/synapse-client";
import {
  activateProviderUploadSteps,
  PIN_STEPS,
  uploadMetadataForMode,
  UploadParams,
  useUploadPhase,
} from "./use-upload-phase";

// ─── IPFS Pin upload ─────────────────────────────────────────────────────────

export const useFilecoinPinUpload = () => {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();
  const { mutateAsync: depositAndApprove } = useDepositAndApprove();
  const { mutateAsync: approveOperator } = useApproveOperator();
  const phase = useUploadPhase();

  const mutation = useMutation({
    mutationKey: queryKeys.pinUpload(address, chainId),
    mutationFn: async ({ copies, files }: UploadParams) => {
      if (!walletClient || !address || !chainId)
        throw new Error("Invalid wallet client or address or chain ID");
      if (files.length === 0) throw new Error("No files selected");

      // Build CAR file first
      phase.start(PIN_STEPS);

      const { rootCid, carBytes, totalFiles, totalSize } = await buildCarFromFiles(files);

      phase.advance("car", "session");

      const synapse = await getSynapseClient();

      phase.advance("session", "resolve");

      const metadata = uploadMetadataForMode("pin");
      const contexts = await synapse.storage.createContexts({ copies, metadata });

      phase.advance("resolve", "calculate", "Calculating storage...");

      // Exact on-chain costs (one CAR piece per copy). depositNeeded is the
      // minimum shortfall after netting available balance.
      const costs = await synapse.storage.calculateMultiContextCosts(contexts, {
        dataSize: BigInt(carBytes.length),
      });

      phase.complete("calculate");

      if (!costs.ready) {
        // depositAndApprove deposits the shortfall AND (re)approves the FWSS
        // operator atomically; it rejects a zero amount. When funds already
        // cover the upload and only the operator approval is missing, approve
        // directly instead.
        if (costs.depositNeeded > 0n) {
          phase.activate("deposit", "Depositing funds...");
          await depositAndApprove({ amount: costs.depositNeeded });
        } else {
          phase.activate("deposit", "Approving operator...");
          await approveOperator();
        }
        phase.complete("deposit");
      } else {
        phase.skip("deposit");
      }

      // Resolve contexts
      const carBlob = new Blob([carBytes.buffer as ArrayBuffer]);
      const carFile = new File([carBlob], `${rootCid}.car`);

      activateProviderUploadSteps(phase, contexts.length);

      const { pieces, failures } = await uploadToContexts(contexts, [carFile], phase, {
        metadata: { ipfsRootCid: rootCid },
        onProviderError: (provider, msg) => {
          toast.error(`Provider ${provider.name} failed: ${msg}`);
        },
      });

      // IPNI verification
      toast.loading("Verifying IPNI advertisement...", { id: "pin-upload" });
      const ipniSuccess = await waitForIpniProviderResults(CID.parse(rootCid));
      if (!ipniSuccess) {
        throw new Error("IPNI advertisement verification failed");
      }

      return {
        pieces,
        failures,
        fileCount: totalFiles,
        // Actual destinations resolved (may differ from requested copies)
        copies: contexts.length,
        totalSize,
        ipfsRootCid: rootCid,
        hasFailures: failures.length > 0,
      };
    },
    onSuccess: (data) => {
      phase.finish({ kind: "pin", ...data });
      if (data.hasFailures) {
        toast.warning("Pinned with some failures", { id: "pin-upload" });
      } else {
        toast.success("Pinned to Filecoin!", { id: "pin-upload" });
      }
      phase.invalidateAfterUpload();
    },
    onError: (err) => {
      phase.fail(getErrorMessage(err));
      toast.error(getErrorMessage(err), { id: "pin-upload" });
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
