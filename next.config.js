/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.integration.app",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
