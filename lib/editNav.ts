// THE BACK OFFICE'S OWN MENU, AS DATA.
//
// ── WHY ───────────────────────────────────────────────────────────────────────────────────────
// Steven, on the rail: *"the only thing I can't change are the names… I want to be able to edit
// anything. My company name, SJC Studio, all of that. Where do I get to the root of the
// architecture, so I could change things around and call it whatever I want."*
//
// The answer used to be "you can't, it's a hardcoded array in a component." Now it's a document.
//
// ── ⛔ THE LAW THIS FILE EXISTS TO ENFORCE ────────────────────────────────────────────────────
// *"the root has to survive these edits… if you don't design it correctly, when I edit one
// surface, it breaks the back end."*
//
//        THE LABEL IS DECORATION. THE KEY IS IDENTITY.
//
// A stored entry carries a KEY and a LABEL. The key ("invoices") is what maps to a route, and it
// is never typed by a human — it comes from ENTRIES below, in code. The label is whatever Steven
// wants it to say. Rename "Invoices" to "Money out" and the link still goes to /edit/invoices.
//
// If a typed label could decide a destination, one bad keystroke makes a page unreachable — and
// the way back to fix it is the page you just broke. So it structurally cannot.
//
// ── THE MERGE RULE (the board-order lesson, again) ────────────────────────────────────────────
// Code owns WHAT EXISTS. The document owns WHAT IT'S CALLED and WHAT ORDER IT'S IN.
//   · A stored key that code no longer defines is dropped — it points nowhere.
//   · A code key missing from the document is APPENDED, never hidden. Ship a new section next
//     month and it turns up in his rail on its own, even though his saved menu predates it.
// Silently hiding a new surface is how /edit/brand and /edit/import ended up reachable only by
// typing the URL. Not twice.
import { getClient } from "./store";

const KEY = "sjc-edit-nav";

export type NavEntry =
  | { type: "section"; key: string; label: string }
  | { type: "item"; key: string; label: string; href: string };

/**
 * WHAT EXISTS. Keys and hrefs are code; the labels here are only DEFAULTS.
 *
 * ⚠️ Adding a surface? Add it here and it appears in the rail — including for a Steven who
 * rearranged his menu six months ago. That is the whole point of the merge above.
 */
export const ENTRIES: NavEntry[] = [
  { type: "item", key: "websites", label: "Websites", href: "/edit" },
  { type: "section", key: "watch", label: "Watch" },
  { type: "item", key: "board", label: "The board", href: "/edit/board" },
  { type: "section", key: "money", label: "Money" },
  { type: "item", key: "invoices", label: "Invoices", href: "/edit/invoices" },
  { type: "section", key: "library", label: "Library" },
  { type: "item", key: "forms", label: "Forms", href: "/edit/forms" },
  { type: "item", key: "brand", label: "Brand", href: "/edit/brand" },
  { type: "item", key: "import", label: "Import a design", href: "/edit/import" },
];

export const DEFAULT_BRAND = "SJC Studio";
export const DEFAULT_MAINLINE = {
  title: "The mainline",
  subtitle: "Everything every client rides on — one break hits all of them",
};

export type NavDoc = {
  brand: string;
  entries: NavEntry[];
  /**
   * The board's shared row. It lives here rather than on the board because it is the same KIND of
   * thing as the rail's labels — a name Steven should own — and one editor beats two.
   *
   * ⚠️ Its identity is the key `_sjc` in app/edit/board/groups.ts, which nothing here can touch.
   */
  mainline: { title: string; subtitle: string };
};

const DEFAULT_DOC: NavDoc = {
  brand: DEFAULT_BRAND,
  entries: ENTRIES,
  mainline: DEFAULT_MAINLINE,
};

/** A flat, ordered menu: sections and items in one list, so "move it past that heading" just works. */
export function mergeNav(stored: Partial<NavDoc> | null): NavDoc {
  if (!stored) return DEFAULT_DOC;

  const byKey = new Map(ENTRIES.map((e) => [`${e.type}:${e.key}`, e]));
  const seen = new Set<string>();
  const entries: NavEntry[] = [];

  for (const raw of Array.isArray(stored.entries) ? stored.entries : []) {
    const id = `${raw?.type}:${raw?.key}`;
    const def = byKey.get(id);
    if (!def || seen.has(id)) continue; // unknown or duplicate — code decides what exists
    seen.add(id);
    const label = typeof raw.label === "string" ? raw.label : def.label;
    // ⛔ href comes from `def`, never from the document. This line is the law.
    entries.push(def.type === "item" ? { ...def, label } : { type: "section", key: def.key, label });
  }

  // Anything code knows about that the document didn't mention, in code order, at the end.
  for (const def of ENTRIES) {
    if (!seen.has(`${def.type}:${def.key}`)) entries.push(def);
  }

  return {
    brand: typeof stored.brand === "string" && stored.brand.trim() ? stored.brand : DEFAULT_BRAND,
    entries,
    mainline: {
      title: stored.mainline?.title?.trim() || DEFAULT_MAINLINE.title,
      subtitle: stored.mainline?.subtitle?.trim() || DEFAULT_MAINLINE.subtitle,
    },
  };
}

export async function readNav(): Promise<NavDoc> {
  try {
    const kv = getClient();
    const raw = kv ? await kv.get(KEY) : null;
    if (!raw) return DEFAULT_DOC;
    return mergeNav(typeof raw === "string" ? JSON.parse(raw) : raw);
  } catch {
    // A menu that can't be read must never take the back office down — fall back to code.
    return DEFAULT_DOC;
  }
}

export async function writeNav(doc: Partial<NavDoc>): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  // Stored through the merge, so what lands in the store is already normalised: known keys only,
  // hrefs from code. A hand-edited or half-written document cannot poison the next read.
  const clean = mergeNav(doc);
  await kv.set(KEY, JSON.stringify({ ...clean, updatedAt: new Date().toISOString() }));
  return true;
}

/** Back to the code defaults. The way out of a menu renamed into a corner at 11pm. */
export async function resetNav(): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  await kv.set(KEY, JSON.stringify({ ...DEFAULT_DOC, updatedAt: new Date().toISOString() }));
  return true;
}
