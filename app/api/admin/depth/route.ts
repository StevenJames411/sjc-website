// Switch on the depth layers for a site's DARK sections.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// A dark band painted with one flat hex has no light in it, so it reads as a slab no matter which
// hex you pick. Steven, comparing SJC against a bought SiteDrop design on 2026-08-05: the bought
// one "looks richer, deeper blue," ours "looks flatter." It was never the colour — it was that
// the bought design layers a blurred corner glow and a faint grid over the fill, and ours didn't.
//
// The Section block has had `decor` (corner glow) and `grid` (graph-paper overlay) for a while.
// They default to blank, so every section ever built has them off. This turns them on where they
// belong instead of asking someone to open every dark section on every page and set two fields.
//
//   POST { site?, dryRun?, publish?, glow?, grid? } -> { ok, pages: [{ slug, changed }], total }
//
// ⚠️ DARK SECTIONS ONLY. A corner glow on a white band is a smudge. The test is the section's
// background ROLE, which is also why this had to wait for the palette to move off literal hexes —
// before that there was no reliable way to ask a section whether it was dark.
//
// ⚠️ NEVER OVERWRITES A CHOICE. A section that already has a glow or grid set is left alone; this
// only fills in blanks. Turning something OFF stays a decision someone makes in the editor.
//
// ⚠️ DRY RUN BY DEFAULT, and publishing is a second opt-in — same contract as /api/admin/reskin.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// The backgrounds that count as dark. Roles, not hexes — a site that still holds literal hexes
// should be run through /api/admin/reskin first, which is the step that makes this knowable.
const DARK = new Set(["bandDark", "bandDarker", "bandHeader"]);

type Node = { type?: string; props?: Record<string, unknown> };

/**
 * Walk every block, set the two depth props on dark Sections that have neither.
 *
 * Recurses through props because Section content is a SLOT — nested sections are real, and a
 * walker that only looked at the top-level array would silently skip them.
 */
function fill(node: unknown, glow: string, grid: string, counts: { n: number }): void {
  if (Array.isArray(node)) return node.forEach((c) => fill(c, glow, grid, counts));
  if (!node || typeof node !== "object") return;

  const n = node as Node;
  if (n.type === "Section" && n.props) {
    const bg = String(n.props.background || "");
    const hasDecor = String(n.props.decor || "").trim() !== "";
    const hasGrid = String(n.props.grid || "").trim() !== "";
    if (DARK.has(bg) && !hasDecor && !hasGrid) {
      n.props.decor = glow;
      n.props.grid = grid;
      counts.n++;
    }
  }

  if (n.props) Object.values(n.props).forEach((v) => fill(v, glow, grid, counts));
}

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean; glow?: string; grid?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  const dryRun = body?.dryRun !== false;
  const publish = !dryRun && body?.publish === true;
  // The brand's own accent by default, so the glow is the site's colour rather than a decision
  // frozen into this file.
  const glow = String(body?.glow || "accent").trim();
  const grid = String(body?.grid || "accent").trim();

  const client = getClient();
  const pages = await readPages(site);
  const report: { slug: string; changed: number; published?: boolean }[] = [];
  let total = 0;

  for (const page of pages) {
    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<Record<string, unknown>>();
    if (!data) continue;

    const counts = { n: 0 };
    fill(data.content, glow, grid, counts);
    if (!counts.n) continue;

    total += counts.n;
    const row: { slug: string; changed: number; published?: boolean } = {
      slug: page.slug,
      changed: counts.n,
    };
    if (!dryRun) {
      await store.write(data);
      if (publish) {
        row.published = await createKvStore(client, puckKey(page.slug, true, site)).write({
          ...data,
          _pub: 1,
        });
      }
    }
    report.push(row);
  }

  return Response.json({ ok: true, dryRun, publish, site, glow, grid, pages: report, total });
}
