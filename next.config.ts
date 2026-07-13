import type { NextConfig } from "next";
import os from "os";

function getLocalNetworkHosts(): string[] {
  try {
    const hosts = new Set<string>();
    for (const interfaces of Object.values(os.networkInterfaces())) {
      for (const iface of interfaces ?? []) {
        if (iface.family === "IPv4" && !iface.internal) {
          hosts.add(iface.address);
        }
      }
    }
    return [...hosts];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  allowedDevOrigins: [
    "localhost",
    "semcriterio.vercel.app",
    ...getLocalNetworkHosts(),
    ...(process.env.DEV_ALLOWED_ORIGINS?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? []),
  ],
};

export default nextConfig;
