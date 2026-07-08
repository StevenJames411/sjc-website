// Serves /llms.txt — the emerging standard (llmstxt.org) that hands any AI assistant a clean,
// curated summary + map of the site in plain markdown, so it understands who SJC is and what we do
// without wading through rendered HTML. Aligned with the site's committed metadata + JSON-LD in
// app/layout.tsx. Public-facing (AI-implementation) lane only. Goes live when the password wall
// comes off at launch.
export const dynamic = "force-static";

const BODY = `# Steven James Consulting

> Steven James Consulting installs AI employees on top of the business a service-business owner already runs — turnkey — so they get the growth and stay in control of their own system. Founded and run by Steven Barchetti, a 40-year solo entrepreneur across five businesses who runs his own company on the exact same system he installs.

Steven James Consulting is an AI-implementation partner for service businesses. Rather than selling software, we install a working AI workforce — Speed to Lead, so every lead is answered in seconds, plus AI employees covering the seats the owner wants covered — wired into the CRM, calendar, email, and pipeline the business already uses. The owner keeps control of their own system: no SaaS lock-in, no agency-forever trap. Build time is typically 4–8 weeks depending on scope.

## Key pages
- [Home](https://www.stevenjamesconsulting.com/): What we install and who it's for.
- [About](https://www.stevenjamesconsulting.com/about): Steven Barchetti — 40 years, five businesses, tech lead in all.
- [Case Study](https://www.stevenjamesconsulting.com/case-study): Proof — the AI-employee engine running in a live business.
- [FAQs](https://www.stevenjamesconsulting.com/faqs): What we install, what it costs, how long it takes.
- [Podcast](https://www.stevenjamesconsulting.com/podcast): Conversations with operators across industries.
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
