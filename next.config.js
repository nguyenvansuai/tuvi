/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['lunar-javascript'],
  // Build gọn cho Docker (chỉ copy .next/standalone + static)
  output: 'standalone',
  poweredByHeader: false,
};

module.exports = nextConfig;
