import { readPuckPublished } from "@/lib/puckContent";
import { NAV_DEFAULTS, FOOTER_DEFAULTS } from "@/components/puck/config";
import NavView from "@/components/NavView";
import FooterView from "@/components/FooterView";

// The header and footer for /websites ONLY — deliberately NOT the site-wide <Nav /> / <Footer />.
// The global nav carries a "DIY" link to the free Skool community that teaches people to build
// the exact thing this page sells for $795; a sales page can't hand the buyer a free way out
// three inches above the price.
//
// They render through the SAME NavView / FooterView the rest of the site uses, but read their
// own published blocks — "websites-nav" and "websites-footer" — so Steven edits them at
// /edit/websites-nav and /edit/websites-footer without touching the site-wide ones. Falls back
// to the stripped defaults below until he publishes, so it never renders blank.

const WEBSITES_NAV_FALLBACK = {
  ...NAV_DEFAULTS,
  tagline: "",
  // The ONLY link on this page's header — the phone number. No About, no Podcast, no DIY.
  links: [
    { label: "(210) 298-2343", target: "tel:+12102982343", fontSize: 15, color: "#ffffff", newTab: false },
  ],
  ctaLabel: "Get Started",
  ctaHref: "#get-started",
  ctaNewTab: false,
};

const WEBSITES_FOOTER_FALLBACK = {
  ...FOOTER_DEFAULTS,
  blurb: "",
  links: [],
  copyright: "Steven James Consulting",
};

export async function WebsitesHeader() {
  let props = WEBSITES_NAV_FALLBACK;
  try {
    const data = await readPuckPublished("websites-nav");
    const block = (data?.content || []).find((b) => b?.type === "SiteHeader");
    if (block?.props) props = { ...WEBSITES_NAV_FALLBACK, ...(block.props as typeof WEBSITES_NAV_FALLBACK) };
  } catch {
    // store unavailable -> keep the stripped defaults
  }
  return <NavView {...props} />;
}

export async function WebsitesFooter() {
  let props = WEBSITES_FOOTER_FALLBACK;
  try {
    const data = await readPuckPublished("websites-footer");
    const block = (data?.content || []).find((b) => b?.type === "SiteFooter");
    if (block?.props) props = { ...WEBSITES_FOOTER_FALLBACK, ...(block.props as typeof WEBSITES_FOOTER_FALLBACK) };
  } catch {
    // store unavailable -> keep the stripped defaults
  }
  return <FooterView {...props} />;
}
