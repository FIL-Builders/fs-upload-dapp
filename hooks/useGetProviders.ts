import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";

/**
 * Fetches all active and approved storage providers from the Filecoin registry.
 * Providers are filtered to only include those verified and available for storage deals.
 * @returns Query object with array of approved ProviderInfo objects

 */
export const useGetProviders = () => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  return useQuery({
    queryKey: ["getProviders"],
    queryFn: async () => {
      // === VALIDATION AND INITIALIZATION ===
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      const synapse = await Synapse.create({
        signer,
      });

      const storageInfo = await synapse.getStorageInfo();

      // Fetch all active providers (registered in system)
      return storageInfo.providers;
    },
  });
};
