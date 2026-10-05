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
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline", padding: "12px 0", borderTop: "1px solid var(--e-line)" };
  const a: React.CSSProperties = { fontWeight: 700, color: "var(--e-ink-strong)", textDecoration: "underline" };
  const note: React.CSSProperties = { color: "var(--e-muted)", fontSize: 13.5 };
  // PAGES NOBODY REACHES FROM THE MENU, AND WHERE THINGS LAND (Steven, 2026-10-04): "put that on our dashboard so I
  // could take a look at it." One list, so a page he cannot click to from the site is still one click from here.
  const hidden: [string, string, string][] = [
    ["The download page a buyer sees after paying", `${origin}/book-thank-you?preview=1`, "Unlocked for you because you are signed in. Check the wording and both download buttons."],
    ["The buy page (the card form)", `${origin}/get-the-book`, "Where every Get The Book button goes."],
    ["The book page", `${origin}/attention-to-dollars`, "In the menu as The Book."],
    ["The revenue share page and its application", `${origin}/revenue-share`, "In the menu under Company."],
    ["The old waiting list address", `${origin}/waiting-list`, "Now says the book is open and sends people to the buy page."],
  ];
  const lands: [string, string, string][] = [
    ...(sheet ? [["The intake sheet", `https://docs.google.com/spreadsheets/d/${sheet}/edit`, "One tab each: New Clients, Revenue Share, Careers, Podcast Guests, Book Downloads (who bought the book)."] as [string, string, string]] : []),
    ["Book payments in Stripe", "https://dashboard.stripe.com/payments", "Every book sale, with the buyer and the amount."],
  ];
  const list = (items: [string, string, string][]) => items.map(([name, href, why]) => (
    <div key={href} style={row}><a style={a} href={href} target="_blank" rel="noopener">{name}</a><span style={note}>{why}</span></div>
  ));
  return (
    <>
      <LinksManager
        title={title}
        siteId={site?.id || SJC}
        origin={origin}
        sites={live.map((s) => ({ id: s.id, name: s.business?.name?.trim() || s.name }))}
      />
      {(!site || site.id === SJC) && (
        <div style={{ maxWidth: 1100, margin: "-40px auto 0", padding: "0 24px 80px" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px", color: "var(--e-ink-strong)" }}>Pages that are not in the menu</h2>
          {list(hidden)}
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "36px 0 10px", color: "var(--e-ink-strong)" }}>Where things land</h2>
          {list(lands)}
        </div>
      )}
    </>
  );
}
