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
      '@base-ui/react',
      'cmdk',
      'react-day-picker',
      'react-hook-form',
      '@hookform/resolvers',
    ],
  },
};

export default nextConfig;
