import type { Metadata } from "next";
import {
  Lexend, Inter, Poppins, Montserrat, Merriweather, Playfair_Display, Source_Sans_3,
} from "next/font/google";
import "./globals.css";
import EditLink from "@/components/edit/EditLink";
import BrandStyle from "@/components/BrandStyle";
import { readBrand } from "@/lib/brand";

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

const FONT_VARS = [lexend, inter, poppins, montserrat, merriweather, playfair, sourceSans]
  .map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stevenjamesconsulting.com"),
  title: "Steven James Consulting — Your AI Growth Partner",
  description:
    "We install a native AI operating system on top of the software you already run — AI employees that answer every lead in seconds, work your old leads, close and book appointments, cover the phones 24/7, and keep customers coming back. Nothing to switch, nothing new to learn. You get the growth and stay in control of your own system.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Steven James Consulting — Your AI Growth Partner",
    description:
      "A native AI operating system installed on top of what you already run — AI employees that find, close, and keep customers, turnkey. You get the growth and stay in command of your own system.",
    url: "https://www.stevenjamesconsulting.com",
    siteName: "Steven James Consulting",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Steven James Consulting",
  legalName: "ARV Venture Group LLC",
  url: "https://www.stevenjamesconsulting.com",
  logo: "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public",
  email: "support@stevenjamesconsulting.com",
  telephone: "+1-210-298-2343",
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
  // Published brand only — a draft must never leak onto the live site.
  const brand = await readBrand(true);
  return (
    <html lang="en" className={FONT_VARS}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <BrandStyle brand={brand} />
      </head>
      <body>
        {children}
        <EditLink />
      </body>
    </html>
  );
}
