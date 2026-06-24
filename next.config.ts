import type { NextConfig } from "next";
import os from "os";

function localNetworkIPs(): string[] {
  const ips: string[] = []
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address)
    }
  }
  return ips
}

const nextConfig: NextConfig = {
  allowedDevOrigins: localNetworkIPs(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'images.meeplesbg.com',
      },
    ],
  },
};

export default nextConfig;
