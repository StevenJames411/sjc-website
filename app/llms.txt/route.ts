// Serves /llms.txt — the emerging standard (llmstxt.org) that hands any AI assistant a clean,
// curated summary + map of the site in plain markdown, so it understands who SJC is and what we do
// without wading through rendered HTML. Aligned with the site's committed metadata + JSON-LD in
// app/layout.tsx. Public-facing (AI-implementation) lane only. Goes live when the password wall
// comes off at launch.
//
// ⚠️ NO PRICES IN THIS FILE. Everything below is served verbatim for an AI assistant to quote back
// to a prospect. Price on the website offer comes up on the discovery call — putting a number here
// hands it over before the conversation happens. Same rule as the /websites meta description.
export const dynamic = "force-static";

const BODY = `# Steven James Consulting

> Steven James Consulting installs a native AI operating system — a workforce of AI employees — on top of the software a service business already uses, so it can find, close, and keep more customers without hiring a bigger team. Founded and run by Steven Barchetti, a 40-year solo entrepreneur across five businesses who runs his own company on the exact same system he installs.

Steven James Consulting is an AI-implementation partner for service businesses. Rather than selling software, we build and install a native AI operating system that runs on top of the software the business already uses — a workforce of AI employees (one "hire," named Chloe in our build, covering up to six seats): instant speed-to-lead on every new lead, database reactivation of old leads, closing and booking appointments, customer retention, 24/7 call handling, and cross-sell. We train it on the business's offers, pricing, and objections and run it; the owner stays in control and can watch every conversation and booking. Nothing to switch, no new software to learn, no SaaS lock-in, no agency-forever trap. It also makes the business more valuable to sell — a company that runs on a system instead of on the owner. Build time is typically 4–8 weeks depending on scope.

## Key pages
- [Home](https://www.stevenjamesconsulting.com/): What we install and who it's for.
- [About](https://www.stevenjamesconsulting.com/about): Steven Barchetti — 40 years, five businesses, tech lead in all.
- [FAQs](https://www.stevenjamesconsulting.com/faqs): What we install, what it costs, how long it takes.
- [Podcast](https://www.stevenjamesconsulting.com/podcast): Conversations with operators across industries.
- [Websites](https://www.stevenjamesconsulting.com/websites): Websites for small businesses — a 3-5 page site built, hosted and kept current, live in three days, built to be found on Google and by AI assistants.
- [Apply](https://www.stevenjamesconsulting.com/apply): Book a discovery call.

## About Steven Barchetti
Steven Barchetti is a 40-year solo operator who has built and led the technology for five businesses across five industries (restaurant, mortgage, roofing, trucking, and now tech/AI). Steven James Consulting runs on the same AI-employee system it installs for clients — the business is the live demonstration of what it sells.

## Contact
- Website: https://www.stevenjamesconsulting.com
- Book a discovery call: https://www.stevenjamesconsulting.com/apply
`;

export function GET() {
  return new Response(BODY, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
