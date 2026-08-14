// One website's global brand: read, save a draft, publish it.
// Same draft/published split the page content uses — the live site only reads published.
//
// ⚠️ IT TAKES A SITE NOW, AND THAT WAS A HOLE RATHER THAN A REFINEMENT.
//
// Storage has always been per-site (`siteKeys(siteId).brand`) and rendering has always been
// per-site (lib/publicSitePage reads the brand of the site it is serving). Only this route was
// hard-wired to SJC — so a client's fonts and colours could be stored and could be rendered, and
// there was no way at all to SET them. Every native client build inherited SJC's palette
// permanently, and the brand screen opened at any address silently edited Steven's own site.
//
// The same failure pattern as earlier the same day, when three colours existed in the brand with
// no field anywhere to edit them: not a broken control, a control nobody had built. Worse here,
// because both sides of it worked — nothing looked wrong from either end.
//
// Defaults to SJC when no site is named, so the existing /edit/brand screen keeps working.
import { readBrand, writeBrand, normalize, BRAND_DEFAULTS } from "@/lib/brand";
import { SWATCHES } from "@/lib/brandShared";
import { SJC } from "@/lib/siteKeys";

import { siteOr } from "@/lib/siteAccess";

export const dynamic = "force-dynamic";

const siteFrom = (v: unknown) => String(v || "").trim() || SJC;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pub = url.searchParams.get("pub") === "1";
  // ⛔ SCOPED. Without this the caller names the site and the route believes them — and `siteFrom`
  // FALLS BACK TO SJC, so an omitted parameter reached the flagship site rather than failing.
  const { site: __s, deny } = await siteOr(siteFrom(url.searchParams.get("site")), req);
  if (deny) return deny;
  const site = __s.id;
  return Response.json({ ok: true, site, brand: await readBrand(pub, site), defaults: BRAND_DEFAULTS });
}

// Save the working copy. Nothing here reaches the public site until it's published.
export async function PUT(req: Request) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return Response.json({ ok: false, error: "bad json" }, { status: 400 }); }

  // ⛔ SCOPED. Without this the caller names the site and the route believes them — and `siteFrom`
  // FALLS BACK TO SJC, so an omitted parameter reached the flagship site rather than failing.
  const { site: __s, deny } = await siteOr(siteFrom((body as { site?: unknown })?.site), req);
  if (deny) return deny;
  const site = __s.id;
  const ok = await writeBrand(normalize((body as { brand?: unknown })?.brand), false, site);
  return Response.json({ ok, site, error: ok ? undefined : "could not save — storage unreachable" });
}

// action=publish  → copy draft to published
// action=reset    → put the site back to the shipped defaults (publishes immediately)
export async function POST(req: Request) {
  let body: { action?: string; site?: string } = {};
  try { body = await req.json(); } catch { /* no body → treated as unknown action */ }
  // ⛔ SCOPED. Without this the caller names the site and the route believes them — and `siteFrom`
  // FALLS BACK TO SJC, so an omitted parameter reached the flagship site rather than failing.
  const { site: __s, deny } = await siteOr(siteFrom(body.site), req);
  if (deny) return deny;
  const site = __s.id;

  if (body.action === "publish") {
    const draft = await readBrand(false, site);
    const ok = await writeBrand(draft, true, site);
    return Response.json({ ok, site, brand: draft });
  }

  // ⛔ PUBLISH THE TYPEFACE AND NOTHING ELSE — because the fonts live on TWO screens and the
  // colours only on one (added 2026-08-13).
  //
  // Website settings applies a font on one click, deliberately: it sits beside the phone number,
  // which is live when it saves. The brand screen is draft-then-publish, and owns all 13 colours.
  // One record, two save semantics.
  //
  // A plain `publish` from the settings screen therefore had two ways to lie. It shipped whatever
  // half-finished palette was sitting in the draft — the operator picks a font and a colour
  // experiment they never approved goes live — and the settings screen, which loads the PUBLISHED
  // brand, would PUT that stale copy back over the draft first and erase the experiment entirely.
  // Either way somebody's work moved without being asked.
  //
  // So the narrow action: copy ONLY the typography fields from draft to published. Colours stay
  // exactly as published until somebody presses Publish on the screen that owns them.

  // The colour half of the same idea. Each action publishes ONLY the fields its own control
  // touched, so neither can carry the other's unapproved work live.
  if (body.action === "publish-colours") {
    const draft = await readBrand(false, site);
    const live = await readBrand(true, site);
    const next = { ...live } as Record<string, unknown>;
    for (const { key } of SWATCHES) next[key as string] = (draft as Record<string, unknown>)[key as string];
    const ok = await writeBrand(next as typeof live, true, site);
    return Response.json({ ok, site, brand: next });
  }

  // Sizes, same contract again: only this control's own field goes live.
  // Per-element typefaces, same contract: only this control's own field goes live.
  if (body.action === "publish-faces") {
    const draft = await readBrand(false, site);
    const live = await readBrand(true, site);
    const next = { ...live, faceFor: draft.faceFor };
    const ok = await writeBrand(next, true, site);
    return Response.json({ ok, site, brand: next });
  }

  if (body.action === "publish-sizes") {
    const draft = await readBrand(false, site);
    const live = await readBrand(true, site);
    const ok = await writeBrand({ ...live, typeScale: draft.typeScale }, true, site);
    return Response.json({ ok, site, brand: { ...live, typeScale: draft.typeScale } });
  }

  if (body.action === "publish-fonts") {
    const draft = await readBrand(false, site);
    const live = await readBrand(true, site);
    const next = {
      ...live,
      font: draft.font,
      headingFont: draft.headingFont,
      fontSet: draft.fontSet,
      designFont: draft.designFont,
      designHeadingFont: draft.designHeadingFont,
    };
    const ok = await writeBrand(next, true, site);
    return Response.json({ ok, site, brand: next });
  }
  if (body.action === "reset") {
    // The way back. Whatever a brand experiment did, this returns the site to as-shipped.
    const a = await writeBrand(BRAND_DEFAULTS, false, site);
    const b = await writeBrand(BRAND_DEFAULTS, true, site);
    return Response.json({ ok: a && b, site, brand: BRAND_DEFAULTS });
  }
  return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
}
