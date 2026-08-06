import { readPuckPublished } from "@/lib/puckContent";
import { resolveHost } from "@/lib/host";
import { STUDIO_HOST } from "@/lib/hostShared";
import { NAV_DEFAULTS, FOOTER_DEFAULTS } from "@/components/puck/config";
import NavView from "@/components/NavView";
import FooterView from "@/components/FooterView";
import { SJC } from "@/lib/siteKeys";

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
  // Clicking the logo keeps him on THIS offer — not over on the AI-implementation site.
  brandHref: "/websites",
  tagline: "",
  // The ONLY link on this page's header — the phone number. No About, no Podcast, no DIY.
  links: [
    { label: "(210) 851-4906", target: "tel:+12108514906", fontSize: 15, color: "#ffffff", newTab: false },
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

// ── THE TWO LINKS CANNOT BE ONE STORED VALUE ──────────────────────────────────────────────────
// This nav is published once and rendered on BOTH addresses the studio answers to, and the same
// path means different things on each:
//
//   stevenjamesdesigns.com/       the studio's front door
//   stevenjamesconsulting.com/    the AI-implementation site — the one place this nav exists to
//                                 keep a website buyer away from
//
// So a stored `brandHref` is wrong on one domain no matter which value is saved. `/websites` sent
// people off the studio's own domain onto a consulting URL; `/` would drop them on the AI site.
// The destination is derived per request instead. Everything else — the wording, the links, the
// colours, the CTA label — still comes from the builder, so Steven edits it without a deploy.
//
// `ctaHref` has the same problem for a second reason: it was a bare `#get-started`, which is a
// no-op on any page that doesn't contain that anchor. On /portfolio the button did nothing.
function studioChromeLinks(onStudioDomain: boolean) {
  const home = onStudioDomain ? "/" : "/websites";
  // Absolute on purpose. A bare "#get-started" only works on a page that already contains the
  // anchor, so it silently did nothing on /portfolio.
  return { brandHref: home, ctaHref: home === "/" ? "/#get-started" : `${home}#get-started` };
}

export async function WebsitesHeader() {
  let props = WEBSITES_NAV_FALLBACK;
  try {
    const data = await readPuckPublished("websites-nav", SJC);
    const block = (data?.content || []).find((b) => b?.type === "SiteHeader");
    if (block?.props) props = { ...WEBSITES_NAV_FALLBACK, ...(block.props as typeof WEBSITES_NAV_FALLBACK) };
  } catch {
    // store unavailable -> keep the stripped defaults
  }

  // Derived last so it wins over whatever is stored — see the note above.
  let onStudioDomain = false;
  try {
    const h = await resolveHost();
    onStudioDomain = h.kind === "studio" || (h.kind === "client" && h.site?.domain === STUDIO_HOST);
  } catch {
    // host unresolvable -> behave exactly as before, pointing at /websites
  }

  return <NavView {...props} {...studioChromeLinks(onStudioDomain)} />;
}

export async function WebsitesFooter() {
  let props = WEBSITES_FOOTER_FALLBACK;
  try {
    const data = await readPuckPublished("websites-footer", SJC);
    const block = (data?.content || []).find((b) => b?.type === "SiteFooter");
    if (block?.props) props = { ...WEBSITES_FOOTER_FALLBACK, ...(block.props as typeof WEBSITES_FOOTER_FALLBACK) };
  } catch {
    // store unavailable -> keep the stripped defaults
  }
  return <FooterView {...props} />;
}
