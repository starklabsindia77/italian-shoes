
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'cdn.shopify.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',  // Allows all subdomains of Cloudinary
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
      }
    ],
  },
};

module.exports = nextConfig;
