import type { MetadataRoute } from "next";

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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: "https://www.stevenjamesconsulting.com/sitemap.xml",
    host: "https://www.stevenjamesconsulting.com",
  };
}
