import { StudioBody } from "@/lib/studioPage";
import { pageMetadata } from "@/lib/pageMeta";

export const dynamic = "force-dynamic";

// Edited at /edit/websites with no block selected (the Page Settings panel). Everything below is
// only the fallback this page shipped with, used while the panel is left empty.
//
// ⚠️ NO PRICE — in the panel or here. Price comes up on the discovery call, not before it, and
// this description is exactly what Google shows and what a texted link previews as, so a number
// in it reaches the prospect ahead of the conversation. Keep it about the outcome.
//
// ⚠️ THE og BLOCK IS LOAD-BEARING. Next.js inherits the ROOT layout's openGraph wholesale when a
// page has none, so a link texted to a groomer used to preview as "Your AI Growth Partner" — the
// AI-implementation business, not this one. A title/description alone does NOT fill og:* in;
// lib/pageMeta.ts always emits the full block, which is what keeps the two businesses separate.
// The card image comes from ./opengraph-image.tsx, so no preview image is set here.
export async function generateMetadata() {
  return pageMetadata("websites", {
    path: "/websites",
    title: "A real website for your business — live in three days | Steven James Consulting",
    description:
      "Built and live in three days. Your work, your reviews, your phone number — and a contact form that texts you the second someone fills it out. You never touch any of it.",
    ogTitle: "A real website for your business — live in three days",
    ogDescription:
      "Your work, your reviews, your phone number — and a contact form that texts you the second someone fills it out. You never touch any of it.",
  });
}

// The bottom rung of the ladder: a plain, real website for a very small business. NOT the
// AI/Chloe offer and NOT a middle tier — no CRM, no automation, no tiers, no upgrade path shown.
// Ascension to the bigger offers happens on a phone call with Steven, never on this page.
//
// Every word here lives in the BUILDER, not in this file: edit at /edit/websites (and the header
// and footer at /edit/websites-nav and /edit/websites-footer). This route just renders whatever
// is published; before anything is published it renders the same seed the builder opens to, so
// the live page and the editor can never drift apart.
// The body lives in lib/studioPage so the studio's own domain can serve the identical page at its
// root. This address stays working because links to it are already out in the world.
export default async function WebsitesPage() {
  return <StudioBody />;
}
