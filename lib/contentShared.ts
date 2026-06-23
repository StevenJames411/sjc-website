// Pure, client-safe content helpers — NO server imports (no ioredis), so this module
// is safe to import from client components AND from the API routes / server loaders.
//
// The site's editable state per page is a small JSON doc:
//   { order?: string[],            // section keys in render order (overrides default)
//     texts?: { [tid]: string },   // text overrides keyed by a stable tid; defaults
//                                   // stay in the components, overrides win
//     _pub?: number }              // marker stamped onto a published snapshot

export type SiteDoc = {
  order?: string[];
  texts?: Record<string, string>;
  _pub?: number;
};

const safe = (s: string) => String(s || "").replace(/[^a-z0-9-]/gi, "");

// Upstash key for a page's working draft. Published snapshot = this + "-pub".
export const keyFor = (page: string) => `sjc-site-${safe(page) || "home"}`;

// Resolve the render order: honor the saved order (filtered to keys that still exist),
// then append any newly-added sections that weren't in the saved list. Empty/absent
// override => the component-defined default order.
export function resolveOrder(known: string[], override?: string[]): string[] {
  if (!override || !override.length) return known;
  const valid = override.filter((k) => known.includes(k));
  const missing = known.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}
