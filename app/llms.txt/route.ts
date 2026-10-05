// Serves /llms.txt — the emerging standard (llmstxt.org) that hands any AI assistant a clean,
// curated summary + map of the site in plain markdown, so it understands who SJC is and what we do
// without wading through rendered HTML. Aligned with the site's committed metadata + JSON-LD in
// app/layout.tsx. Public-facing (AI-implementation) lane only. Goes live when the password wall
// comes off at launch.
//
// ⛔ THE "NO PRICES" RULE THAT USED TO BE HERE IS DEAD (2026-09-01), AND LEAVING IT WOULD NOW BE
// THE MISTAKE. It said a number here hands the price over before the discovery call. That was true
// when nothing published one. Since then every service page publishes a RANGE above its calendar
// and the home page publishes the build range and all three monthlies — Steven's rule is that the
// site publishes the range and the CALL sets the number.
//
// So withholding them here no longer protects anything; it just makes an assistant answer "they
// don't publish pricing" about a site that plainly does, and hands the enquiry to whoever does.
// The ranges below are the published ones and nothing more precise. → the-live-site-is-the-price
import { resolveHost } from "@/lib/host";
import { SJC_HOST, normalizeHost } from "@/lib/hostShared";

// force-dynamic, not static: the body depends on which domain asked.
export const dynamic = "force-dynamic";

const BODY = `# Steven James Consulting

> Steven James Consulting helps coaches, authors and influencers turn the attention they already have into dollars. The formula: Attention + Your Product = Dollars. We package what you know into a product, send all the attention you get from free social media to one website you own, and build the six systems that make the sale. Done for you, by Steven Barchetti and his team.

Steven James Consulting works with coaches, authors and influencers who already have people paying attention to them and something they know that is worth selling. Most of them have about three quarters of it in place, but all of it sits on free social media, which is rented land. We build the piece that is missing: one website they own, with six business systems connected behind it as one Growth Engine, and AI employees that keep it running beside their own small team. Steven Barchetti has run five businesses over forty years (a restaurant, mortgage, roofing, trucking and now technology) and built the systems in every one. The company runs on the same machine it builds for clients.

## Who it is for
- Coaches with a program that works.
- Authors whose book opens the door.
- Influencers who have the attention and want income they own.
- They already have an audience and a small team. We take 5 to 10 clients at a time.

## The six business systems
- [Premium Smart Websites](https://stevenjamesconsulting.com/premium-smart-websites): one website you own that tells your story, sells your program or book, and books the call on the page.
- [Automated Organic Content Engine](https://stevenjamesconsulting.com/automated-organic-content-engine): one recording becomes clips and episodes on every platform, all pointing back to your website.
- [Speed to Lead](https://stevenjamesconsulting.com/speed-to-lead): every comment, message and form answered in under a minute, day or night.
- [Automated Five Star Reviews](https://stevenjamesconsulting.com/automated-five-star-reviews): every client, student and reader asked for a testimonial, every time.
- [Database Reactivation](https://stevenjamesconsulting.com/database-reactivation): everyone who ever followed, downloaded or bought, reached again and turned into sales.
- [Paid Ads = Booked Appointments](https://stevenjamesconsulting.com/booked-appointments): added once the free attention is converting; what reaches you is a call on your calendar.
- [AI Implementation](https://stevenjamesconsulting.com/ai-implementation): not a seventh service. The layer that connects the other six so they work as one.

## Other pages
- [Home](https://stevenjamesconsulting.com/): Turn Your Attention Into Dollars.
- [For Coaches, Authors and Influencers](https://stevenjamesconsulting.com/for-coaches-authors-and-influencers): why what you teach runs on the same six systems.
- [Attention To Dollars](https://stevenjamesconsulting.com/attention-to-dollars): the book, a do-it-yourself build manual for the same build.
- [Funnel Hack Live](https://stevenjamesconsulting.com/funnel-hack-live): live every weekday at 11 a.m. Central.
- [Podcast](https://stevenjamesconsulting.com/podcast): conversations with coaches, authors and influencers.
- [About](https://stevenjamesconsulting.com/about): Steven Barchetti, forty years and five businesses.
- [Portfolio](https://stevenjamesconsulting.com/portfolio): live demo websites.

## What it costs
- Done for you: $30,000.00 to $50,000.00 for the build, handed over. Then $2,000.00 to $5,000.00 a month to keep it running.
- Do it yourself: the book, Attention To Dollars, $495.00, one payment. It is not open for sale yet; there is a waiting list at https://stevenjamesconsulting.com/waiting-list.

## About Steven Barchetti
Steven Barchetti has owned and run five businesses over forty years (restaurant, mortgage, roofing, trucking, and now technology) and was the person responsible for the systems in every one. Steven James Consulting is a team, with Steven personally on every account.

## Contact
- Website: https://stevenjamesconsulting.com
- Apply to work with us: https://stevenjamesconsulting.com/#apply
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
