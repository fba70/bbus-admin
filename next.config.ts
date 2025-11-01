import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
