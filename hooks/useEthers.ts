import { BrowserProvider, JsonRpcSigner } from "ethers";
import type { Account, Chain, Client, Transport } from "viem";
import { type Config, useConnectorClient } from "wagmi";

export const clientToSigner = (client: Client<Transport, Chain, Account> | undefined) => {
  if (!client) return null;
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
  };
  const provider = new BrowserProvider(transport, network);

  return new JsonRpcSigner(provider, account.address);
};

export const clientToProvider = (client: Client<Transport, Chain, Account> | undefined) => {
  if (!client) return null;
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
  };
  return new BrowserProvider(transport, network);
};

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export const useEthersSigner = ({ chainId }: { chainId?: number } = {}) => {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return clientToSigner(client)
};
/** Hook to convert a viem Wallet Client to an ethers.js Provider. */
export const useEthersProvider = ({ chainId }: { chainId?: number } = {}) => {
  const { data: client } = useConnectorClient<Config>({ chainId });
  return clientToProvider(client)
};
