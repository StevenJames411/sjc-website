// Put a page's content into a website. The one implementation, shared by every caller.
//
// ── WHY IT IS SHARED ──────────────────────────────────────────────────────────────────────────
// Two things now write a page into a site — `admin/clone-page` and the page library — and a third
// will exist the moment anything else needs to. Each of them has to get the same four things right,
// and each of them is a place to get one of them wrong:
//
//   1. REGISTER THE PAGE FIRST. Writing content for a slug that is not in the registry returns ok,
//      publishes ok, and serves a 404. clone-page was written immediately after hitting that.
//   2. STRIP `_pub`. What lands is a DRAFT until somebody publishes it on purpose.
//   3. SCRUB WHEN THE BUSINESS CHANGES — but not between one business's own sites, or moving a page
//      from `sjc` to `sjc-2026` blanks Steven's own phone number and reads as a bug in the copy.
//   4. NEVER OVERWRITE BY ACCIDENT. See `onExisting`.
//
// ⛔ `onExisting` HAS NO DEFAULT, DELIBERATELY. clone-page's behaviour was to write straight over
// whatever was at the destination slug, and the store's save-guard does not stop it: a full page
// replacing a full page trips no rule. So the destructive path is something a caller has to type,
// rather than what they get for not thinking about it.
import { createKvStore } from "./kvStateStore";
import { getClient } from "./store";
import { puckKey, sheetIdsIn } from "./puckContent";
import { readPages, createPage } from "./pageRegistry";
import { findSite } from "./sites";
import { scrubForTransfer, sameBusiness } from "./transferScrub";
import type { ScrubReport } from "./transferScrub";

export type PlaceResult =
  | {
      ok: true;
      slug: string;
      blocks: number;
      sheets: string[];
      scrubbed: ScrubReport | null;
      created: boolean;
    }
  | { ok: false; status: 400 | 409; error: string };

export async function placePage(opts: {
  /** The page content to write. `_pub` is stripped for you. */
  data: Record<string, unknown>;
  /** The site the content came FROM, for the scrub. Null when it came from a library entry. */
  fromSite: string | null;
  toSite: string;
  /** Desired slug. A page is created if the site has not got one. */
  toPage: string;
  /** Title used only when the page has to be created. Defaults to the slug, prettified. */
  title?: string;
  onExisting: "refuse" | "overwrite";
}): Promise<PlaceResult> {
  const { data, fromSite, toSite, toPage, onExisting } = opts;

  const pages = await readPages(toSite);
  const exists = pages.some((p) => p.slug === toPage);
  if (exists && onExisting === "refuse") {
    return {
      ok: false,
      status: 409,
      error: `${toSite} already has a page called "${toPage}". Choose another name.`,
    };
  }

  let slug = toPage;
  let created = false;
  if (!exists) {
    // ⚠️ createPage(title, siteId) — TITLE FIRST. Both are strings, so getting this backwards
    // typechecks cleanly and creates a page named after the site, in a site named after the page.
    const title =
      opts.title || toPage.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const made = await createPage(title, toSite);
    if (!made.ok || !made.slug) {
      return { ok: false, status: 400, error: made.error || "could not create the destination page" };
    }
    slug = made.slug;
    created = true;
  }

  const stripped = { ...data };
  delete stripped._pub;

  // Scrub only when the business actually changes. A library entry has no source site to compare
  // against and was already scrubbed on the way in, so it passes through untouched.
  let clean: Record<string, unknown> = stripped;
  let scrubbed: ScrubReport | null = null;
  if (fromSite) {
    const [src, dst] = await Promise.all([findSite(fromSite), findSite(toSite)]);
    if (src && dst && !sameBusiness(src, dst)) {
      const out = scrubForTransfer(stripped, src);
      clean = out.value as Record<string, unknown>;
      scrubbed = out.report;
    }
  }

  const store = createKvStore(getClient(), puckKey(slug, false, toSite));
  const wrote = await store.writeResult(clean);
  if (!wrote.ok) {
    return { ok: false, status: 409, error: wrote.reason || "content write refused" };
  }

  return {
    ok: true,
    slug,
    blocks: Array.isArray(clean.content) ? (clean.content as unknown[]).length : 0,
    // Which stylesheets the placed page references. Global and immutable, so nothing was copied —
    // but a page that renders unstyled should be able to say which sheet it was looking for.
    sheets: sheetIdsIn(clean),
    scrubbed,
    created,
  };
}
