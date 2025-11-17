/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'sharp', 'pixelmatch']
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
}

module.exports = nextConfig