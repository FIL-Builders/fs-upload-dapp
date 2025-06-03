// app/layout.jsx
"use client";

import "./globals.css";
import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { Navbar } from "@/components/ui/Navbar";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConfettiProvider } from "@/providers/ConfettiProvider";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [filecoinCalibration, filecoin],
  connectors: [],
  transports: {
    [filecoin.id]: http(),
    [filecoinCalibration.id]: http(),
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ConfettiProvider>
            <QueryClientProvider client={queryClient}>
              <WagmiProvider config={config}>
                <RainbowKitProvider
                  modalSize="compact"
                  initialChain={filecoinCalibration.id}
                >
                  <Navbar />
                  {children}
                </RainbowKitProvider>
              </WagmiProvider>
            </QueryClientProvider>
          </ConfettiProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
