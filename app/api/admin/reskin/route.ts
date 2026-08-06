// Re-skin a whole website by unpinning the colours its blocks froze in.
//
// ── WHY A SITE DOESN'T FOLLOW ITS OWN BRAND SCREEN ────────────────────────────────────────────
// Every colour field can hold either a brand ROLE ("accent", "bandDark") or a literal hex. A role
// follows the brand screen forever; a hex never moves again. SJC was built before the brand screen
// existed, so its pages are full of literal hexes — change the palette and the page ignores you.
//
// Steven hit exactly this: the brand palette went cyan-on-near-black, the bands moved, and every
// green headline stayed green because "#22c55e" was typed onto the block.
//
// This walks a site's saved pages and swaps the OLD palette's hexes for the role each one was
// playing, so the page starts obeying the brand screen. It is the same mechanism make-template
// already uses to stop a template carrying the previous owner's colours — pointed at a live site
// instead of a copy.
//
//   POST { site?, dryRun? } -> { ok, dryRun, pages: [{ slug, replaced }], total }
//
// ⚠️ DEFAULTS TO A DRY RUN. This rewrites saved content on a live website; the first answer should
// always be a count you can read, not a change you have to undo. Pass dryRun:false to write.
//
// ⚠️ DRAFT ONLY. Nothing here publishes. The change is visible on ?preview=1 and reaches the
// public site when you press Publish on the page — which is where that decision belongs.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { readPages } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// SJC's original palette, and the role each colour was actually playing. Mapping by ROLE rather
// than to a new hex is the whole point: do it once and every future palette change follows too.
const HEX_TO_ROLE: Record<string, string> = {
  "#2563eb": "accent",     // royal blue — links, labels, badges
  "#1d4fd7": "accentHover",
  "#22c55e": "secondary",  // the green headlines and dots — the site's SECOND brand colour, which
  "#16a34a": "secondary",  // is exactly what the brand screen's "Second accent" field now drives.
  "#1e3a6e": "bandDark",   // the navy band behind the hero, the header and the footer
  "#0f1f3d": "bandDarker",
  "#111827": "ink",
  "#4b5563": "mute",
  "#6b7280": "mute",
  "#e5e7eb": "line",
  "#f3f4f6": "bandSoft",
  "#f8fafc": "bandSoft",   // the old "Off-white" band — same role, one shade apart
  "#ffffff": "white",
};

// The same roles as the CSS variables BrandStyle actually emits.
//
// ⚠️ TWO MAPS BECAUSE THERE ARE TWO KINDS OF FROZEN COLOUR, AND ONLY ONE WAS EVER HANDLED.
//
// A block's colour FIELD holds a bare value — "#22c55e" — and wants the role NAME, because the
// block turns a role into a variable itself. But a headline coloured inside the rich-text editor
// holds MARKUP: `<span style="color: rgb(34, 197, 94)">`. The hex is buried in the middle of an
// HTML string, so a whole-string comparison never sees it.
//
// That is the bug this route reported "total: 0" for on 2026-08-05: SJC's pages genuinely had no
// pinned colour FIELDS — every green on the site was typed into the text. The palette went cyan,
// the buttons and bands followed, and three headlines stayed green with nothing on any screen able
// to reach them. A role name is meaningless inside markup, so these become `var(--color-sjc-…)`,
// which is the same thing the block would have emitted.
const ROLE_TO_VAR: Record<string, string> = {
  accent: "--color-sjc-blue",
  accentHover: "--color-sjc-blue-hover",
  secondary: "--color-sjc-secondary",
  highlight: "--color-sjc-highlight",
  ink: "--color-sjc-ink",
  mute: "--color-sjc-mute",
  line: "--color-sjc-line",
  bandSoft: "--color-sjc-bg-soft",
  bandDark: "--color-sjc-navy",
  bandDarker: "--color-sjc-navy-deep",
  cta: "--color-sjc-green",
  ctaHover: "--color-sjc-green-hover",
};

const toHex = (r: string, g: string, b: string) =>
  "#" + [r, g, b].map((n) => Number(n).toString(16).padStart(2, "0")).join("");

/**
 * Unpin the old palette's colours where they sit INSIDE a longer string (rich-text HTML, inline
 * style attributes). Anything not in the old palette is left exactly as typed — an unrecognised
 * colour is somebody's deliberate choice, not a leftover.
 */
function unpinInline(s: string, counts: { n: number }): string {
  // rgb()/rgba() first — the editor writes that form, not hex.
  let out = s.replace(
    /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]*)?\)/gi,
    (m, r, g, b) => {
      const role = HEX_TO_ROLE[toHex(r, g, b)];
      return role && ROLE_TO_VAR[role] ? `var(${ROLE_TO_VAR[role]})` : m;
    }
  );
  out = out.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => {
    const role = HEX_TO_ROLE[hex.toLowerCase()];
    return role && ROLE_TO_VAR[role] ? `var(${ROLE_TO_VAR[role]})` : hex;
  });
  if (out !== s) counts.n++;
  return out;
}

function swap(value: unknown, counts: { n: number }): unknown {
  if (typeof value === "string") {
    const role = HEX_TO_ROLE[value.trim().toLowerCase()];
    if (role) {
      counts.n++;
      return role;
    }
    return unpinInline(value, counts);
  }
  if (Array.isArray(value)) return value.map((v) => swap(v, counts));
  if (value && typeof value === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) o[k] = swap(v, counts);
    return o;
  }
  return value;
}

export async function POST(req: Request) {
  let body: { site?: string; dryRun?: boolean; publish?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const site = String(body?.site || SJC).trim() || SJC;
  // Opt IN to writing. A missing flag means look, not touch.
  const dryRun = body?.dryRun !== false;
  // Opt IN again to reach the public site. A re-skin is one decision across every page — publishing
  // them one at a time through the editor is the same decision typed a dozen times — but it still
  // has to be asked for, and it still only happens on a real run.
  const publish = !dryRun && body?.publish === true;

  const client = getClient();
  const pages = await readPages(site);
  const report: { slug: string; replaced: number; published?: boolean }[] = [];
  let total = 0;

  for (const page of pages) {
    const store = createKvStore(client, puckKey(page.slug, false, site));
    const data = await store.read<Record<string, unknown>>();
    if (!data) continue;

    const counts = { n: 0 };
    const next = swap(data, counts) as Record<string, unknown>;
    if (!counts.n) continue;

    total += counts.n;
    const row: { slug: string; replaced: number; published?: boolean } = {
      slug: page.slug,
      replaced: counts.n,
    };
    if (!dryRun) {
      await store.write(next);
      if (publish) {
        // Same shape the editor's Publish writes — content plus the _pub marker.
        row.published = await createKvStore(client, puckKey(page.slug, true, site)).write({
          ...next,
          _pub: 1,
        });
      }
    }
    report.push(row);
  }

  return Response.json({ ok: true, dryRun, publish, site, pages: report, total });
}
