import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ipfs.io" },
      { protocol: "https", hostname: "*.w3s.link" },
      { protocol: "https", hostname: "dweb.link" },
      { protocol: "https", hostname: "*.ipfs.dweb.link" },
    ],
  },
  turbopack: {},
};

export default nextConfig;
