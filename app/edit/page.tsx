import SiteGallery from "@/components/edit/SiteGallery";
import { readSites } from "@/lib/sites";
import { navLabel } from "@/lib/editNav";
import { intakeSummaries } from "@/lib/intake";

// The front door of the builder: every website as a card. Gated by middleware (owner-only).
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("websites") };
}

/**
 * ⚠️ THE VIEW IS IN THE URL, NOT IN COMPONENT STATE.
 *
 * Steven wanted a canvas per state rather than everything in one grid: *"one canvas showing the
 * draft websites, one canvas showing the archived… what do you suggest?"*
 *
 * Four real addresses, one implementation. `/edit?view=draft` is a place you can bookmark, land on
 * directly, and reach with the back button — none of which a tab held in React state can do. Four
 * separate ROUTES would have been four copies of the same page to keep in step, and four more rows
 * in a rail he keeps short.
 */
export default async function EditHome({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const view = (await searchParams)?.view || "all";
  // Deleted sites included: the gallery owns the bin, and it's the only screen that shows it.
  const sites = await readSites({ includeDeleted: true });
  // Onboarding state comes down WITH the gallery, because the question it answers is a
  // cross-client one — who still owes me their information — and that can only be seen on the
  // screen showing all of them at once.
  // Heading and tab both read the name Steven gave this screen in the rail. See lib/editNav.ts.
  return (
    <SiteGallery
      sites={sites}
      intake={await intakeSummaries(sites)}
      title={await navLabel("websites")}
      view={view}
    />
  );
}
