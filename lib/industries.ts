// Single source of truth for the industry verticals. Adding a field = one entry here;
// the homepage strip, the /industries hub, and the nav all read from this list, so the
// list "nests" and grows without touching layout. `status: "live"` marks proven fields.
export type Industry = {
  slug: string;
  name: string;
  status?: "live" | "next";
  blurb: string;
  href?: string; // override route (med-spa lives at /med-spa today)
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "med-spa",
    name: "Med Spa",
    status: "live",
    blurb: "Live proof — Chloe books consults while the lights are off.",
    href: "/med-spa",
  },
  // PARKED 2026-06-26 (boutique trim): the "next" verticals are off the public site until a
  // surgical campaign needs one. The pages stay on disk; uncomment to restore.
  // {
  //   slug: "roofing",
  //   name: "Roofing",
  //   status: "next",
  //   blurb: "Owner-run, lead-driven, bleeding the same leaks.",
  // },
  // {
  //   slug: "hvac",
  //   name: "HVAC",
  //   status: "next",
  //   blurb: "Same shape — every call that hits voicemail is money.",
  // },
  // {
  //   slug: "garage-doors",
  //   name: "Garage Doors",
  //   status: "next",
  //   blurb: "Fragmented, local, ripe to roll up.",
  // },
];

export const industryHref = (i: Industry) => i.href ?? `/industries/${i.slug}`;
