import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ignorar warning de MSW en build
    config.resolve.alias = {
      ...config.resolve.alias,
      encoding: false,
    };
    return config;
  },
};

export default nextConfig;
