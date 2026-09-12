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
      // The six blueprint pages — agent-sjc emails links at the nested address it was told to
      // speak (/blueprints/<x>), but app/[slug] is a single dynamic segment and cannot resolve a
      // second one. Flat slugs are the real pages; these just make the brain's URL answer.
      {
        source: "/blueprints/five-systems",
        destination: "/blueprint-five-systems",
        permanent: true,
      },
      {
        source: "/blueprints/website",
        destination: "/blueprint-website",
        permanent: true,
      },
      {
        source: "/blueprints/speed",
        destination: "/blueprint-speed",
        permanent: true,
      },
      {
        source: "/blueprints/reviews",
        destination: "/blueprint-reviews",
        permanent: true,
      },
      {
        source: "/blueprints/database",
        destination: "/blueprint-database",
        permanent: true,
      },
      {
        source: "/blueprints/ads",
        destination: "/blueprint-ads",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
