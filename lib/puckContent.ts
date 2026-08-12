// Server-only loader for Puck-built page data.
//
// Every key comes from lib/siteKeys — see that file for why site `sjc` keeps its legacy key names
// while every other website gets its own namespace. Public render reads the PUBLISHED snapshot
// only, and only when it carries the `_pub` marker, so editor drafts stay private until Publish.
// The single exception is preview mode — an authenticated owner on `?preview=1` — see
// previewRequested() below. A visitor can never reach a draft.
import type { Data } from "@measured/puck";
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { siteKeys, designSheet, designSource, SJC } from "./siteKeys";

/**
 * A page's storage key.
 *
 * `siteId` defaults to SJC so the pre-existing callers that only ever knew about one website keep
 * working untouched. New code should always pass it explicitly.
 */
export const puckKey = (page: string, pub = false, siteId: string) =>
  siteKeys(siteId).puck(page, pub);

/**
 * PREVIEW MODE (2026-07-30). True when middleware has marked this request as an authenticated
 * owner asking to see the draft (`?preview=1` on any public URL).
 *
 * The signal arrives as a REQUEST HEADER rather than a query string the page re-reads, so this
 * loader can honour it centrally. Otherwise all fourteen callers of readPuckPublished — every
 * page, the nav, the footer, every client site — would each need their own opt-in, and the one
 * nobody remembered to wire up would be the one that mattered.
 *
 * Trust: middleware DELETES any inbound copy of this header before setting its own, so a visitor
 * cannot forge it. See PREVIEW_HEADER in middleware.ts.
 *
 * The try/catch covers being called outside a request scope (static generation, scripts), where
 * headers() is unavailable — no request means no preview.
 */
async function previewRequested(): Promise<boolean> {
  try {
    const { headers } = await import("next/headers");
    return (await headers()).get("x-sjc-preview") === "1";
  } catch {
    return false;
  }
}

export async function readPuckPublished(page: string, siteId: string): Promise<Data | null> {
  // Owner previewing: serve the working draft through the real public template. Falls back to the
  // published copy when no draft exists, so preview never renders a blank page.
  if (await previewRequested()) {
    const draft = await readPuckDraft(page, siteId);
    if (draft) return draft;
  }
  const store = createKvStore(getClient(), puckKey(page, true, siteId));
  const v = (await store.read<Data & { _pub?: number }>()) || null;
  return v && v._pub ? v : null;
}

/** The working draft — the editor's copy, never served to the public. */
export async function readPuckDraft(page: string, siteId: string): Promise<Data | null> {
  const store = createKvStore(getClient(), puckKey(page, false, siteId));
  return (await store.read<Data>()) || null;
}

/**
 * The compiled stylesheet for a page that came from a bought design, or "" when the page wasn't
 * imported (which is most of them).
 *
 * Follows the SAME draft/published rules as the content above, including preview: a design change
 * has to go live with the page it belongs to, or a published page would suddenly be wearing a
 * stylesheet nobody approved.
 */
export async function readDesignCss(page: string, siteId: string): Promise<string> {
  const data = (await readPuckPublished(page, siteId)) || (await readPuckDraft(page, siteId));
  return sheetsFor(data);
}

/**
 * The stylesheets a page's blocks actually reference — read straight off the data.
 *
 * ── WHAT THIS REPLACED, AND WHY (2026-08-12) ──────────────────────────────────────────────────
 * This used to look up `designCss(page, pub)` and, finding nothing, fall through to ANY SIBLING
 * PAGE'S published sheet in the same site. The fallback existed because the sheet was keyed per
 * page while a design spans a whole site: page two of an import had no sheet of its own, so its
 * header and footer rendered unstyled.
 *
 * It papered over the real problem and created a worse one. The fallback was scoped to the SITE,
 * not to the design — with two designs in one site it returned whichever page `readPages` happened
 * to list first, so a band could silently wear a different design's stylesheet, and any utility
 * name the two shared (`px-6`, `grid-cols-3`) rendered with the wrong values. It also meant a page
 * with NO design could capture a neighbour's 50KB sheet, and carrying that into a library entry
 * would then poison the destination site's fallback for every page in it, days later, looking for
 * all the world like a rendering bug.
 *
 * Now each block names its own sheet: a page emits exactly the sheets it uses, and a page with no
 * design blocks emits none. There is nothing left for a fallback to do.
 *
 * ⚠️ NO DRAFT/PUB SPLIT, BY CONSTRUCTION. Sheets are immutable and content-addressed, so there is
 * no second version to promote and no way for content and stylesheet to disagree — publishing the
 * content publishes the reference. That removes the publish/unpublish desync entirely.
 */
export async function sheetsFor(data: unknown): Promise<string> {
  const ids = sheetIdsIn(data);
  if (!ids.length) return "";
  const client = getClient();
  const sheets = await Promise.all(
    ids.map(async (id) => {
      const v = await createKvStore(client, designSheet(id)).read<{ css?: string }>();
      return (v && typeof v.css === "string" ? v.css : "") || "";
    })
  );
  return sheets.filter(Boolean).join("\n");
}

/** Every distinct `props.sheet` in a document's blocks, in first-seen order. */
export function sheetIdsIn(node: unknown, out = new Set<string>()): string[] {
  if (Array.isArray(node)) {
    node.forEach((n) => sheetIdsIn(n, out));
  } else if (node && typeof node === "object") {
    const n = node as Record<string, unknown> & { props?: Record<string, unknown> };
    const sheet = n.props?.sheet;
    if (typeof sheet === "string" && sheet) out.add(sheet);
    if (n.props) Object.values(n.props).forEach((v) => sheetIdsIn(v, out));
    // `content` and `zones` sit beside `props` on the document root, not inside it.
    for (const k of ["content", "zones"]) if (n[k]) sheetIdsIn(n[k], out);
  }
  return [...out];
}

/**
 * Store a compiled stylesheet under its content-addressed id, and archive the markup it came from.
 *
 * ⚠️ WRITE-ONCE. The id IS the hash of the source, so a given id always names the same bytes.
 * Re-writing it would be a no-op at best and, if the compiler had changed, would silently restyle
 * every page pointing at it — so an existing sheet is left alone and reported as a hit. That is
 * also what makes two imports of the same design dedupe for free.
 *
 * The source is stored beside it under the same id. It used to be written in one place, read in
 * one place, and copied by NONE — so every cloned or templated page was permanently
 * un-recompilable, which is the exact thing the archive was added to prevent. Sharing the sheet's
 * id means it now travels wherever the block travels.
 */
export async function writeDesignSheet(
  sheetId: string,
  css: string,
  sourceHtml?: string
): Promise<boolean> {
  const client = getClient();
  const store = createKvStore(client, designSheet(sheetId));
  const existing = await store.read<{ css?: string }>();
  if (!existing?.css) {
    if (!(await store.write({ css: String(css || "") }))) return false;
  }
  if (sourceHtml) {
    const src = createKvStore(client, designSource(sheetId));
    if (!(await src.read<{ html?: string }>())?.html) {
      await src.write({ html: String(sourceHtml), at: new Date().toISOString() });
    }
  }
  return true;
}

/** The archived source markup for a sheet, for re-running the import pipeline on it later. */
export async function readDesignSource(sheetId: string): Promise<string> {
  const v = await createKvStore(getClient(), designSource(sheetId)).read<{ html?: string }>();
  return (v && typeof v.html === "string" ? v.html : "") || "";
}
