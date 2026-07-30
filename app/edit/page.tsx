import SiteGallery from "@/components/edit/SiteGallery";
import { readSites } from "@/lib/sites";
import { intakeSummaries } from "@/lib/intake";

// The front door of the builder: every website as a card. Gated by middleware (owner-only).
export const dynamic = "force-dynamic";

export default async function EditHome() {
  const sites = await readSites();
  // Onboarding state comes down WITH the gallery, because the question it answers is a
  // cross-client one — who still owes me their information — and that can only be seen on the
  // screen showing all of them at once.
  return <SiteGallery sites={sites} intake={await intakeSummaries(sites)} />;
}
