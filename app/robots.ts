import type { MetadataRoute } from "next";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { SJC_HOST } from "@/lib/hostShared";

// Serves /robots.txt. We WANT to be read and cited by AI assistants (ChatGPT, Gemini, Perplexity,
// Claude, etc.), so we explicitly welcome their crawlers instead of the accidental blocking most
// sites do. `*` already allows everyone; the named list is a clear, intentional signal (and some
// bots look for their own user-agent). NOTE: while the site sits behind the password wall these
// have no effect — they go live the moment the wall comes off at launch.
const AI_CRAWLERS = [
  "GPTBot", // OpenAI training
  "OAI-SearchBot", // ChatGPT search index
  "ChatGPT-User", // ChatGPT live browsing on a user's behalf
  "ClaudeBot", // Anthropic training
  "Claude-Web",
  "anthropic-ai",
  "Claude-User", // Claude live browsing
  "PerplexityBot", // Perplexity index
  "Perplexity-User", // Perplexity live fetch
  "Google-Extended", // Gemini training + grounding
  "Applebot-Extended", // Apple Intelligence
  "Amazonbot",
  "Bytespider", // TikTok/Doubao
  "Meta-ExternalAgent", // Meta AI
  "cohere-ai",
  "CCBot", // Common Crawl — feeds many open models
];

export const dynamic = "force-dynamic";

// ⚠️ `host` AND `sitemap` MUST MATCH THE DOMAIN BEING ASKED. Both were hardcoded to SJC, so a
// crawler fetching stevenjamesdesigns.com/robots.txt was told the canonical host was
// stevenjamesconsulting.com and pointed at SJC's sitemap — the two directives that decide which
// domain gets credited for the content.
//
// A DEMO IS DISALLOWED OUTRIGHT. Its pages already carry noindex, but that only helps after a
// crawler has fetched one; robots turns it away at the door. A demo carries a real business's
// name, address and phone on Steven's subdomain and has no business being crawled at all.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await resolveHost();

  // A retired demo address: nothing here, and nothing to crawl.
  if (h.kind === "gone") return { rules: [{ userAgent: "*", disallow: "/" }] };

  if (h.kind === "client") {
    // No domain (a demo), or held back on purpose while the build finishes.
    if (!h.site.domain || h.site.holdIndexing) {
      return { rules: [{ userAgent: "*", disallow: "/" }] };
    }
    const origin = publicUrlFor(h.site);
    return {
      rules: [
        { userAgent: "*", allow: "/" },
        { userAgent: AI_CRAWLERS, allow: "/" },
      ],
      sitemap: `${origin}/sitemap.xml`,
      host: origin,
    };
  }

  const base = `https://www.${SJC_HOST}`;
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
