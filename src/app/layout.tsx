import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";
import { Web3Provider } from "@/providers";
import { Footer, Navbar, WalletGuard } from "@/components/layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Filecoin Onchain Cloud Demo",
  description: "Decentralized file storage on Filecoin network",
  icons: {
    icon: [{ url: "/filecoin.svg", type: "image/svg+xml" }],
  },
  keywords: ["Filecoin", "Demo", "synapse-sdk", "pdp", "upload", "filecoin", "usdfc"],
  authors: [{ name: "FIL-Builders" }],
  robots: "index, follow",
  openGraph: {
    title: "Filecoin Onchain Cloud Demo",
    description: "Decentralized file storage on Filecoin network",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Web3Provider>
          <TooltipProvider>
            <Navbar />
            <main className="flex-1 min-h-[calc(100vh-150px)] max-w-screen-2xl mx-auto w-full">
              <WalletGuard>{children}</WalletGuard>
            </main>
            <Footer />
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
