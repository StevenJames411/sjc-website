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
import { siteKeys, SJC } from "./siteKeys";
import { readPages } from "./pageRegistry";

/**
 * A page's storage key.
 *
 * `siteId` defaults to SJC so the pre-existing callers that only ever knew about one website keep
 * working untouched. New code should always pass it explicitly.
 */
export const puckKey = (page: string, pub = false, siteId: string = SJC) =>
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

export async function readPuckPublished(page: string, siteId: string = SJC): Promise<Data | null> {
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
export async function readPuckDraft(page: string, siteId: string = SJC): Promise<Data | null> {
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
export async function readDesignCss(page: string, siteId: string = SJC): Promise<string> {
  const read = async (slug: string, pub: boolean) => {
    const store = createKvStore(getClient(), siteKeys(siteId).designCss(slug, pub));
    const v = await store.read<{ css?: string }>();
    return (v && typeof v.css === "string" ? v.css : "") || "";
  };
  const own = async () => {
    if (await previewRequested()) {
      const draft = await read(page, false);
      if (draft) return draft;
    }
    return read(page, true);
  };

  const mine = await own();
  if (mine) return mine;

  // ── WHY A BOUGHT DESIGN COULD ONLY EVER BE ONE PAGE ───────────────────────────────────────
  // The stylesheet is compiled AT IMPORT and stored per page. An import creates exactly one page,
  // so page two has no stylesheet — and since the header and footer are sections of that design,
  // a second page rendered with its nav and footer completely unstyled. Nobody added one twice.
  //
  // Every page of one bought design shares that design's CSS, so falling back to a sibling's is
  // correct rather than a patch: the rules are all scoped under .sjc-design and keyed off classes
  // in the markup, so a sibling's sheet styles this page's header and footer identically.
  //
  // Only reached when the page has none of its own, so an imported page keeps using exactly the
  // stylesheet it was compiled with.
  for (const p of await readPages(siteId)) {
    if (p.slug === page) continue;
    const sibling = await read(p.slug, true);
    if (sibling) return sibling;
  }
  return "";
}

/**
 * The DRAFT stylesheet, explicitly — no preview-mode logic.
 *
 * ⚠️ Publish must use this, not readDesignCss(). That one consults preview mode, which is false
 * in an API request, so it would read the PUBLISHED key — the very key publish is about to write.
 * Publishing would then copy the old (usually empty) stylesheet over itself and report success.
 */
export async function readDesignCssDraft(page: string, siteId: string = SJC): Promise<string> {
  const store = createKvStore(getClient(), siteKeys(siteId).designCss(page, false));
  const v = await store.read<{ css?: string }>();
  return (v && typeof v.css === "string" ? v.css : "") || "";
}

/** Store a page's compiled design stylesheet. Draft by default, like everything else. */
export async function writeDesignCss(
  page: string,
  css: string,
  pub = false,
  siteId: string = SJC
): Promise<boolean> {
  const store = createKvStore(getClient(), siteKeys(siteId).designCss(page, pub));
  return store.write({ css: String(css || "") });
}
