// app/layout.jsx
"use client";

import "./globals.css";
import { WagmiProvider } from "wagmi";
import { filecoinCalibration } from "wagmi/chains";
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
import { ConfigProvider } from "@/providers/ConfigProvider";
import Footer from "@/components/ui/Footer";
import { GeolocationProvider } from "@/providers/GeolocationProvider";

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
        chains: [filecoinCalibration],
        connectors: wagmiConnectors,
        transports: {
          [filecoinCalibration.id]: http(),
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
          <ConfigProvider>
            <ThemeProvider>
              <ConfettiProvider>
                <QueryClientProvider client={queryClient}>
                  {wagmiConfig ? (
                    <WagmiProvider config={wagmiConfig}>
                      <RainbowKitProvider
                        modalSize="compact"
                        initialChain={filecoinCalibration.id}
                      >
                        <main className="flex flex-col min-h-screen">
                          <Navbar />
                          {children}
                        </main>
                        <Footer />
                      </RainbowKitProvider>
                    </WagmiProvider>
                  ) : null}
                </QueryClientProvider>
              </ConfettiProvider>
            </ThemeProvider>
          </ConfigProvider>
        </GeolocationProvider>
      </body>
    </html>
  );
}
