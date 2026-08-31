import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import EditLink from "@/components/edit/EditLink";
import HashAnchor from "@/components/HashAnchor";
import BrandStyle from "@/components/BrandStyle";
import { readBrand } from "@/lib/brand";
import { SITE_DEFAULTS, SITE_NAME } from "@/lib/pageMeta";
import { resolveHost } from "@/lib/host";
import { SJC } from "@/lib/siteKeys";

// Self-hosted from app/fonts/ (latin subset woff2, fetched from Google Fonts) instead of
// next/font/google, which downloads from Google at BUILD time and intermittently fails with
// "Module not found: .../internal/font/google/font" — self-hosting removes the network dependency.
const lexend = localFont({
  src: [
    { path: "./fonts/lexend-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/lexend-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/lexend-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/lexend-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/lexend-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/lexend-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-lexend",
  display: "swap",
  preload: false,
});

// The curated brand fonts. next/font is build-time, so the set is fixed on purpose —
// arbitrary runtime font loading isn't worth the layout shift. All are registered; the
// published brand decides which one --font-sans actually points at (components/BrandStyle).
const inter = localFont({
  src: [
    { path: "./fonts/inter-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/inter-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  preload: false,
});
const montserrat = localFont({
  src: [
    { path: "./fonts/montserrat-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/montserrat-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/montserrat-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/montserrat-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/montserrat-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/montserrat-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const merriweather = localFont({
  src: [
    { path: "./fonts/merriweather-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/merriweather-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/merriweather-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
});
const playfair = localFont({
  src: [
    { path: "./fonts/playfair-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/playfair-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/playfair-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/playfair-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/playfair-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});
const sourceSans = localFont({
  src: [
    { path: "./fonts/source-sans-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/source-sans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/source-sans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/source-sans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/source-sans-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/source-sans-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-source-sans",
  display: "swap",
  preload: false,
});
// Added for bought designs, which routinely pair a display face with a plain body face.
const spaceGrotesk = localFont({
  src: [
    { path: "./fonts/space-grotesk-300.woff2", weight: "300", style: "normal" },
    { path: "./fonts/space-grotesk-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/space-grotesk-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/space-grotesk-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/space-grotesk-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

// ⭐ THE PILL AND THE SECTION LABEL FONT — chosen for ONE letter. Steven, on "YOUR AI EMPLOYEE":
// *"the I could also pass for a capital letter L."* Space Grotesk, Inter, Lexend, Montserrat and
// Source Sans all draw the capital I as a bare vertical post, so "AI" reads as "AL" at a glance.
// Playfair fixes the letter but was rejected on sight at 11px: *"it's hard to read the words,
// so I don't want to go that direction."* IBM Plex Sans is the resolution — a plain modern sans
// that is readable small AND puts crossbars top and bottom on the capital I.
//
// ⚠️ ONE FILE, WEIGHT RANGE "400 700" — this is a VARIABLE font. Google's css2 endpoint hands back
// the SAME woff2 for every weight you ask for (all four downloads were byte-identical by md5).
// Listing it four times would ship the same 40KB four times over.
const ibmPlex = localFont({
  src: [{ path: "./fonts/ibm-plex-sans.woff2", weight: "400 700", style: "normal" }],
  variable: "--font-ibm-plex",
  display: "swap",
  preload: true,
  // ⛔ THE SITE PRELOADED THE WRONG FONT. This is worth fixing on its own merits; it did NOT
  // fix the #anchor bug, which is corrected in components/HashAnchor.tsx and still unexplained.
  //
  // Every character on this site is IBM Plex. The page was preloading five weights of Space
  // Grotesk, which nothing draws in any more, and never preloading this. With `display: swap` the
  // text drew in the system fallback, the browser jumped to the `#section` using THOSE line
  // heights, then the real font arrived and re-flowed a 9,600px page. The anchor moved 566px out
  // from under the landing and the scroll did not follow.
  //
  // ⚠️ THE TELL WAS THAT 566 NEVER VARIED — warm, cold, clicked, typed, fresh tab, cache-busted.
  // A race varies; a deterministic reflow does not. Three hours went into images, the calendar and
  // layout shift because that constancy was not taken as the clue it was.
  //
  // ⛔ SO: PRELOAD THE FONT THE SITE ACTUALLY USES, AND ONLY THAT ONE. Every other face here ships
  // `preload: false`. If the site's typeface changes again, move the preload with it — a preload
  // pointing at the old font is worse than none, because it spends the connection on bytes nothing
  // renders while the real font waits.
  // Every character on this site is IBM Plex. On a cold load the text drew in the system
  // font, the browser jumped to the #anchor using THOSE line heights, then the real font
  // arrived and every line re-flowed — the page grew 566px above the target and the
  // scroll stayed put. Exactly 566 on every load, because it is deterministic, not timing.
  // `adjustFontFallback` scales the fallback so the two layouts are the same height.
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

const FONT_VARS = [lexend, inter, poppins, montserrat, merriweather, playfair, sourceSans, spaceGrotesk, ibmPlex]
  .map((f) => f.variable).join(" ");

// The site-wide safety net. Every real page now builds its own metadata from its Page Settings
// (lib/pageMeta.ts), so this is what's left over for anything that doesn't — and the values come
// from the SAME constants those fallbacks use, so the two can't drift into disagreeing.
//
// ⚠️ This block is INHERITED by any route that declares none — that is how a texted /websites
// link used to preview as "Your AI Growth Partner." Inheriting is only ever correct for an SJC
// page; a page built for a client must emit its own (see app/[slug]/page.tsx).
// The card image comes from app/opengraph-image.tsx; `images` stays unset so it isn't overridden,
// and so each segment's own opengraph-image.tsx can take over.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.stevenjamesconsulting.com"),
  title: SITE_DEFAULTS.title,
  description: SITE_DEFAULTS.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_DEFAULTS.ogTitle,
    description: SITE_DEFAULTS.ogDescription,
    url: "https://www.stevenjamesconsulting.com",
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULTS.ogTitle,
    description: SITE_DEFAULTS.twitterDescription,
  },
  robots: { index: true, follow: true },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Steven James Consulting",
  legalName: "ARV Venture Group LLC",
  url: "https://www.stevenjamesconsulting.com",
  logo: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/uploads/1785815543979-logo.png",
  email: "support@stevenjamesconsulting.com",
  telephone: "+1-210-851-4906",
  founder: { "@type": "Person", name: "Steven Barchetti" },
  description:
    "Steven James Consulting installs a native AI operating system — a workforce of AI employees — on top of the software a service business already uses, so it can find, close, and keep more customers without hiring a bigger team. Founded by Steven Barchetti, a 40-year solo entrepreneur across five businesses who runs his own company on the same system.",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Employee Operating System Installation",
  serviceType: "AI Employee Operating System",
  provider: { "@type": "Organization", name: "Steven James Consulting" },
  areaServed: "United States",
  description:
    "A native AI operating system installed on top of your existing software — one AI hire covering up to six seats: instant speed-to-lead, database reactivation, closing and booking, 24/7 call handling, customer retention, and cross-sell. Built and trained on your business and run for you; you stay in control. Typically a 4-8 week build, scope-based pricing discussed on the discovery call.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What exactly do you install?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A native AI operating system that runs on top of the software you already use. It's a workforce of AI employees — one hire covering up to six seats: instant speed-to-lead, database reactivation of your old leads, closing and booking, customer retention, 24/7 call handling, and cross-sell. We build and train it on your business and run it; you keep full control and can watch every conversation and booking.",
      },
    },
    {
      "@type": "Question",
      name: "What does this cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on scope — how many seats you want covered and the complexity of your systems. It's a fraction of what the same roles would cost you in salaries, with no SaaS lock-in and no agency-forever trap. The exact number is the easy conversation we have on the discovery call.",
      },
    },
    {
      "@type": "Question",
      name: "How long does the install take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Typically 4-8 weeks depending on scope. We build on top of your existing software, so nothing you run today gets ripped out — it gets an upgrade.",
      },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // ⚠️ SJC'S IDENTITY IS SCOPED TO SJC'S OWN DOMAIN.
  //
  // These three blocks used to render on EVERY route unconditionally, which meant a groomer's
  // website told Google it was Steven James Consulting — ARV Venture Group LLC, Steven Barchetti,
  // SJC's phone number and SJC's logo, on her page, under her business name. Her own LocalBusiness
  // markup was competing with a company she's never heard of.
  //
  // The metadata warning higher up this file records the same failure for og: tags. The JSON-LD
  // was missed at the time because it lives in the body of the component rather than in the
  // exported metadata, and nothing about it looked route-specific.
  //
  // BrandStyle deliberately stays unconditional: app/globals.css already defines every
  // --color-sjc-* default, BrandStyle emits nothing at all when the brand is unchanged, and
  // SitePageBody's per-site brand comes later in document order and wins. Scoping it too would be
  // churn on a path that already behaves.
  const h = await resolveHost();
  const isSjc = h.kind === "sjc";
  const brand = await readBrand(true, SJC);

  return (
    <html lang="en" className={FONT_VARS}>
      <head>
        {isSjc ? (
          <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
          </>
        ) : null}
        <BrandStyle brand={brand} />
      </head>
      <body>
        {children}
        <EditLink />
        <HashAnchor />
      </body>
    </html>
  );
}
