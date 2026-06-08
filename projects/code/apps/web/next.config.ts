import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@psiclinica/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
