// Move already-imported pages onto the content-addressed stylesheet model. ONE-TIME.
//
//   POST { dryRun?, site? } -> { ok, sites: [...], sheets: [...], stamped, skipped }
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// Until 2026-08-12 a design's compiled CSS lived at `site-<id>-designcss-<page>[-pub]` and its
// source at `site-<id>-designsrc-<page>`. Both are now global and named by a hash of the source
// (lib/siteKeys: designSheet / designSource), with each DesignSection block carrying the id in
// `props.sheet`. Pages imported before that carry no id and would render unstyled, because the
// renderers no longer look up a per-page key and the sibling fallback that used to paper over the
// gap has been deleted.
//
// This walks what already exists and gives it an id:
//   1. read the page's archived source (`designSrc`) — that is the true identity of the design
//   2. mint the id from it, exactly as the importer would
//   3. write the global sheet + source under that id
//   4. stamp `props.sheet` on every DesignSection in that page's DRAFT and PUBLISHED content
//
// ⚠️ WHEN THERE IS NO ARCHIVED SOURCE, THE COMPILED CSS IS HASHED INSTEAD. Pages imported before
// `designSrc` existed (2026-08-05) have no source. Hashing the CSS still yields a stable id that
// makes the page render correctly — it just cannot be recompiled later, which was already true of
// those pages and is reported as `recompilable: false` rather than left to be discovered.
//
// ⚠️ DEFAULTS TO A DRY RUN, like everything destructive in this codebase. The old per-page keys are
// deliberately LEFT IN PLACE: this is reversible until someone purges them.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { readSites } from "@/lib/sites";
import { allSlugsEver } from "@/lib/pageRegistry";
import { sheetIdFor } from "@/lib/importDesign";
import { writeDesignSheet, puckKey } from "@/lib/puckContent";
import { siteKeys } from "@/lib/siteKeys";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Stamp `props.sheet` on every DesignSection that hasn't got one. Returns how many. */
function stamp(node: unknown, sheetId: string, count = { n: 0 }): number {
  if (Array.isArray(node)) node.forEach((n) => stamp(n, sheetId, count));
  else if (node && typeof node === "object") {
    const o = node as Record<string, unknown> & { type?: string; props?: Record<string, unknown> };
    if (o.type === "DesignSection" && o.props && !o.props.sheet) {
      o.props.sheet = sheetId;
      count.n++;
    }
    if (o.props) Object.values(o.props).forEach((v) => stamp(v, sheetId, count));
    for (const k of ["content", "zones"]) if (o[k]) stamp(o[k], sheetId, count);
  }
  return count.n;
}

const hasDesignBlock = (node: unknown): boolean =>
  Array.isArray(node)
    ? node.some((n) => hasDesignBlock(n))
    : !!node &&
      typeof node === "object" &&
      ((node as { type?: string }).type === "DesignSection" ||
        ["content", "zones"].some((k) => hasDesignBlock((node as Record<string, unknown>)[k])));

export async function POST(req: Request) {
  let body: { dryRun?: boolean; site?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const dryRun = body?.dryRun !== false;
  const only = String(body?.site || "").trim();

  const client = getClient();
  const sites = (await readSites()).filter((s) => !only || s.id === only);

  const report: {
    site: string;
    page: string;
    sheet: string;
    cssBytes: number;
    recompilable: boolean;
    stampedDraft: number;
    stampedPub: number;
  }[] = [];
  const skipped: string[] = [];

  for (const site of sites) {
    const keys = siteKeys(site.id);
    for (const slug of await allSlugsEver(site.id)) {
      // The old per-page sheet. Published first — it is what was actually being served.
      const css =
        (await createKvStore(client, keys.designCss(slug, true)).read<{ css?: string }>())?.css ||
        (await createKvStore(client, keys.designCss(slug, false)).read<{ css?: string }>())?.css ||
        "";
      const src =
        (await createKvStore(client, keys.designSrc(slug)).read<{ html?: string }>())?.html || "";

      if (!css && !src) continue; // never an imported page

      // The source is the design's real identity, so an id minted from it matches exactly what a
      // fresh import of the same file would produce — which is what lets two sites sharing a design
      // converge on one sheet instead of keeping duplicates forever.
      const sheetId = src
        ? sheetIdFor(src)
        : createHash("sha256").update(css).digest("hex").slice(0, 16);

      let stampedDraft = 0;
      let stampedPub = 0;
      for (const pub of [false, true]) {
        const store = createKvStore(client, puckKey(slug, pub, site.id));
        const data = await store.read<Record<string, unknown>>();
        if (!data || !hasDesignBlock(data)) continue;
        const n = stamp(data, sheetId);
        if (!n) continue;
        if (!dryRun && !(await store.write(data))) {
          return Response.json(
            { ok: false, error: `Couldn't write ${site.id}/${slug} (${pub ? "published" : "draft"}).`, report },
            { status: 500 }
          );
        }
        if (pub) stampedPub = n;
        else stampedDraft = n;
      }

      if (!stampedDraft && !stampedPub) {
        // A stylesheet with no blocks referencing it — already backfilled, or the page's design
        // blocks were removed. Reported rather than silently passed over.
        skipped.push(`${site.id}/${slug}`);
        continue;
      }

      if (!dryRun && css && !(await writeDesignSheet(sheetId, css, src || undefined))) {
        return Response.json(
          { ok: false, error: `Couldn't save the global sheet for ${site.id}/${slug}.`, report },
          { status: 500 }
        );
      }

      report.push({
        site: site.id,
        page: slug,
        sheet: sheetId,
        cssBytes: css.length,
        // No archived source means this design can never be recompiled. Already true before this
        // route ran — said out loud here so it is a known list rather than a surprise later.
        recompilable: !!src,
        stampedDraft,
        stampedPub,
      });
    }
  }

  return Response.json({
    ok: true,
    dryRun,
    pages: report,
    distinctSheets: [...new Set(report.map((r) => r.sheet))].length,
    notRecompilable: report.filter((r) => !r.recompilable).map((r) => `${r.site}/${r.page}`),
    skipped,
    note: dryRun
      ? "Dry run. Nothing written. The old per-page keys are left in place either way."
      : "Backfilled. Old designcss/designsrc keys left in place — purge them once this is verified.",
  });
}
