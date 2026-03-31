import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Force fresh build to clear stale CSS module references
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
