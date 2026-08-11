// Repoint a design's page-to-page links from FILENAMES to the routes this site serves.
//
// ── THE FAILURE THIS UNDOES ───────────────────────────────────────────────────────────────────
// A generated design links between its pages by filename — `href="custom-websites.html"` — because
// it was built as a folder you open off a disk. We serve those pages as routes
// (`/custom-websites`), so every one of those links 404s once the site is live.
//
// ⚠️ IT SURVIVES EVERY OBVIOUS CHECK. The pages import, publish and load perfectly when you type
// their address. The only broken thing is getting there by CLICKING — which is the only way a
// visitor ever does it. On sjc-2026 it was the whole nav and the whole footer, on all ten pages.
//
// lib/designHtml.ts now normalises this at import. This is the other half: sites imported before
// that fix keep the filenames in their saved link rows, and re-importing would discard every page
// built out since.
//
//   POST { site?, dryRun?, publish? } -> { ok, pages:[{slug,fixed}], unmatched:[…], total }
//
// ⚠️ DEFAULTS TO A DRY RUN. First answer should be a count you can read.
//
// ⚠️ VALIDATED AGAINST THE REAL PAGE LIST, not just pattern-matched. A link to `services.html` on a
// site with no `services` page is reported under `unmatched` and left exactly as it was — rewriting
// it would turn a visibly broken link into an invisibly broken one, which is worse: a 404 you can
// see gets fixed, a link that silently goes nowhere does not.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { normalizeInternalHref } from "@/lib/designHtml";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** A bare `name.html` / `./name.html` link — the shape a disk-built design writes. */
const FILE_LINK = /^(?!\s*(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#))\s*\.?\/?[\w./-]+\.html?(?:[?#][^\s]*)?$/i;

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;
  const publish = body?.publish === true;

  const client = getClient();
  const pages = await readPages(site);
  const slugs = new Set(pages.map((p) => p.slug));
  const unmatched = new Set<string>();

  const fix = (value: string, counts: { n: number }): string => {
    if (!FILE_LINK.test(value)) return value;
    const next = normalizeInternalHref(value);
    if (next === value) return value;
    // "/" is the root; anything else has to name a page this site really has.
    const target = next.replace(/^\//, "").replace(/[?#][\s\S]*$/, "");
    if (target && !slugs.has(target)) {
      unmatched.add(`${value} -> ${next}`);
      return value;
    }
    counts.n++;
    return next;
  };

  const walk = (value: unknown, counts: { n: number }): unknown => {
    if (typeof value === "string") return fix(value, counts);
    if (Array.isArray(value)) return value.map((v) => walk(v, counts));
    if (value && typeof value === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = walk(v, counts);
      return o;
    }
    return value;
  };

  const report: { slug: string; fixed: number; published?: boolean }[] = [];
  let total = 0;

  for (const page of pages) {
    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<Record<string, unknown>>();
    if (!data) continue;

    const counts = { n: 0 };
    const next = walk(data, counts) as Record<string, unknown>;
    if (!counts.n) continue;

    total += counts.n;
    const row: { slug: string; fixed: number; published?: boolean } = {
      slug: page.slug,
      fixed: counts.n,
    };
    if (!dryRun) {
      await store.write(next);
      if (publish) {
        row.published = await createKvStore(client, puckKey(page.slug, true, site)).write({
          ...next,
          _pub: 1,
        });
      }
    }
    report.push(row);
  }

  return Response.json({
    ok: true,
    dryRun,
    publish,
    site,
    pages: report,
    total,
    unmatched: [...unmatched],
  });
}
