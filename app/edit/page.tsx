import SiteGallery from "@/components/edit/SiteGallery";
import { readSites } from "@/lib/sites";

// The front door of the builder: every website as a card. Gated by middleware (owner-only).
export const dynamic = "force-dynamic";

export default async function EditHome() {
  return <SiteGallery sites={await readSites()} />;
}
