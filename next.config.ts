import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
      {
        protocol: "https",
        hostname: "dcdn-us.mitiendanube.com",
      },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {},
};

export default nextConfig;
