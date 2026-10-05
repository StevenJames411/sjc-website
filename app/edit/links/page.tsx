// Smart Links — the short, trackable links a website hands out (/go/<name>), per site.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way /edit/forms
// does. "links" is in RESERVED_SITE_IDS for that reason.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
import { readSites } from "@/lib/sites";
import { publicBaseFor, SJC_HOST } from "@/lib/hostShared";
import { navLabel } from "@/lib/editNav";
import { SJC } from "@/lib/siteKeys";
import LinksManager from "@/components/edit/LinksManager";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("links") };
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const [{ site: wanted }, sites, title] = await Promise.all([searchParams, readSites(), navLabel("links")]);
  const live = sites.filter((s) => s.kind !== "template");
  const site = live.find((s) => s.id === wanted) || live.find((s) => s.id === SJC) || live[0];
  const origin = !site || site.id === SJC ? `https://${SJC_HOST}` : publicBaseFor(site).origin;
  const sheet = (process.env.INTAKE_SHEET_ID || "").trim();
  // PAGES NOBODY REACHES FROM THE MENU, AND WHERE THINGS LAND (Steven, 2026-10-04): "put that on our dashboard so I
  // could take a look at it." One list, so a page he cannot click to from the site is still one click from here.
  const hidden: [string, string, string][] = [
    ["The download page a buyer sees after paying", `${origin}/book-thank-you?preview=1`, "Unlocked for you because you are signed in. Check the wording and both download buttons."],
    ["The buy page (the card form)", `${origin}/get-the-book`, "Where every Get The Book button goes."],
    ["The old waiting list address", `${origin}/waiting-list`, "Now says the book is open and sends people to the buy page."],
  ];
  const lands: [string, string, string][] = [
    ...(sheet ? [["The intake sheet", `https://docs.google.com/spreadsheets/d/${sheet}/edit`, "One tab each: New Clients, Revenue Share, Careers, Podcast Guests, Book Downloads (who bought the book)."] as [string, string, string]] : []),
    ["Book payments in Stripe", "https://dashboard.stripe.com/payments", "Every book sale, with the buyer and the amount."],
  ];
  const extra = !site || site.id === SJC ? [{ name: "Pages that are not in the menu", items: hidden }, { name: "Where things land", items: lands }] : [];
  return (
    <LinksManager
      title={title}
      siteId={site?.id || SJC}
      origin={origin}
      sites={live.map((s) => ({ id: s.id, name: s.business?.name?.trim() || s.name }))}
      extra={extra}
    />
  );
}
