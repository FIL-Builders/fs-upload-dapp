import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "./useEthers";
import { ethers } from "ethers";

/**
 * Hook for creating new storage sessions on Filecoin.
 * Handles payment processing and session creation with progress tracking.
 * Progress stages: 10% payment, 45% creation started, 80% tx confirmed, 90% provider confirmed.
 * @returns Mutation object with progress tracking and status
 */
export const useSession = (setStatus: (status: string) => void) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  return useMutation({
    mutationKey: ["session", address],
    mutationFn: async () => {
      if (!signer) throw new Error("Signer not found");
      let sessionPrivateKey = getSessionPrivateKey();
      if (!sessionPrivateKey) {
        const { privateKey, address } = createRandomPrivateKey();
        saveSessionPrivateKey(privateKey);
        sessionPrivateKey = privateKey;
      }

      // Reset state for new upload
      setStatus("🔄 Initializing session...");

      // === SYNAPSE SDK INITIALIZATION ===
      // Create Synapse instance with user's configuration settings
      const synapse = await Synapse.create({
        signer,
      });

      const wallet = new ethers.Wallet(
        sessionPrivateKey,
        signer.provider
      ) satisfies ethers.Signer as ethers.Signer;

      const sessionKey = synapse.createSessionKey(wallet);

      const blockNumber = await signer.provider.getBlockNumber();
      // 30 seconds per block
      const oneMonthInBlocks = (30 * 24 * 60 * 60) / 30;
      const expiryBlockNumber = blockNumber + oneMonthInBlocks;

      const expiries = await sessionKey.fetchExpiries();

      console.log("Expiries:", expiries);

      const needsExtension = Object.values(expiries).some(
        (expiry) => expiry < BigInt(blockNumber)
      );

      if (needsExtension) {
        window.alert("❌ Session key needs to be extended");
        const loginResponse = await sessionKey.login(BigInt(expiryBlockNumber));
        console.log("Login response:", loginResponse);
        await loginResponse.wait(1);
        window.alert("✅ Session key extended");
      }

      setStatus("✅ Session successfully initialized!");

      return sessionKey;
    },
  });
};

export const createRandomPrivateKey = () => {
  const newWallet = ethers.Wallet.createRandom();
  return {
    privateKey: newWallet.privateKey,
    address: newWallet.address,
  };
};

export const saveSessionPrivateKey = (privateKey: string) => {
  // Set the session private key in the local storage
  localStorage.setItem(
    "sessionPrivateKey",
    JSON.stringify({
      privateKey,
      createdAt: new Date().toISOString(),
    })
  );
};

export const getSessionPrivateKey = () => {
  const sessionPrivateKey = localStorage.getItem("sessionPrivateKey");
  if (!sessionPrivateKey) return null;
  const { privateKey } = JSON.parse(sessionPrivateKey);
  return privateKey;
};
