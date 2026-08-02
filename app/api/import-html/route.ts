// Bring a design in from another platform and get a real WEBSITE in the builder.
//
// This is the biggest time-saver in the workflow and the same move ClickFunnels and GoHighLevel
// offer for importing a build from elsewhere: SiteDrop designs it, we pull the whole thing in
// editable, and nothing is retyped.
//
// Owner-only (middleware gates everything under /api except the public lead endpoints).
//
//   POST { url | html, businessName?, dryRun? } -> { ok, siteId?, palette, report }
//
// `url`  — a published address (e.g. best-in-show-grooming.sitedrop.ai). Fetched server-side, so
//          there is no wall of HTML to copy and no dependency on the source platform's API.
// `html` — pasted markup, the original path, unchanged.
// dryRun parses and reports WITHOUT creating anything, so the palette guess and the section
// breakdown can be eyeballed first. Import is cheap to redo; a half-made website is annoying.
//
// ⚠️ IT CREATES A SITE, NOT A PAGE. This route used to call createPage(), which dropped every
// import into SJC's own page list — one flat drawer holding every client's work, and the reason
// "clone" used to mean "clone Steven James Consulting".
import type { Data } from "@measured/puck";
import { importHtml } from "@/lib/importHtml";
import { importDesign, detectFonts, detectAccent } from "@/lib/importDesign";
import { createSite, updateSite } from "@/lib/sites";
import { createPage } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey, writeDesignCss } from "@/lib/puckContent";
import { writeBrand } from "@/lib/brand";
import type { BrandFont } from "@/lib/brandShared";
import { applyTokens, tokenRules } from "@/lib/tokenizePage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_HTML = 5 * 1024 * 1024;

/** Fetch a published page's markup. */
async function fetchHtml(raw: string): Promise<{ html?: string; error?: string }> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { error: "That doesn't look like a web address." };
  }
  if (!/^https?:$/.test(url.protocol)) return { error: "Only http and https addresses work." };
  // Don't let a pasted address make the server fetch something on our own private network.
  if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[?::1)/i.test(url.hostname)) {
    return { error: "That address points at a private network." };
  }

  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; SJCBuilder/1.0)" },
    });
    if (!res.ok) return { error: `The page returned ${res.status}.` };
    const type = res.headers.get("content-type") || "";
    if (!/text\/html/i.test(type)) return { error: `That address returned ${type || "no HTML"}.` };
    const html = await res.text();
    if (html.length > MAX_HTML) return { error: "That page is too big to import." };
    return { html };
  } catch (e) {
    return { error: `Couldn't reach that address: ${(e as Error).message}` };
  }
}

