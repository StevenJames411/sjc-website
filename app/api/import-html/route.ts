// Paste a generated site's HTML, get a real page in the builder.
//
// Owner-only (middleware gates everything under /api except the public lead endpoints).
//
//   POST { html, businessName, dryRun? } -> { ok, slug?, palette, report }
//
// dryRun parses and reports WITHOUT creating anything, so the palette guess and the section
// breakdown can be eyeballed before a page exists. Import is cheap to redo; a half-made page
// cluttering the switcher is annoying, so the default is to look first.
import { importHtml } from "@/lib/importHtml";
import { createPage } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { html?: string; businessName?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const html = String(body?.html || "");
  const businessName = String(body?.businessName || "").trim();
  if (!html.trim()) return Response.json({ ok: false, error: "Paste the page's HTML first." }, { status: 400 });
  if (!businessName) return Response.json({ ok: false, error: "A business name is required — it becomes the web address." }, { status: 400 });
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
    return Response.json({ ok: true, dryRun: true, palette: result.palette, report: result.report, blocks: blockCount });
  }

  const created = await createPage(businessName);
  if (!created.ok || !created.slug) return Response.json(created, { status: 400 });

  // DRAFT only — never published. An imported page always needs a pass before anyone sees it,
  // and a half-checked page carrying a real business's phone number must not be live at a URL.
  const store = createKvStore(getClient(), puckKey(created.slug, false));
  const wrote = await store.write(result.data as unknown as Record<string, unknown>);
  if (!wrote) {
    return Response.json({ ok: false, error: "Page created but its content couldn't be saved." }, { status: 500 });
  }

  return Response.json({
    ok: true,
    slug: created.slug,
    palette: result.palette,
    report: result.report,
    blocks: blockCount,
  });
}
