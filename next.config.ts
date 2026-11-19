import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/customer',
        destination: '/?table=12',
      },
      {
        source: '/takeaway',
        destination: '/?view=takeaway',
      },
      {
        source: '/kitchen',
        destination: '/',
      },
      {
        source: '/waitstaff',
        destination: '/',
      },
      {
        source: '/staff',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