/** "best-in-show-grooming.sitedrop.ai" -> "Best In Show Grooming" */
function nameFromUrl(raw: string): string {
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname;
    const label = host.replace(/^www\./, "").split(".")[0];
    return label.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  let body: { html?: string; url?: string; businessName?: string; dryRun?: boolean; mode?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  let html = String(body?.html || "");
  const url = String(body?.url || "").trim();

  if (!html.trim() && url) {
    const got = await fetchHtml(url);
    if (got.error) return Response.json({ ok: false, error: got.error }, { status: 400 });
    html = got.html || "";
  }

  if (!html.trim()) {
    return Response.json({ ok: false, error: "Paste the page's HTML, or give its web address." }, { status: 400 });
  }

  const businessName = String(body?.businessName || "").trim() || (url ? nameFromUrl(url) : "");
  if (!businessName) {
    return Response.json({ ok: false, error: "A business name is required — it becomes the web address." }, { status: 400 });
  }
  if (!/<section|<header|<footer/i.test(html)) {
    return Response.json({ ok: false, error: "That doesn't look like a full page — no <section>, <header> or <footer> found." }, { status: 400 });
  }

  // ── WHICH IMPORT ────────────────────────────────────────────────────────────────────────────
  // "design" (the default) keeps the look: the markup stays verbatim, its Tailwind is compiled
  // into a real stylesheet, and only the words and photos become editable. See lib/importDesign.
  //
  // "blocks" is the original behaviour — map the page onto our own block vocabulary. It gives
  // full drag-and-drop editing but flattens gradients, glass, shadows and the type scale, so it
  // is only the right call for a plain page that was never worth much visually.
  // "editable" (the goal): map onto REAL blocks and KEEP the look — colours stay exact, the
  // gradient/glass/glow are read rather than dropped. Fully drag-and-drop afterwards.
  // "design": sealed HTML — pixel-perfect, not editable. The fallback.
  // "blocks": the original, colours quantised to brand roles. For a plain page.
  // ⚠️ DEFAULT IS "design". Sealed used to mean "words and photos only", so blocks were the
  // richer choice. That inverted: a sealed section now takes edits to every word, photo, link,
  // colour, size and its spacing, AND mounts the real lead form in place — with none of the
  // fidelity lost in translating a design into our block vocabulary. Blocks are now the trade,
  // not the upgrade.
  const raw = String(body?.mode || "design").toLowerCase();
  const mode: "editable" | "design" | "blocks" =
    raw === "design" ? "design" : raw === "blocks" ? "blocks" : "editable";

  let result: {
    data: Data;
    report: string[] | Record<string, unknown>;
    palette?: unknown;
    css?: string;
    fonts?: { headingFont: BrandFont; bodyFont: BrandFont };
    accent?: string;
  };
  try {
    result =
      mode === "design"
        ? await importDesign(html, businessName)
        : importHtml(html, businessName, { preserve: mode === "editable" });
  } catch (e) {
    return Response.json({ ok: false, error: `Couldn't parse that HTML: ${(e as Error).message}` }, { status: 400 });
  }

  const blockCount = (result.data.content || []).length;
  if (!blockCount) {
    return Response.json({ ok: false, error: "Parsed, but nothing recognisable came out.", report: result.report }, { status: 400 });
  }

  if (body?.dryRun) {
    return Response.json({
      ok: true,
      dryRun: true,
      mode,
      palette: result.palette,
      report: result.report,
      blocks: blockCount,
      businessName,
      ...(mode === "design"
        ? { cssKB: +((result.css || "").length / 1024).toFixed(1), fonts: result.fonts, accent: result.accent }
        : {}),
    });
  }

  // ── THE WEBSITE ─────────────────────────────────────────────────────────────────────────────
  const site = await createSite({ name: businessName, kind: "client" });
  if (!site.ok || !site.id) return Response.json(site, { status: 400 });
  const siteId = site.id;

  const created = await createPage("Home", siteId);
  if (!created.ok || !created.slug) return Response.json(created, { status: 400 });

  // The importer already digs the business facts out of the markup. They go on the SITE RECORD —
  // not just into block props — so every page can reference them and a later clone can't drag the
  // previous owner's details along.
  const footer = (result.data.content || []).find((b) => b?.type === "SiteFooter")?.props as
    | { phone?: string; phoneDisplay?: string; email?: string }
    | undefined;
  const business = {
    name: businessName,
    phone: footer?.phone || "",
    phoneDisplay: footer?.phoneDisplay || "",
    email: footer?.email || "",
    address: "",
    hours: "",
  };
  await updateSite(siteId, { business });

  // …AND the page is wired to them in the same breath. Doing this at import is the whole point:
  // otherwise every imported site arrives with the phone number typed into six blocks and needs a
  // manual sweep afterwards, which is a migration step masquerading as a feature.
  const tokenCounts: Record<string, number> = {};
  const wired = applyTokens(result.data, tokenRules(business), tokenCounts);

  // DRAFT only — an imported site always needs a pass before anyone sees it, and a half-checked
  // page carrying a real business's phone number must not be live at a URL.
  const store = createKvStore(getClient(), puckKey(created.slug, false, siteId));
  if (!(await store.write(wired as unknown as Record<string, unknown>))) {
    return Response.json({ ok: false, error: "Website created but its content couldn't be saved." }, { status: 500 });
  }

  // ── THE DESIGN'S OWN STYLESHEET ─────────────────────────────────────────────────────────────
  // Draft, like the content. A design has to go live with the page it belongs to — publishing the
  // stylesheet on import would restyle a page nobody had approved yet.
  if (mode === "design" && result.css) {
    if (!(await writeDesignCss(created.slug, result.css, false, siteId))) {
      return Response.json(
        { ok: false, error: "Website created but its design stylesheet couldn't be saved." },
        { status: 500 }
      );
    }
  }

  // ── THE BRAND ───────────────────────────────────────────────────────────────────────────────
  // ⚠️ LOAD-BEARING IN "editable" MODE, not cosmetic. There the page is made of OUR blocks, and
  // our blocks take their typeface from the brand — so if this doesn't run, a design built in
  // Space Grotesk imports and renders in Lexend, and it reads as a botched import rather than a
  // missing setting. (In "design" mode the sections carry their own CSS and this only governs
  // what a section added LATER picks up.)
  if (mode !== "blocks") {
    const fonts = result.fonts ?? detectFonts(html);
    const accent = result.accent ?? detectAccent(html);
    await writeBrand(
      {
        font: fonts.bodyFont,
        headingFont: fonts.headingFont,
        ...(accent ? { accent, cta: accent } : {}),
      },
      false,
      siteId
    );
  } else {
    const p = result.palette as unknown as Record<string, string>;
    await writeBrand(
      { accent: p.accent, secondary: p.secondary, highlight: p.highlight, ink: p.ink, cta: p.cta },
      false,
      siteId
    );
  }

  // ADOPT THE IMAGES IMMEDIATELY. An imported page's photos point at the tool that generated them
  // — a live dependency on a third party inside a site a client will pay for. Doing this on import
  // rather than leaving it as a step to remember is the difference between "we always do it" and
  // "we did it that time". If it fails the site is still fine and the editor's button retries it.
  let images: { adopted?: number; failures?: unknown[]; error?: string } = {};
  try {
    const origin = new URL(req.url).origin;
    const r = await fetch(`${origin}/api/adopt-images`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") || "" },
      body: JSON.stringify({ slug: created.slug, siteId }),
    });
    images = await r.json();
  } catch (e) {
    images = { error: (e as Error).message };
  }

  return Response.json({
    ok: true,
    siteId,
    slug: created.slug,
    palette: result.palette,
    report: result.report,
    blocks: blockCount,
    linked: tokenCounts,
    images,
  });
}
