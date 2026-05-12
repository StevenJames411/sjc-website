import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stevenjamesconsulting.com"),
  title: "Steven James Consulting — AI Visibility Audit for Owner-Led Businesses",
  description:
    "Customers aren't using Google anymore. They're asking AI. Find out where you stand with a free 60-second AI visibility audit from an AI Systems Architect and Fractional CTO.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Steven James Consulting — AI Visibility Audit",
    description:
      "Has AI made your company invisible? Take the free 60-second audit and see exactly which signals you're missing.",
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
    "AI Systems Architect and Fractional CTO helping owner-led businesses become findable, credible, and converting in the AI search era.",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "20-Point AI Visibility Audit",
  serviceType: "AI Visibility Audit",
  provider: { "@type": "Organization", name: "Steven James Consulting" },
  areaServed: "United States",
  description:
    "A free 60-second audit that scores your business across 20 AI-search signals: schema, listings, reviews, content, citations, authority, speed-to-lead, follow-up, and document systems.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an AI visibility audit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A 20-point check across the signals AI search engines (ChatGPT, Perplexity, Gemini) use to decide which businesses to recommend — schema markup, listings, reviews, content structure, citations, and the operational systems that convert AI-driven traffic.",
      },
    },
    {
      "@type": "Question",
      name: "Who is the audit for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Owner-led businesses doing $1M–$5M in revenue who hit the wall where the founder is the system. If your competitors are getting recommended by AI and you're not, this is the gap to close.",
      },
    },
    {
      "@type": "Question",
      name: "How long does the audit take?",
      acceptedAnswer: { "@type": "Answer", text: "60 seconds to complete. You get your score and the missing signals immediately." },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lexend.variable}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
