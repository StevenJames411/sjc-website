import type { Data } from "@measured/puck";
import type { Site } from "./sitesShared";
import type { PageEntry } from "./pageRegistry";

/**
 * THE HEADER AND FOOTER A WEBSITE HAS BEFORE ANYONE BUILDS ONE.
 *
 * Steven: "I want a header and footer to be on every website by default. We don't need to add extra
 * steps." A site that exists has chrome — nobody assembles it section by section, and nobody
 * publishes it separately from the page.
 *
 * ⛔ NOT NAV_DEFAULTS / FOOTER_DEFAULTS. Those are the obvious thing to reach for and they are a
 * trap: they hardcode brandName "Steven James Consulting", the tagline "Your Native AI
 * Implementation Partner", the SJC logo image and SJC's phone number. Seeding a client site from
 * them puts STEVEN'S BRAND ON SOMEONE ELSE'S BUSINESS — the precise leak lib/publicSitePage.tsx
 * exists to prevent, and the one that already shipped once as a client thank-you page handing out
 * Steven's mobile number.
 *
 * So default chrome is GENERATED from the site's own record. Every value below traces to
 * `site.business` (lib/sitesShared: name, phone, phoneDisplay, email) or `site.name`. There is
 * deliberately no import from components/puck/config here, so the trap cannot be reintroduced by
 * autocomplete.
 *
 * ONE function, used by BOTH the public render and the editor's empty state — because the moment
 * those two have separate ideas of "default", the builder shows something the visitor never sees.
 */
export function defaultChrome(site: Site, pages: PageEntry[] = []): { nav: Data; footer: Data } {
  const b = site.business || ({} as Site["business"]);
  // `site.name` is always set at creation, so an unfilled business record still yields a real
  // header rather than an empty bar with a phone number floating in it.
  const name = (b?.name || site.name || "").trim();

  // Only pages a visitor can actually reach. Chrome documents are not pages (they would list
  // themselves), and `home` is already the destination of the brand mark.
  const links = pages
    .filter((p) => p.custom && p.slug !== "home")
    .map((p) => ({
      label: p.title,
      target: `/${p.slug}`,
      fontSize: 0,
      color: "",
      newTab: false,
      note: "",
      group: "",
    }));

  const nav: Data = {
    root: { props: {} },
    content: [
      {
        type: "SiteHeader",
        props: {
          id: "site-header-default",
          brandName: name,
          brandHref: "/",
          brandSize: 18,
          brandStyle: "",
          brandLine2: "",
          brandLine2Color: "",
          tagline: "",
          taglineColor: "",
          taglineSize: 16,
          links,
          // A phone in the header is the one thing every trade site wants, and it is the business's
          // own number or nothing — never a fallback to SJC's.
          ctaLabel: b?.phoneDisplay ? `Call ${b.phoneDisplay}` : "",
          ctaHref: b?.phone ? `tel:${b.phone}` : "",
          ctaNewTab: false,
          menuMode: "bar",
          menuPhone: b?.phone || "",
          menuPhoneDisplay: b?.phoneDisplay || "",
          // ⛔ showLogo FALSE. The logo image in NavView is SJC's own asset, hosted on SJC's blob
          // store — showing it here would brand a client's site with Steven's mark.
          showLogo: false,
          brandIcon: "",
          brandIconColor: "",
          // Blank = the site's own brand palette drives it (components/BrandStyle), rather than
          // freezing SJC navy onto every website ever created.
          background: "",
          foreground: "",
          ctaColor: "",
          bandGrid: "",
        },
      },
    ],
    zones: {},
  };

  const footer: Data = {
    root: { props: {} },
    content: [
      {
        type: "SiteFooter",
        props: {
          id: "site-footer-default",
          blurb: "",
          links,
          groups: [],
          phone: b?.phone || "",
          phoneDisplay: b?.phoneDisplay || "",
          email: b?.email || "",
          // ⛔ NO SJC LEGAL URLS AND NO SJC COPYRIGHT LINE. FOOTER_DEFAULTS carries both, and a
          // client's footer claiming "ARV Venture Group LLC Parent Company" is a false statement
          // about who owns their business.
          privacyUrl: "",
          tosUrl: "",
          copyright: name,
          background: "",
          foreground: "",
          brandName: name,
          showLogo: false,
        },
      },
    ],
    zones: {},
  };

  return { nav, footer };
}
