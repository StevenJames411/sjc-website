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
   * Every SHIPPED section key this document has ever been merged against.
   *
   * The ledger that lets "he deleted it" and "it didn't exist yet" be told apart. Without it,
   * deleting a shipped group is impossible: the next merge sees a code section missing from the
   * entries and helpfully puts it back, forever.
   */
  knownSections?: string[];
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
  knownSections: ENTRIES.filter((e) => e.type === "section").map((e) => e.key),
  mainline: DEFAULT_MAINLINE,
};

const SAFE_KEY = /^[a-z0-9][a-z0-9-]{0,39}$/;

/**
 * A flat, ordered menu: sections and items in one list, so "move it past that heading" just works.
 *
 * ── ⛔ ITEMS AND SECTIONS ARE NOT THE SAME KIND OF THING ──────────────────────────────────────
 * An ITEM carries a destination, so code owns it absolutely: an item key the code doesn't define
 * is dropped, and the href always comes from ENTRIES. That is the law.
 *
 * A SECTION carries nothing but a word. It links nowhere and breaks nothing, so Steven creates and
 * deletes them freely — "Import a design belongs under Websites, and my brand settings need a
 * Company settings group of their own." A user-made key (`u-…`) is as valid as a shipped one.
 *
 * ── DELETED VS NEW, without resurrecting what he threw away ───────────────────────────────────
 * `knownSections` records every code section key the document has ever seen. A shipped section
 * missing from the entries is one he DELETED — leave it gone. A shipped section that isn't in
 * knownSections is one that didn't exist when he last saved — append it, same as a new item.
 * Without that ledger the two cases are indistinguishable and delete silently stops working.
 */
export function mergeNav(stored: Partial<NavDoc> | null): NavDoc {
  if (!stored) return DEFAULT_DOC;

  const itemDefs = new Map(ENTRIES.filter((e) => e.type === "item").map((e) => [e.key, e]));
  const codeSections = ENTRIES.filter((e) => e.type === "section");
  const seenItems = new Set<string>();
  const seenSections = new Set<string>();
  const entries: NavEntry[] = [];

  for (const raw of Array.isArray(stored.entries) ? stored.entries : []) {
    const key = typeof raw?.key === "string" ? raw.key : "";
    if (!SAFE_KEY.test(key)) continue;
    const label = typeof raw?.label === "string" ? raw.label : "";

    if (raw.type === "section") {
      if (seenSections.has(key)) continue;
      seenSections.add(key);
      entries.push({ type: "section", key, label });
      continue;
    }

    const def = itemDefs.get(key);
    if (!def || seenItems.has(key)) continue; // unknown or duplicate — code decides what exists
    seenItems.add(key);
    // ⛔ href comes from `def`, never from the document. This line is the law.
    entries.push({ ...def, label: label || def.label });
  }

  // Sections shipped SINCE he last saved. Ones he deleted stay deleted — see knownSections above.
  const known = new Set(
    Array.isArray(stored.knownSections) ? stored.knownSections.filter((k) => typeof k === "string") : []
  );
  for (const s of codeSections) {
    if (!known.has(s.key) && !seenSections.has(s.key)) {
      entries.push(s);
      seenSections.add(s.key);
    }
  }

  // Every item code knows about that the document didn't mention, in code order, at the end.
  for (const def of ENTRIES) {
    if (def.type === "item" && !seenItems.has(def.key)) entries.push(def);
  }

  return {
    brand: typeof stored.brand === "string" && stored.brand.trim() ? stored.brand : DEFAULT_BRAND,
    entries,
    // Everything code ships today, whether or not it survived his editing — that is the ledger.
    knownSections: codeSections.map((s) => s.key),
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

// ⛔ THERE IS NO "RESET TO DEFAULTS", DELIBERATELY. Steven, once he had it:
//
//   *"I don't know when I'm ever going to use that, because when I rename everything for the first
//   time, that's kind of the new default. If it saves every update, I don't really need a default
//   setting."*
//
// He is right, and the reason it is SAFE to have no escape hatch is that nothing here can be lost:
// every entry stays visible as a row in edit mode even when its label is empty, so anything typed
// wrong is retyped. A reset button that only ever destroys the user's work is not a safety net.
