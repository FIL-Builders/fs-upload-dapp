import { BrowserProvider, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import type { Account, Chain, Client, Transport } from "viem";
import { type Config, useAccount, useConnectorClient } from "wagmi";

export const clientToSigner = (client: Client<Transport, Chain, Account>) => {
  const { account, chain, transport } = client;
  if (!chain) return null;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  provider.getSigner();
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
};

export const clientToProvider = (client: Client<Transport, Chain, Account>) => {
  const { chain, transport } = client;
  if (!chain) return null;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  return provider;
};

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export const useEthersSigner = ({ chainId }: { chainId?: number } = {}) => {
  const { address } = useAccount();
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(
    () => (client ? clientToSigner(client) : undefined),
    [client, address]
  );
};
/** Hook to convert a viem Wallet Client to an ethers.js Provider. */
export const useEthersProvider = ({ chainId }: { chainId?: number } = {}) => {
  const { address } = useAccount();
  const { data: client } = useConnectorClient<Config>({ chainId });
  return useMemo(
    () => (client ? clientToProvider(client) : undefined),
    [client, address]
  );
};
