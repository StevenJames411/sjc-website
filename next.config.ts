import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Our own blob storage — where adopted photos and uploads live. next/image refuses any
      // host that isn't listed here, so the repointed logo would 500 without this line.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // LandingSite's Cloudflare Images. Nothing we own points here any more (the logo moved to
      // our blob on 2026-08-03), but an old draft somewhere still might, and removing the pattern
      // turns a stale-but-working image into a hard error. Harmless to keep; delete once nothing
      // on any site resolves to this host.
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
