import type { Metadata } from "next";
import {
  Lexend, Inter, Poppins, Montserrat, Merriweather, Playfair_Display, Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";
import EditLink from "@/components/edit/EditLink";
import BrandStyle from "@/components/BrandStyle";
import { readBrand } from "@/lib/brand";
import { SITE_DEFAULTS, SITE_NAME } from "@/lib/pageMeta";
import { resolveHost } from "@/lib/host";
import { SJC } from "@/lib/siteKeys";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-lexend",
  display: "swap",
});

// The curated brand fonts. next/font is build-time, so the set is fixed on purpose —
// arbitrary runtime font loading isn't worth the layout shift. All are registered; the
// published brand decides which one --font-sans actually points at (components/BrandStyle).
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-montserrat", display: "swap" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-merriweather", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-playfair", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-source-sans", display: "swap" });
// Added for bought designs, which routinely pair a display face with a plain body face.
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

const FONT_VARS = [lexend, inter, poppins, montserrat, merriweather, playfair, sourceSans, spaceGrotesk]
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
      </body>
    </html>
  );
}
