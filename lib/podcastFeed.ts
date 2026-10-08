// Builds the podcast feed. ONE show, THREE addresses, so the dashboard shows which app a visitor came from
// (Steven's rule: every asset out in the world links home through its own tracked smart link):
//   /podcast-spotify.xml  -> submitted to Spotify          links go through /go/podcast-spotify
//   /podcast-apple.xml    -> submitted to Apple Podcasts   links go through /go/podcast-apple
//   /podcast.xml          -> any other app                 links go through /go/podcast-feed
// The episodes and audio are identical in all three; only the website links differ.
import { EPISODES, SHOW, audioUrl } from "@/lib/podcastShow";

export type FeedApp = "spotify" | "apple" | "other";
const LINK: Record<FeedApp, string> = { spotify: "podcast-spotify", apple: "podcast-apple", other: "podcast-feed" };
const FILE: Record<FeedApp, string> = { spotify: "podcast-spotify.xml", apple: "podcast-apple.xml", other: "podcast.xml" };

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

export function podcastFeed(app: FeedApp): Response {
  const go = `https://stevenjamesconsulting.com/go/${LINK[app]}`;
  const self = `https://stevenjamesconsulting.com/${FILE[app]}`;
  const more = (text: string) => `${text} More at ${go}`;
  const items = EPISODES.map((e) => `    <item>
      <title>${x(e.title)}</title>
      <description>${x(more(e.description))}</description>
      <itunes:summary>${x(more(e.description))}</itunes:summary>
      <link>${go}</link>
      <guid isPermaLink="false">sjc-podcast-${e.slug}</guid>
      <pubDate>${new Date(e.date + "T12:00:00Z").toUTCString()}</pubDate>
      <enclosure url="${audioUrl(e)}" length="${e.bytes}" type="audio/mpeg"/>
      <itunes:duration>${clock(e.seconds)}</itunes:duration>
      <itunes:author>${x(SHOW.author)}</itunes:author>
      <itunes:explicit>false</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
    </item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${x(SHOW.title)}</title>
    <link>${go}</link>
    <atom:link href="${self}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${x(SHOW.author)}, Steven James Consulting</copyright>
    <description>${x(more(SHOW.description))}</description>
    <itunes:summary>${x(more(SHOW.description))}</itunes:summary>
    <itunes:author>${x(SHOW.author)}</itunes:author>
    <itunes:owner><itunes:name>${x(SHOW.author)}</itunes:name><itunes:email>${SHOW.email}</itunes:email></itunes:owner>
    <itunes:image href="${SHOW.cover}"/>
    <image><url>${SHOW.cover}</url><title>${x(SHOW.title)}</title><link>${go}</link></image>
    <itunes:category text="Business"><itunes:category text="Entrepreneurship"/></itunes:category>
    <itunes:category text="Business"><itunes:category text="Marketing"/></itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900, s-maxage=3600" } });
}
