import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import VoiceLab from "@/components/lab/VoiceLab";

// SJC's private voice lab (09-27): talk to each Twilio voice on the fast path. SJC's host only — any other
// host gets its own /voice-lab or its own 404 (lib/sjcRoute). Not in any menu, never indexed.
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const tenant = await tenantPageMetadata("voice-lab");
  if (tenant) return tenant;
  return { title: "Voice lab", robots: { index: false, follow: false } };
}

export default async function Page() {
  const tenant = await tenantPage("voice-lab");
  if (tenant) return tenant;
  return <VoiceLab />;
}
