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
import { importHtml } from "@/lib/importHtml";
import { createSite, updateSite } from "@/lib/sites";
import { createPage } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { writeBrand } from "@/lib/brand";

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
  let body: { html?: string; url?: string; businessName?: string; dryRun?: boolean };
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

  let result;
  try {
    result = importHtml(html, businessName);
  } catch (e) {
    return Response.json({ ok: false, error: `Couldn't parse that HTML: ${(e as Error).message}` }, { status: 400 });
  }

  const blockCount = (result.data.content || []).length;
  if (!blockCount) {
    return Response.json({ ok: false, error: "Parsed, but nothing recognisable came out.", report: result.report }, { status: 400 });
  }

  if (body?.dryRun) {
    return Response.json({ ok: true, dryRun: true, palette: result.palette, report: result.report, blocks: blockCount, businessName });
  }

  // ── THE WEBSITE ─────────────────────────────────────────────────────────────────────────────
  const site = await createSite({ name: businessName, kind: "client" });
  if (!site.ok || !site.id) return Response.json(site, { status: 400 });
  const siteId = site.id;

  const created = await createPage("Home", siteId);
  if (!created.ok || !created.slug) return Response.json(created, { status: 400 });

  // DRAFT only — an imported site always needs a pass before anyone sees it, and a half-checked
  // page carrying a real business's phone number must not be live at a URL.
  const store = createKvStore(getClient(), puckKey(created.slug, false, siteId));
  if (!(await store.write(result.data as unknown as Record<string, unknown>))) {
    return Response.json({ ok: false, error: "Website created but its content couldn't be saved." }, { status: 500 });
  }

  // The importer already digs the business facts and the palette out of the markup. Before, they
  // only ever landed inside block props; now they go where they belong — on the site record — so
  // every page can reference them and a later clone can't drag them along.
  const footer = (result.data.content || []).find((b) => b?.type === "SiteFooter")?.props as
    | { phone?: string; phoneDisplay?: string; email?: string }
    | undefined;
  await updateSite(siteId, {
    business: {
      name: businessName,
      phone: footer?.phone || "",
      phoneDisplay: footer?.phoneDisplay || "",
      email: footer?.email || "",
      address: "",
      hours: "",
    },
  });

  const p = result.palette as unknown as Record<string, string>;
  await writeBrand(
    { accent: p.accent, secondary: p.secondary, highlight: p.highlight, ink: p.ink, cta: p.cta },
    false,
    siteId
  );

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
    images,
  });
}
