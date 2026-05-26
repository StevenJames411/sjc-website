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
    "You're wearing every hat in the company. We install the full org chart — AI employees in every seat — so your business runs without you. Built by a founder who's been in the trap for 40 years.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Steven James Consulting — Build the Org Chart That Runs Without You",
    description:
      "You're wearing every hat. We install AI employees in every seat so your business runs without you.",
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
    "Systems engineer and fractional CTO who installs AI employee org charts for solo entrepreneurs trapped in their own business.",
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "AI Employee Org Chart Installation",
  serviceType: "AI Implementation Consulting",
  provider: { "@type": "Organization", name: "Steven James Consulting" },
  areaServed: "United States",
  description:
    "We audit your business seat by seat, then install AI employees trained on your voice and process into every role — so your business runs without you.",
  offers: { "@type": "Offer", price: "40000", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is an AI employee org chart?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The twelve roles every business needs to run without the owner — from executive assistant to marketing to bookkeeping — filled by AI employees instead of human hires. Same org chart, same accountability, a fraction of the cost.",
      },
    },
    {
      "@type": "Question",
      name: "Who is this for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Solo entrepreneurs and small teams doing between one and two million in revenue who are stuck wearing every hat in the company. If your business can't function without you showing up every day, this is the fix.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from buying ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ChatGPT is a chat window. We install an operating system — position contracts per role, monitoring, repair routines, and full integration into your existing tools. The DIY path is real, but it's hat number thirteen.",
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
