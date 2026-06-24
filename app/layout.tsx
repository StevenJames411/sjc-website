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
  title: "Steven James Consulting — Your AI Growth Partner",
  description:
    "For the solo entrepreneur who runs his own shop: I install AI employees on top of the business you already built — Speed to Lead plus a dynamic AI workforce, turnkey. You get the growth and stay in control of your own system.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Steven James Consulting — Your AI Growth Partner",
    description:
      "We install Speed to Lead and a dynamic AI workforce on top of what you already run — turnkey. You get the growth and stay in command of your own system.",
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
    "A 40-year solo entrepreneur across five businesses who installs AI employees — Speed to Lead plus a dynamic AI workforce — on top of the business a solo entrepreneur already runs, turnkey, so he gets the growth and stays in control of his own system. Runs his own company on the same system.",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Employee Operating System Installation",
  serviceType: "AI Employee Operating System",
  provider: { "@type": "Organization", name: "Steven James Consulting" },
  areaServed: "United States",
  description:
    "Speed to Lead plus a dynamic AI workforce installed turnkey on top of your existing systems. Scope-dependent pricing discussed on the call. 4-8 week build — you get the growth and stay in control of your own system.",
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
        text: "Two things: Speed to Lead, so every lead gets answered in seconds, and a dynamic AI workforce of 5-6 AI employees covering the seats you want covered. Wired into your existing CRM, calendar, email, and pipeline — installed on top of what you already run, and you keep control.",
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
        text: "4-8 weeks depending on scope. We build on top of your existing systems, so nothing you run today gets ripped out — it gets faster.",
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
