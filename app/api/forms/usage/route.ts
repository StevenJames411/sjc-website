// WHAT IS CONNECTED TO THIS FORM — every website and page pointing at it.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────
// Live pointers buy the thing Steven asked for — edit a form once, every page using it changes —
// and they pay for it with dangling references. Three client sites can be quietly depending on
// one form, and nothing on the screen says so.
//
// His answer, and it's the right one: *"when you try to delete something, you see all the dots
// that are connected to it… so a human sees what's connected to things before they delete."*
// Not a confirmation box, which teaches you to click through. The actual list.
//
//   GET ?id=<formId>  -> { ok, form, usedBy: [{ siteId, siteName, slug, title, published }] }
//
// ⚠️ DRAFTS COUNT TOO, and are marked. A page someone is halfway through building is still going
// to break — finding out at Publish is finding out too late.
import { readSites } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";
import { readPuckDraft, readPuckPublished } from "@/lib/puckContent";
import { readForms } from "@/lib/forms";
import { formsInUse } from "@/lib/formPointer";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  const id = (new URL(req.url).searchParams.get("id") || "").trim();
  if (!id) return Response.json({ ok: false, error: "which form?" }, { status: 400 });

  const forms = await readForms();
  const form = forms.find((f) => f.id === id);

  const usedBy: {
    siteId: string;
    siteName: string;
    slug: string;
    title: string;
    published: boolean;
  }[] = [];

  for (const site of await readSites()) {
    for (const page of await readPages(site.id)) {
      const [draft, pub] = await Promise.all([
        readPuckDraft(page.slug, site.id),
        readPuckPublished(page.slug, site.id),
      ]);

      const inDraft = new Set<string>();
      const inPub = new Set<string>();
      if (draft) formsInUse(draft, (f) => inDraft.add(f));
      if (pub) formsInUse(pub, (f) => inPub.add(f));

      if (inDraft.has(id) || inPub.has(id)) {
        usedBy.push({
          siteId: site.id,
          siteName: site.name,
          slug: page.slug,
          title: page.title,
          // Published is the one that costs a customer something today; a draft costs you later.
          published: inPub.has(id),
        });
      }
    }
  }

  return Response.json({
    ok: true,
    form: form ? { id: form.id, name: form.name, kind: form.kind } : null,
    usedBy,
  });
}
