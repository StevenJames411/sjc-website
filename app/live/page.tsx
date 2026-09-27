import type { Metadata } from "next";
import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import { resolveHost } from "@/lib/host";
import { SJC } from "@/lib/siteKeys";
import TalkingHero from "@/components/blocks/TalkingHero";

// AI_EMPLOYEE_NAME = "Chloe" — placeholder for later. The widget below still speaks as "Steven"
// (NEXT_PUBLIC_AGENT_NAME) until that's renamed, so the framing line names Steven, not this.

// Steven's YouTube channel. /embed/live_stream plays whatever is live now (or the next scheduled
// stream) — the page never needs editing per show. Every bio points here: one link, on land we own.
const CHANNEL_ID = "UC0k_GBAp8y6c5MnkX7sBqqA";

const SJC_METADATA: Metadata = {
  title: "Funnel Hack Live — Steven James Consulting",
  description:
    "Live every weekday at 11 a.m. Central: real businesses, big and small, and where their customers leak out.",
};

// ⚠️ NOT force-static: this route has to look at the HOST to decide whose page it is.
export const dynamic = "force-dynamic";

// ⚠️ SJC's apex is itself a BUILDER site (kind "client", id SJC), so the usual tenantPage() bridge
// would look for a builder page called "live" on it, find none, and 404. /live is a hand-written
// SJC page: on SJC's own site it renders here; on every other host it forwards like /careers does.
async function isSjcHost() {
  const h = await resolveHost();
  return h.kind === "sjc" || (h.kind === "client" && h.site.id === SJC);
}

export async function generateMetadata(): Promise<Metadata> {
  if (await isSjcHost()) return SJC_METADATA;
  const tenant = await tenantPageMetadata("live");
  return tenant || SJC_METADATA;
}

export default async function LivePage() {
  // Not SJC's domain? This name belongs to whoever that host is. See lib/sjcRoute.
  if (!(await isSjcHost())) {
    const tenant = await tenantPage("live");
    if (tenant) return tenant;
  }
  return (
    <main style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(48px,7vw,96px) clamp(16px,5vw,48px)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227" }}>
          Live every weekday · 11 a.m. Central
        </div>
        <h1 style={{ font: "300 clamp(32px,5vw,58px)/1.1 Georgia, serif", margin: "18px 0 0" }}>
          Funnel Hack Live.
        </h1>
        <p style={{ maxWidth: "62ch", margin: "22px 0 0", fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,.7)", fontWeight: 300 }}>
          Every weekday Steven walks real businesses — the biggest names and the smallest — and shows
          where their customers leak out. Drop your link in the chat and he will walk yours.
        </p>
        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            margin: "clamp(32px,5vw,56px) 0 0",
            background: "#000",
            border: "1px solid rgba(201,162,39,.35)",
          }}
        >
          <iframe
            src={`https://www.youtube.com/embed/live_stream?channel=${CHANNEL_ID}`}
            title="Funnel Hack Live"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>

        <p style={{ maxWidth: "62ch", margin: "clamp(40px,6vw,72px) 0 0", fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,.7)", fontWeight: 300 }}>
          Want Steven to look at your business? Talk to him right here — he'll get you on the
          calendar.
        </p>
      </div>

      <TalkingHero
        mode="live"
        eyebrow=""
        headline="Talk to him right here."
        byline=""
        opener="Hey — glad you caught the show. Tell me a little about your business and what's not working, and I'll find a time that works for both of us."
        ctaTalk="Tap and I'll talk to you"
        ctaType="Type instead"
        minHeight={64}
      />
    </main>
  );
}
