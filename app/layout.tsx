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
  title: "Steven James Consulting — The Org Chart Your Business Should Already Have",
  description:
    "You're wearing every hat in the company. We install the full org chart — AI employees in every seat, cloned from your best talent — so your business runs without you.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Steven James Consulting — Build the Org Chart That Runs Without You",
    description:
      "You're wearing every hat. We install the org chart your business should already have — every seat filled, cloned from your best talent, running without you.",
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
    "Systems engineer and fractional CTO who installs AI employee org charts for solo entrepreneurs trapped in their own business. 40 years of founder experience across 5 industries.",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Employee Operating System Installation",
  serviceType: "AI Employee Operating System",
  provider: { "@type": "Organization", name: "Steven James Consulting" },
  areaServed: "United States",
  description:
    "Custom AI employee installation — 5-6 AI employees covering your org chart, cloned from the owner's actual talent. Scope-dependent pricing discussed on discovery call. 4-8 week build.",
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
        text: "An AI employee org chart — 5-6 AI employees covering the seats that are either empty or sitting on the owner's plate. 2-3 superhuman seats cloned from your actual talent, plus utility seats for scheduling, follow-up, and admin. Wired into your CRM, calendar, email, and pipeline.",
      },
    },
    {
      "@type": "Question",
      name: "What does this cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It depends on scope — the number of seats, the complexity of your systems, and how much owner talent needs to be extracted. It's a fraction of what you'd pay to hire humans for the same roles. No SaaS lock-in. No agency-forever traps.",
      },
    },
    {
      "@type": "Question",
      name: "How long does the install take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "4-8 weeks depending on scope. Every week you're still wearing the hats is a week the business depends on you to function.",
      },
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
