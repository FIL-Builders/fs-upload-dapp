"use client";

import { Synapse, WarmStorageService } from "@filoz/synapse-sdk";
import { createContext, useState, useEffect, useContext } from "react";
import { useEthersSigner } from "@/hooks/useEthers";
import { config } from "@/config";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

export const SynapseContext = createContext<{
  synapse: Synapse | null;
  warmStorageService: WarmStorageService | null;
}>({ synapse: null, warmStorageService: null });

export const SynapseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [context, setContext] = useState<{
    synapse: Synapse | null;
    warmStorageService: WarmStorageService | null;
  }>({ synapse: null, warmStorageService: null });
  const signer = useEthersSigner();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const createSynapse = async () => {
    if (!signer) return;

    const synapseAddress = await context.synapse?.getSigner().getAddress();
    if (synapseAddress !== address) {
      console.table({ synapseAddress, address });
      queryClient.clear();
    }
    const synapse = await Synapse.create({
      signer,
      withCDN: config.withCDN,
    });

    const warmStorageService = await WarmStorageService.create(
      synapse.getProvider(),
      synapse.getWarmStorageAddress()
    );
    setContext({ synapse, warmStorageService });
  };
  useEffect(() => {
    createSynapse();
  }, [signer, address]);

  return (
    <SynapseContext.Provider value={context}>
      {children}
    </SynapseContext.Provider>
  );
};

export const useSynapse = () => {
  const { synapse, warmStorageService } = useContext(SynapseContext);
  return { synapse, warmStorageService };
};
