// Find the feature cards on a site that was imported before card detection existed, and mark them.
//
// ── WHY A SEPARATE PASS ───────────────────────────────────────────────────────────────────────
// Detection runs at import (lib/designHtml.ts markBoxes). A site already in the database was
// tokenised without it, so its cards carry no marker — and with no marker there is no selector to
// hang the controls off, so the "Feature cards" row never appears. Re-importing would find them
// and discard every page built out since.
//
// ⚠️ THIS EDITS THE STORED MARKUP, NOT THE STYLESHEET. It adds two data attributes per card and
// nothing else: no styling, no restructuring, no change to a single word. A card that is already
// marked is skipped, so running it twice is a no-op.
//
//   POST { site?, dryRun? } -> { ok, pages: [{ slug, groups, cards }], total }
//
// ⚠️ DEFAULTS TO A DRY RUN. The count is the useful answer: six cards in one group on the home
// page is right, forty "cards" across nine groups means the detector matched something it
// shouldn't and nothing should be written.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { markBoxesIn, unmarkBoxes } from "@/lib/designHtml";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Block = { type?: string; props?: Record<string, unknown> };

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean; force?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;
  const publish = body?.publish === true;
  const force = body?.force === true;

  const client = getClient();
  const pages = await readPages(site);
  const report: { slug: string; groups: number; cards: number }[] = [];
  let total = 0;

  for (const page of pages) {
    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<{ content?: Block[] }>();
    if (!data?.content?.length) continue;

    let groups = 0;
    let cards = 0;
    const content = data.content.map((block, i) => {
      if (block?.type !== "DesignSection") return block;
      let html = String(block.props?.html || "");
      if (!html) return block;
      // Already marked — leave it alone, unless asked to redo it (a re-detect is what fixes keys
      // that were assigned before they were unique across the page).
      if (html.includes("data-sjc-box")) {
        if (!force) return block;
        html = unmarkBoxes(html);
      }

      // Prefixed by section so two sections can never hand out the same group key.
      const found = markBoxesIn(html, `s${i + 1}`);
      if (!found.boxes.length) return block;

      groups += found.boxes.length;
      cards += found.boxes.reduce((n, b) => n + b.count, 0);
      return { ...block, props: { ...block.props, html: found.html, boxes: found.boxes } };
    });

    if (!groups) continue;
    total += cards;

    if (!dryRun) {
      const next = { ...data, content };
      await store.write(next);
      if (publish) {
        await createKvStore(client, puckKey(page.slug, true, site)).write({ ...next, _pub: 1 });
      }
    }
    report.push({ slug: page.slug, groups, cards });
  }

  return Response.json({ ok: true, dryRun, publish, site, pages: report, total });
}
