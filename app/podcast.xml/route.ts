// The podcast feed Spotify and Apple Podcasts read: https://stevenjamesconsulting.com/podcast.xml
// Everything in it comes from lib/podcastShow.ts.
import { EPISODES, SHOW, audioUrl } from "@/lib/podcastShow";

export const dynamic = "force-static";
export const revalidate = 3600;

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const clock = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");

export function GET() {
  const items = EPISODES.map((e) => `    <item>
      <title>${x(e.title)}</title>
      <description>${x(e.description)}</description>
      <itunes:summary>${x(e.description)}</itunes:summary>
      <link>${SHOW.site}</link>
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
    <link>${SHOW.site}</link>
    <atom:link href="${SHOW.feed}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${x(SHOW.author)}, Steven James Consulting</copyright>
    <description>${x(SHOW.description)}</description>
    <itunes:summary>${x(SHOW.description)}</itunes:summary>
    <itunes:author>${x(SHOW.author)}</itunes:author>
    <itunes:owner><itunes:name>${x(SHOW.author)}</itunes:name><itunes:email>${SHOW.email}</itunes:email></itunes:owner>
    <itunes:image href="${SHOW.cover}"/>
    <image><url>${SHOW.cover}</url><title>${x(SHOW.title)}</title><link>${SHOW.site}</link></image>
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
