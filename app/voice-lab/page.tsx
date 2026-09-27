import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import { resolveHost } from "@/lib/host";
import { SJC } from "@/lib/siteKeys";
import VoiceLab from "@/components/lab/VoiceLab";

// SJC's private voice lab (09-27): talk to each Twilio voice on the fast path. Not in any menu, never indexed.
// ⚠️ SJC's apex now resolves as a builder site (kind "client", id SJC), so tenantPage() alone would hand this
// route to the builder and 404. SJC's own host — either shape — gets the lab; any other host gets its own page/404.
export const dynamic = "force-dynamic";

async function isSjcHost() {
  const h = await resolveHost();
  return h.kind === "sjc" || (h.kind === "client" && h.site.id === SJC);
}

export async function generateMetadata() {
  if (await isSjcHost()) return { title: "Voice lab", robots: { index: false, follow: false } };
  return (await tenantPageMetadata("voice-lab")) || {};
}

export default async function Page() {
  if (await isSjcHost()) return <VoiceLab />;
  return (await tenantPage("voice-lab")) || null;
}
