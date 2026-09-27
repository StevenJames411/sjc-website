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
    // ⛔ SJC'S HOST ONLY. A redirect here answers on EVERY hostname this deployment serves, so an
    // unguarded /live would steal that address from every customer site too.
    const sjcHost = [{ type: "host" as const, value: "(www\\.)?stevenjamesconsulting\\.com" }];
    const tiger =
      "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/sites/sjc-website/uploads/1788577050534-favicon-tiger-512-YVmB3SnJtByxa60gm1a5XiJ6UFuCPW.png";
    return [
      // /live was the first address of the show page (built 09-26, said on camera and in the
      // bios), retired for the builder page /funnel-hack-live with no redirect — so it 404'd.
      // Temporary on purpose: /live may become its own page again, and a 308 is cached forever.
      { source: "/live", destination: "/funnel-hack-live", permanent: false, has: sjcHost },
      // Crawlers, readers and the 404 page ask for these fixed addresses; the tab icon itself is
      // the tiger declared in <head> from the site record. Same picture, so nothing 404s.
      { source: "/favicon.ico", destination: tiger, permanent: false, has: sjcHost },
      { source: "/icon.png", destination: tiger, permanent: false, has: sjcHost },
      { source: "/apple-touch-icon.png", destination: tiger, permanent: false, has: sjcHost },
      { source: "/apple-touch-icon-precomposed.png", destination: tiger, permanent: false, has: sjcHost },
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
