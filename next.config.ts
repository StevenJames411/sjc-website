import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "imagedelivery.net" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/who-we-serve",
        destination: "/discover-the-lies",
        permanent: true,
      },
      {
        source: "/find-your-trap",
        destination: "/discover-the-lies",
        permanent: true,
      },
      {
        source: "/audit",
        destination: "/assessment",
        permanent: true,
      },
      {
        source: "/pro-trap",
        destination: "/master-trap",
        permanent: true,
      },
      {
        source: "/unicorn-trap",
        destination: "/rock-star-trap",
        permanent: true,
      },
      {
        source: "/grind-trap",
        destination: "/hustle-trap",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
