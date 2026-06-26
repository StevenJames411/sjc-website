// The four "tables" — the room Steven is assembling in public. These recede from the
// primary reader nav (they're partner/content audiences, not the operator's first want),
// but they surface on the homepage and under the footer "Partners" cluster. Adding a
// table = one entry here.
export type Pillar = {
  slug: string;
  name: string;
  blurb: string;
};

// PARKED 2026-06-26 (boutique trim): the four partner "tables" are off the public site — they
// were content-machine surfaces for a value-blind audience SJC no longer courts. The pages stay
// on disk; uncomment to restore the homepage "four tables" section + the footer "Partners" column.
export const PILLARS: Pillar[] = [
  // {
  //   slug: "podcast",
  //   name: "Podcast",
  //   blurb: "Operators at every stage of the journey, across every field.",
  // },
  // {
  //   slug: "board-of-directors",
  //   name: "Board of Directors",
  //   blurb: "Leaders who've already done the deal — the top tier.",
  // },
  // {
  //   slug: "tech",
  //   name: "Tech",
  //   blurb: "The technology partners who plug into the build.",
  // },
  // {
  //   slug: "raising-capital",
  //   name: "Raising Capital",
  //   blurb: "The money partners behind the re-rate.",
  // },
];

export const pillarHref = (p: Pillar) => `/${p.slug}`;
