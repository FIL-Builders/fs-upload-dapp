import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Synapse, WarmStorageService } from "@filoz/synapse-sdk";
import { SPRegistryService } from "@filoz/synapse-sdk/sp-registry";

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
    queryKey: ["getProviders"], // No address: providers list is same for all users
    queryFn: async () => {
      // === VALIDATION AND INITIALIZATION ===
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");

      const synapse = await Synapse.create({
        signer,
      });

      // Get warm storage contract address (Filecoin's fast-retrieval storage layer)
      const warmStorageAddress = synapse.getWarmStorageAddress();
      const warmStorageService = await WarmStorageService.create(
        synapse.getProvider(),
        warmStorageAddress
      );

      // Service provider registry tracks all registered storage providers for the network
      const serviceProviderRegistryAddress =
        warmStorageService.getServiceProviderRegistryAddress();
      const serviceProviderRegistryService = await SPRegistryService.create(
        synapse.getProvider(),
        serviceProviderRegistryAddress
      );

      // Fetch all active providers (registered in system)
      const providers =
        await serviceProviderRegistryService.getAllActiveProviders();
      // Filter to only approved providers (verified and available for deals)
      const approvedProviders = await Promise.all(
        providers.map(async (provider) => {
          try {
            return await synapse.getProviderInfo(provider.serviceProvider);
          } catch {
            // Return null for failed providers (allows partial results if some providers error)
            return null;
          }
        })
      );
      return approvedProviders.filter((provider) => provider !== null);
    },
  });
};
