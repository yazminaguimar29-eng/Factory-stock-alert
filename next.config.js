/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Server action & API configuration
  experimental: {
    serverComponentsExternalPackages: ['googleapis']
  }
};

module.exports = nextConfig;
