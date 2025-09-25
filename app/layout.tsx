// app/layout.jsx
"use client";

import "./globals.css";
import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
const RainbowKitProvider = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.RainbowKitProvider),
  { ssr: false }
);
import "@rainbow-me/rainbowkit/styles.css";
import * as React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConfettiProvider } from "@/providers/ConfettiProvider";
import Footer from "@/components/ui/Footer";
import { GeolocationProvider } from "@/providers/GeolocationProvider";
import { SynapseProvider } from "@/providers/SynapseProvider";

// Defer importing wallets/connectors to the client to avoid SSR IndexedDB usage

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [wagmiConfig, setWagmiConfig] = React.useState<ReturnType<
    typeof createConfig
  > | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ connectorsForWallets }, walletsModule] = await Promise.all([
        import("@rainbow-me/rainbowkit"),
        import("@rainbow-me/rainbowkit/wallets"),
      ]);

      const wagmiConnectors = connectorsForWallets(
        [
          {
            groupName: "Supported Wallets",
            wallets: [
              walletsModule.metaMaskWallet,
              walletsModule.walletConnectWallet,
              walletsModule.ledgerWallet,
              walletsModule.rainbowWallet,
              walletsModule.safeWallet,
              walletsModule.rabbyWallet,
            ],
          },
        ],
        {
          appName: "filecoin-onchain-cloud-dapp",
          projectId: "3a8170812b534d0ff9d794f19a901d64",
        }
      );

      const cfg = createConfig({
        ssr: false,
        chains: [filecoinCalibration, filecoin],
        connectors: wagmiConnectors,
        transports: {
          [filecoin.id]: http("https://rpc.ankr.com/filecoin"),
          [filecoinCalibration.id]: http(
            "https://rpc.ankr.com/filecoin_testnet"
          ),
        },
      });

      if (mounted) setWagmiConfig(cfg);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <title>Filecoin onchain cloud demo</title>
        <meta
          name="description"
          content="Demo dApp Powered by synapse-sdk. Upload files to Filecoin with USDFC."
        />
        <meta
          name="keywords"
          content="Filecoin, Demo, synapse-sdk, pdp, upload, filecoin, usdfc"
        />
        <meta name="author" content="FIL-Builders" />
        <meta name="viewport" content="width=device-width, initial-scale=0.6" />
        <link rel="icon" href="/filecoin.svg" />
      </head>
      <body>
        <GeolocationProvider
          onBlocked={(info: any) => {
            console.log("blocked", info);
          }}
        >
          <ThemeProvider>
            <ConfettiProvider>
              <QueryClientProvider client={queryClient}>
                {wagmiConfig ? (
                  <WagmiProvider config={wagmiConfig}>
                    <RainbowKitProvider
                      modalSize="compact"
                      initialChain={filecoinCalibration.id}
                    >
                      <SynapseProvider>
                        <main className="flex flex-col min-h-screen">
                          <Navbar />
                          {children}
                        </main>
                        <Footer />
                      </SynapseProvider>
                    </RainbowKitProvider>
                  </WagmiProvider>
                ) : null}
              </QueryClientProvider>
            </ConfettiProvider>
          </ThemeProvider>
        </GeolocationProvider>
      </body>
    </html>
  );
}
