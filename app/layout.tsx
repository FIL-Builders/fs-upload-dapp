// app/layout.jsx
"use client";

import "./globals.css";
import { WagmiProvider, serialize, deserialize } from "wagmi";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import "@rainbow-me/rainbowkit/styles.css";
import * as React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConfettiProvider } from "@/providers/ConfettiProvider";
import { ConfigProvider } from "@/providers/ConfigProvider";
import Footer from "@/components/ui/Footer";
import { GeolocationProvider } from "@/providers/GeolocationProvider";
import { config } from "@/services/wagmi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      networkMode: "offlineFirst",
      retry: false,
    },
  },
});

const localStoragePersister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : null,
  key: "filecoin-onchain-cloud-dapp-cache",
  serialize,
  deserialize,
});
persistQueryClient({
  queryClient: queryClient,
  persister: localStoragePersister,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
                  <WagmiProvider config={config}>
                    <RainbowKitProvider modalSize="compact">
                      <main className="flex flex-col min-h-screen">
                        <Navbar />
                        {children}
                      </main>
                      <Footer />
                    </RainbowKitProvider>
                  </WagmiProvider>
                </QueryClientProvider>
              </ConfettiProvider>
            </ThemeProvider>
          </ConfigProvider>
        </GeolocationProvider>
      </body>
    </html>
  );
}
