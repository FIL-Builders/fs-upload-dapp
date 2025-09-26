import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useConfetti } from "@/hooks/useConfetti";
import {
  TOKENS,
  TIME_CONSTANTS,
  Synapse,
  WarmStorageService,
} from "@filoz/synapse-sdk";
import { DATA_SET_CREATION_FEE } from "@/utils";
import { useAccount } from "wagmi";
import { config } from "@/config";
import { useEthersSigner } from "./useEthers";
import {
  erc20PermitAbi,
  EIP2612_PERMIT_TYPES,
  paymentsAbi,
} from "@/utils/constants";
import { Address } from "viem";

import { erc20Abi, parseSignature } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";
import { MULTICALL_ADDRESS, USDFC_ADDRESS } from "@/utils/constants";
/**
 * Hook to handle payment for storage
 * @param lockup - The lockup amount to be used for the storage
 * @param epochRate - The epoch rate to be used for the storage
 * @param depositAmount - The deposit amount to be used for the storage
 * @notice LockUp is the accoumulated amount of USDFC that the user has locked up for Storing data over time.
 * It is different from the depositAmount. Which is the amount needed to pay for more storage if required.
 * @returns Mutation and status
 */
export const usePayment = () => {
  const [status, setStatus] = useState<string>("");
  const { triggerConfetti } = useConfetti();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { address, chainId } = useAccount();
  const signer = useEthersSigner();
  const mutation = useMutation({
    mutationKey: ["payment", address],
    mutationFn: async ({
      lockupAllowance,
      epochRateAllowance,
      depositAmount,
    }: {
      lockupAllowance: bigint;
      epochRateAllowance: bigint;
      depositAmount: bigint;
    }) => {
      if (!address) throw new Error("Address not found");
      if (!signer) throw new Error("Signer not found");
      if (!publicClient) throw new Error("Public client not found");
      if (!walletClient) throw new Error("Wallet client not found");
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain id not found");

      const synapse = await Synapse.create({
        signer,
        withCDN: config.withCDN,
      });

      const warmStorageService = await WarmStorageService.create(
        synapse.getProvider(),
        synapse.getWarmStorageAddress()
      );

      const paymentsAddress = synapse.getPaymentsAddress() as Address;
      const warmStorageAddress = synapse.getWarmStorageAddress() as Address;

      const dataset = (
        await warmStorageService.getClientDataSetsWithDetails(address)
      ).filter((dataset) => dataset.withCDN === config.withCDN);

      const hasDataset = dataset.length > 0;

      const fee = hasDataset ? 0n : DATA_SET_CREATION_FEE;

      const amount = depositAmount + fee;

      const balance = await synapse.payments.walletBalance(TOKENS.USDFC);

      if (balance < amount) {
        throw new Error("Insufficient USDFC balance");
      }

      setStatus("💰 Setting up your storage configuration...");

      const permitDeadline: bigint = BigInt(
        Math.floor(Date.now() / 1000) + 3600
      );

      const [nonce, domainVersion, tokenName] = await publicClient
        .multicall({
          multicallAddress: MULTICALL_ADDRESS,
          contracts: [
            {
              address: USDFC_ADDRESS,
              abi: erc20PermitAbi,
              functionName: "nonces",
              args: [address],
            },
            {
              address: USDFC_ADDRESS,
              abi: erc20PermitAbi,
              functionName: "version",
            },
            {
              address: USDFC_ADDRESS,
              abi: erc20Abi,
              functionName: "name",
            },
          ],
        })
        .then((results) => {
          return results.map((result) => result.result);
        });

      const domain = {
        name: tokenName as unknown as string,
        version: domainVersion as unknown as string,
        chainId,
        verifyingContract: USDFC_ADDRESS,
      };

      const value = {
        owner: address,
        spender: paymentsAddress,
        value: amount,
        nonce: nonce,
        deadline: permitDeadline,
      };

      let signatureHex = await walletClient.signTypedData({
        account: address,
        primaryType: "Permit",
        domain,
        types: EIP2612_PERMIT_TYPES,
        message: value,
      });

      const signature = parseSignature(signatureHex);

      const tx = await walletClient.writeContract({
        address: paymentsAddress,
        abi: paymentsAbi,
        functionName: "depositWithPermitAndApproveOperator",
        args: [
          USDFC_ADDRESS,
          address,
          amount,
          permitDeadline,
          signature.v as unknown as number,
          signature.r,
          signature.s,
          warmStorageAddress,
          epochRateAllowance,
          lockupAllowance,
          TIME_CONSTANTS.EPOCHS_PER_DAY * BigInt(config.persistencePeriod),
        ],
      });

      await publicClient.waitForTransactionReceipt({
        hash: tx,
      });

      setStatus("💰 You successfully configured your storage");
      return;
    },
    onSuccess: () => {
      setStatus("✅ Payment was successful!");
      triggerConfetti();
    },
    onError: (error) => {
      console.error("Payment failed:", error);
      setStatus(
        `❌ ${error.message || "Transaction failed. Please try again."}`
      );
    },
  });
  return { mutation, status };
};
