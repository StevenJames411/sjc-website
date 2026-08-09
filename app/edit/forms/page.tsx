// The form library.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/[site]/settings wins over /edit/[site]/[page]. "forms" is in RESERVED_SITE_IDS for that
// reason — without it a website with that id would be created happily and then be unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/.
//
// The heading and the browser tab both read the name Steven gave this screen in the rail — one
// screen, one name. See navLabel in lib/editNav.ts.
import { readForms, readSections } from "@/lib/forms";
import { readSites } from "@/lib/sites";
import { intakeSummaries } from "@/lib/intake";
import { onboardUrlFor } from "@/lib/hostShared";
import { navLabel } from "@/lib/editNav";
import { SJC } from "@/lib/siteKeys";
import FormLibrary from "@/components/edit/FormLibrary";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("forms") };
}

/**
 * WHERE THE ONBOARDING FORM ACTUALLY RUNS, AND FOR WHOM, RIGHT NOW.
 *
 * ⚠️ THE CARD USED TO SAY "every client's onboarding link" AND NOTHING ELSE, which is true and
 * useless. Steven, 2026-08-06: *"you marked that it's for every client, but right now the only one
 * using it is Steven James Designs… it would be helpful if that was marked."*
 *
 * It matters more than it looks, because Consulting has a 13-question intake of its own (/apply)
 * that reads almost exactly like this nine-question one. Two similar forms and no address on
 * either is precisely how he came to believe the /apply survey WAS the onboarding form. The cure
 * is not better wording — it's putting the real address and the real client list on the card.
 */
async function onboardingFacts() {
  const sites = (await readSites()).filter((s) => s.id !== SJC && !s.deletedAt);
  const summaries = await intakeSummaries(sites.map((s) => ({ id: s.id })));
  return {
    // The pattern, with a real business in it rather than a placeholder — an example you can read
    // beats a shape you have to imagine.
    example: onboardUrlFor({ id: sites[0]?.id || "<business>", domain: sites[0]?.domain }),
    openFor: sites.filter((s) => summaries[s.id]?.status === "open").map((s) => s.name),
    total: sites.length,
  };
}

export default async function FormsPage() {
  const [forms, title, onboarding, sections] = await Promise.all([
    readForms(),
    navLabel("forms"),
    onboardingFacts(),
    readSections(),
  ]);
  return (
    <FormLibrary forms={forms} title={title} onboarding={onboarding} sections={sections} />
  );
}
