"use client";

import Image from "next/image";
import { useIsMounted } from "@/hooks";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Github } from "lucide-react";
import { useConnection } from "wagmi";

function ConnectWalletScreen({ children }: { children: React.ReactNode }) {
  const { isConnected } = useConnection();
  if (isConnected) {
    return <>{children}</>;
  }
  return (
    <div className="px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto text-center space-y-2">
        <Image
          src="/filecoin.svg"
          alt="Filecoin"
          width={16}
          height={16}
          priority
          className="h-16 w-16 mx-auto mb-6 text-muted-foreground"
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Decentralized Storage on Filecoin
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Store your files securely on the Filecoin network with{" "}
          <a
            href="https://docs.secured.finance/usdfc-stablecoin/getting-started"
            className="text-[#e9ac00] hover:underline cursor-pointer"
            target="_blank"
          >
            USDFC
          </a>
          . Connect your wallet to get started.
        </p>
      </div>
      <div className="flex justify-center">
        <ConnectButton />
      </div>
      <p className="text-xl font-semibold hover:text-foreground flex flex-row items-center gap-1 justify-center mt-8">
        <a
          href="https://github.com/FIL-Builders/fs-upload-dapp"
          className="text-primary hover:underline cursor-pointer rounded-md hover:text-[#008cf6]"
          target="_blank"
        >
          <Github />
        </a>
        <span>powered by</span>
        <a
          href="https://github.com/FilOzone/synapse-sdk"
          className="text-primary hover:underline cursor-pointer hover:text-[#008cf6] rounded-md"
          target="_blank"
        >
          synapse-sdk
        </a>
      </p>
    </div>
  );
}

interface WalletGuardProps {
  children: React.ReactNode;
}

export function WalletGuard({ children }: WalletGuardProps) {
  const isMounted = useIsMounted();

  if (isMounted) {
    return <ConnectWalletScreen>{children}</ConnectWalletScreen>;
  }

  return <>{children}</>;
}
