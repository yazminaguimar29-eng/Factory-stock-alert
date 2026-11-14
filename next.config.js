/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Server action & API configuration
  experimental: {
    serverComponentsExternalPackages: ['googleapis']
  }
};

module.exports = nextConfig;
