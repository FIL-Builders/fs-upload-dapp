import { useMutation } from "@tanstack/react-query";
import { useAccount, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { Secp256k1Key } from "@filoz/synapse-core/session-key";

/**
 * Hook for creating new storage sessions on Filecoin.
 * Handles payment processing and session creation with progress tracking.
 * Progress stages: 10% payment, 45% creation started, 80% tx confirmed, 90% provider confirmed.
 *
 * @returns Mutation object with progress tracking and status
 *
 * @example
 * ```tsx
 * const { uploadFileMutation, progress, status } = useCreateSession();
 * await uploadFileMutation.mutateAsync({ withCDN: true, providerId: undefined });
 * ```
 */
export const useSession = (setStatus: (status: string) => void) => {
  const { address } = useAccount();
  const { data: client } = useWalletClient();
  return useMutation({
    mutationKey: ["session", address],
    mutationFn: async () => {
      if (!client) throw new Error("Wallet client not found");

      let sessionPrivateKey = getSessionPrivateKey();
      if (!sessionPrivateKey) {
        const { privateKey } = createRandomPrivateKey();
        saveSessionPrivateKey(privateKey);
        sessionPrivateKey = privateKey;
      }

      // Reset state for new upload
      setStatus("🔄 Initializing session...");

      const sessionKey = Secp256k1Key.create({ privateKey: sessionPrivateKey, expiresAt: Date.now() / 1000 + 30 * 24 * 60 * 60 });

      const needsExtension = (await Promise.all([sessionKey.isValid(client, "AddPieces"), sessionKey.isValid(client, "CreateDataSet"), sessionKey.isValid(client, "SchedulePieceRemovals"), sessionKey.isValid(client, "DeleteDataSet")]))
        .some((result) => result === false);


      if (needsExtension) {
        window.alert("❌ Session key needs to be extended");
        const loginResponse = await sessionKey.refresh(client);
        console.log("Login response:", loginResponse);
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
