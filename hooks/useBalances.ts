import { useQuery } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersProvider } from "@/hooks/useEthers";
import { useAccount } from "wagmi";

const formatBalance = (balance: bigint, decimals: number) => {
  return Number(balance) / 10 ** decimals;
};

export function useBalances() {
  const provider = useEthersProvider();
  const { address } = useAccount();
  const query = useQuery({
    enabled: !!address && !!provider,
    queryKey: ["balances", address],
    queryFn: async () => {
      if (!provider) throw new Error("Provider not found");
      const synapse = await Synapse.create({ provider });
      const filRaw: bigint = await synapse.walletBalance();
      const usdfcRaw: bigint = await synapse.walletBalance(Synapse.USDFC);
      const paymentsRaw: bigint = await synapse.balance(Synapse.USDFC);
      const usdfcDecimals: number = synapse.decimals(Synapse.USDFC);
      return {
        filBalance: formatBalance(filRaw, 18),
        usdfcBalance: formatBalance(usdfcRaw, usdfcDecimals),
        paymentsBalance: formatBalance(paymentsRaw, usdfcDecimals),
      };
    },
  });

  return query;
}
