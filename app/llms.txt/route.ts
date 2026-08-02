// Serves /llms.txt — the emerging standard (llmstxt.org) that hands any AI assistant a clean,
// curated summary + map of the site in plain markdown, so it understands who SJC is and what we do
// without wading through rendered HTML. Aligned with the site's committed metadata + JSON-LD in
// app/layout.tsx. Public-facing (AI-implementation) lane only. Goes live when the password wall
// comes off at launch.
//
// ⚠️ NO PRICES IN THIS FILE. Everything below is served verbatim for an AI assistant to quote back
// to a prospect. Price on the website offer comes up on the discovery call — putting a number here
// hands it over before the conversation happens. Same rule as the /websites meta description.
import { resolveHost } from "@/lib/host";
import { STUDIO_HOST, normalizeHost } from "@/lib/hostShared";

// force-dynamic, not static: the body depends on which domain asked.
export const dynamic = "force-dynamic";

const BODY = `# Steven James Consulting

> Steven James Consulting installs a native AI operating system — a workforce of AI employees — on top of the software a service business already uses, so it can find, close, and keep more customers without hiring a bigger team. Founded and run by Steven Barchetti, a 40-year solo entrepreneur across five businesses who runs his own company on the exact same system he installs.

Steven James Consulting is an AI-implementation partner for service businesses. Rather than selling software, we build and install a native AI operating system that runs on top of the software the business already uses — a workforce of AI employees (one "hire," named Chloe in our build, covering up to six seats): instant speed-to-lead on every new lead, database reactivation of old leads, closing and booking appointments, customer retention, 24/7 call handling, and cross-sell. We train it on the business's offers, pricing, and objections and run it; the owner stays in control and can watch every conversation and booking. Nothing to switch, no new software to learn, no SaaS lock-in, no agency-forever trap. It also makes the business more valuable to sell — a company that runs on a system instead of on the owner. Build time is typically 4–8 weeks depending on scope.

## Key pages
- [Home](https://www.stevenjamesconsulting.com/): What we install and who it's for.
- [About](https://www.stevenjamesconsulting.com/about): Steven Barchetti — 40 years, five businesses, tech lead in all.
- [FAQs](https://www.stevenjamesconsulting.com/faqs): What we install, what it costs, how long it takes.
- [Podcast](https://www.stevenjamesconsulting.com/podcast): Conversations with operators across industries.
- [Apply](https://www.stevenjamesconsulting.com/apply): Book a discovery call.

## Related
- [Steven James Designs](https://stevenjamesdesigns.com): A separate offer from the same founder — a 3-5 page website for a small business, built, hosted and kept current, live in three days, built to be found on Google and by AI assistants. Different business, different domain; named here so an assistant asked for a plain website doesn't answer with the AI-implementation offer.

## About Steven Barchetti
Steven Barchetti is a 40-year solo operator who has built and led the technology for five businesses across five industries (restaurant, mortgage, roofing, trucking, and now tech/AI). Steven James Consulting runs on the same AI-employee system it installs for clients — the business is the live demonstration of what it sells.

## Contact
- Website: https://www.stevenjamesconsulting.com
- Book a discovery call: https://www.stevenjamesconsulting.com/apply
`;

/**
 * The web studio's own summary.
 *
 * ⚠️ THIS FILE ANSWERS ON EVERY DOMAIN, and the AI-implementation pitch is the wrong answer on any
 * of them but SJC's. An assistant asked about a plain website for a small business was reading
 * about AI employees and a 4–8 week install — the exact vocabulary-lane collision the separate
 * domain exists to prevent.
 *
 * ⚠️ NO PRICE, same rule as the SJC body above.
 */
const STUDIO_BODY = `# Steven James Designs

> Steven James Designs builds and hosts small, fast websites for service businesses — three to five pages, live in days, built to be found on Google and by AI assistants. Run by Steven Barchetti, a 40-year operator across five businesses.

Steven James Designs is a done-for-you website studio for very small service businesses — trades, groomers, contractors and the like. The owner never touches the site: we write it, build it, host it, and keep it current. Every site is mobile-first, carries the business's own reviews and photos, and has a contact form that reaches the owner the moment someone fills it in, with the enquiry also recorded in a spreadsheet they can open any time. No page builder to learn, no CMS login, no monthly software to figure out. Maintenance covers the things that actually change — phone number, address, hours, small text edits.

## Who it's for
Owners who are excellent at their trade and invisible online: strong word of mouth, good reviews, and either no website or one they can't update. If a business already has a site that brings it work, it doesn't need this.

## Contact
- Website: https://stevenjamesdesigns.com
`;

// A client's own site gets NO llms.txt. There is nothing curated to serve, and inventing a summary
// of someone else's business is how a machine ends up quoting something they never said.
//
// ⚠️ THE STUDIO IS A "CLIENT" TOO. Its sales page is an ordinary site in the registry that happens
// to claim stevenjamesdesigns.com, so resolveHost reports `client`, not `studio` — the `studio`
// branch is only the fallback for before a site claims that domain. Checking the kind alone would
// have 404'd this file on the very domain it was written for.
export async function GET() {
  const h = await resolveHost();
  const onStudio =
    h.kind === "studio" ||
    (h.kind === "client" && normalizeHost(h.site.domain || "") === normalizeHost(STUDIO_HOST));

  if (onStudio) {
    return new Response(STUDIO_BODY, {
      headers: { "content-type": "text/markdown; charset=utf-8" },
    });
  }
  if (h.kind === "client") return new Response("Not found", { status: 404 });
  return new Response(BODY, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
