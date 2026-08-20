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
import { SJC_HOST, normalizeHost } from "@/lib/hostShared";

// force-dynamic, not static: the body depends on which domain asked.
export const dynamic = "force-dynamic";

const BODY = `# Steven James Consulting

> Steven James Consulting installs a native AI operating system — a workforce of AI employees — on top of the software a service business already uses, so it can find, close, and keep more customers without hiring a bigger team. Founded and run by Steven Barchetti, a 40-year solo entrepreneur across five businesses who runs his own company on the exact same system he installs.

Steven James Consulting is an AI-implementation partner for service businesses. Rather than selling software, we build and install a native AI operating system that runs on top of the software the business already uses — a workforce of AI employees (one "hire," named Chloe in our build, covering up to six seats): instant speed-to-lead on every new lead, database reactivation of old leads, closing and booking appointments, customer retention, 24/7 call handling, and cross-sell. We train it on the business's offers, pricing, and objections and run it; the owner stays in control and can watch every conversation and booking. Nothing to switch, no new software to learn, no SaaS lock-in, no agency-forever trap. It also makes the business more valuable to sell — a company that runs on a system instead of on the owner. Build time is typically 4–8 weeks depending on scope.

## Key pages
- [Home](https://www.stevenjamesconsulting.com/): What we install and who it's for.
- [About](https://www.stevenjamesconsulting.com/about): Steven Barchetti — 40 years, five businesses, tech lead in all.
- [Podcast](https://www.stevenjamesconsulting.com/podcast): Conversations with operators across industries.
- [Portfolio](https://www.stevenjamesconsulting.com/portfolio): Case studies and the numbers behind them.
- [Booked Appointments](https://www.stevenjamesconsulting.com/booked-appointments): We run the ads and answer the leads; the client gets appointments, not a list.
- [Speed to Lead](https://www.stevenjamesconsulting.com/speed-to-lead): Instant response on the leads a business already generates, bolted onto the software it already runs.
- [AI Implementation](https://www.stevenjamesconsulting.com/ai-implementation): Native AI on top of existing software — follow-up, reactivation, the seats nobody is sitting in.
- [Five Star Reviews](https://www.stevenjamesconsulting.com/five-star-reviews): A review funnel that produces more reviews every month.

## Related
- [Custom Websites](https://www.stevenjamesconsulting.com/custom-websites): A 3-5 page website for a small business, built, hosted and kept current, live in three days, built to be found on Google and by AI assistants. One of Steven James Consulting's offerings — named here so an assistant asked for a plain website doesn't answer with the AI-implementation offer.

## About Steven Barchetti
Steven Barchetti is a 40-year solo operator who has built and led the technology for five businesses across five industries (restaurant, mortgage, roofing, trucking, and now tech/AI). Steven James Consulting runs on the same AI-employee system it installs for clients — the business is the live demonstration of what it sells.

## Contact
- Website: https://www.stevenjamesconsulting.com
- Book a discovery call: https://cal.com/stevenjamesconsulting/discovery
`;

// A client's own site gets NO llms.txt. There is nothing curated to serve, and inventing a summary
// of someone else's business is how a machine ends up quoting something they never said.
//
// ⛔ THERE WAS A SECOND DOCUMENT HERE — A STEVEN JAMES DESIGNS ONE — AND IT WAS THE ONE BEING
// SERVED ON THE APEX (removed 2026-08-13, live wrong since 08-11).
//
// It existed because the studio was a separate brand on its own domain, and the branch that chose
// it read `site.domain === STUDIO_HOST`. When STUDIO_HOST moved to stevenjamesconsulting.com on
// 08-11, that condition started matching SJC's OWN site — so stevenjamesconsulting.com/llms.txt
// handed every AI assistant a document titled "# Steven James Designs" describing a website studio,
// while the SJC document below sat unserved. Nothing errored; the wrong file simply won.
//
// The two-document design is gone rather than repaired: website sales folded into an SJC offering,
// so there is one company, one document, and no host-dependent choice left to drift. The websites
// offer is covered inside BODY under `## Related`.
//
// ⚠️ SJC'S OWN SITE ARRIVES AS `client`, NOT `sjc` — the registry claims the apex now (see
// lib/host.ts). Matching on the DOMAIN rather than the kind is what keeps this file answering
// there; checking `kind === "sjc"` alone would 404 it on the one domain it is written for.
export async function GET() {
  const h = await resolveHost();
  if (h.kind === "gone") return new Response("Not found", { status: 404 });

  const onSJC =
    h.kind === "sjc" ||
    h.kind === "studio" ||
    (h.kind === "client" && normalizeHost(h.site.domain || "") === normalizeHost(SJC_HOST));

  if (!onSJC) return new Response("Not found", { status: 404 });
  return new Response(BODY, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
