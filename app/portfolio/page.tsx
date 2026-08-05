// The studio's portfolio — screenshots that OPEN the live site.
//
// ⚠️ IT WEARS THE DESIGNS SITE'S OWN CHROME, READ LIVE. The first version of this page borrowed
// the /websites sales-page header and a light theme of its own, and the result looked like a
// different company: SJC's logo and palette sitting on stevenjamesdesigns.com. So the header and
// footer are now pulled from that site's PUBLISHED home page and rendered through SitePageBody —
// the same function every other page of that site goes through. The nav stays editable in the
// builder, and this page cannot drift from the site it belongs to.
//
// ⛔ NO PRICING ON THIS PAGE, EVER. The build fee is fluid and tuned on the call against what the
// prospect was quoted elsewhere. A number published here becomes the ceiling for every deal after.
//
// ⛔ A PROSPECT-BRANDED DEMO NEVER GOES HERE. Every "Sample build" was rebranded off the real
// business it was generated from — name, phone, address, photos and site id — before it earned a
// place. A demo built for one prospect implies a relationship that doesn't exist, and the person
// it was built for can see it.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readPuckPublished } from "@/lib/puckContent";
import { findSite } from "@/lib/sites";
import { SitePageBody } from "@/lib/publicSitePage";
import { fillBusinessTokens } from "@/lib/businessTokens";
import { portfolioHtml } from "./sections";

export const dynamic = "force-dynamic";

const SITE = "steven-james-designs";
/** The chrome and the compiled stylesheet both belong to this page of that site. */
const CHROME_PAGE = "home";

export const metadata: Metadata = {
  title: "Portfolio — Steven James Designs",
  description:
    "Websites built for San Antonio businesses. Open any one of them — these are live sites, not pictures.",
};

type Block = { type?: string; props?: Record<string, unknown> };

export default async function Portfolio() {
  const home = (await readPuckPublished(CHROME_PAGE, SITE)) as { content?: Block[]; root?: unknown } | null;
  const blocks = home?.content || [];
  if (!blocks.length) notFound();

  // The design's own header and footer are the first and last sections. Taken by position rather
  // than by id so a re-import can't silently drop the chrome — if they ever stop being first and
  // last, the page renders without them and that is visible immediately, not a broken link.
  const header = blocks[0];
  const footer = blocks[blocks.length - 1];

  const body: Block = {
    type: "DesignSection",
    props: {
      id: "portfolio-body",
      html: portfolioHtml(),
      text: [],
      images: [],
      links: [],
      paddingTop: 0,
      paddingBottom: 0,
      hasForm: false,
      useRealForm: false,
      formFields: [],
      formButton: "",
    },
  };

  const site = await findSite(SITE);
  // Same shape the store's write guard expects, and the same shape every page of this site has.
  const data = fillBusinessTokens(
    { root: home?.root ?? { props: {} }, zones: {}, content: [header, body, footer] },
    site?.business ?? { name: "", phone: "", phoneDisplay: "", email: "", address: "", hours: "" },
    "https://stevenjamesdesigns.com"
  );

  return <SitePageBody data={data} siteId={SITE} page={CHROME_PAGE} />;
}
