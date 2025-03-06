
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',  // Allows all subdomains of Cloudinary
      },
    ],
  },
};

module.exports = nextConfig;
