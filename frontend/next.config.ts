import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/contracts'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      'motion',
      'framer-motion',
    ],
  },
};

export default nextConfig;
