"use client";

import { useIsMounted } from "@/hooks";
import { darkTheme, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useTheme } from "next-themes";
import { deserialize, serialize, WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "@/providers/session-key";
import { StorageConfigProvider } from "@/providers/storage-config";
import { WalletProvider } from "@/providers/wallet";
import { wagmiConfig } from "./wagmi";

// Module-level singletons — created once, never recreated on render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
      retry: false,
    },
  },
});

if (typeof window !== "undefined") {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "filecoin-onchain-cloud-dapp",
    serialize,
    deserialize,
  });
  persistQueryClient({
    queryClient,
    persister: localStoragePersister,
  });
}

const isDevelopment = process.env.NODE_ENV === "development";

function RainbowKitProviderWrapper({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();

  return (
    <RainbowKitProvider
      theme={mounted && resolvedTheme === "dark" ? darkTheme() : lightTheme()}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <StorageConfigProvider>
          <SessionProvider>
            <WalletProvider>
              {isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
              <RainbowKitProviderWrapper>{children}</RainbowKitProviderWrapper>
            </WalletProvider>
          </SessionProvider>
        </StorageConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

Web3Provider.displayName = "Web3Provider";
