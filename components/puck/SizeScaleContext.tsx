"use client";
import { createContext, useContext } from "react";

// THE SITE'S TEXT SIZES, REACHABLE FROM INSIDE A FIELD PANEL.
//
// ── WHY A CONTEXT ─────────────────────────────────────────────────────────────────────────────
// The size control lives in DesignTextField, which Puck renders as a CUSTOM FIELD. A custom field
// is handed `{ onChange, value }` for its own prop and nothing else — no siblings, no site id, no
// stylesheet. So the panel that edits a headline has no way of knowing that the same size governs
// nine other pages, which is exactly the thing that has to change.
//
// Steven, describing the model this exists to serve: *"the home page always gets built first. I set
// the home page from top to bottom, the rest of the pages should follow… instead of drilling into
// individual pages, you have one edit canvas that lives on top of the entire website."*
//
// The provider sits in PuckEditor, above <Puck>, so every field render inside can reach it.
//
// ⚠️ EMPTY DEFAULT, NOT A THROW. This context is legitimately absent in surfaces that render Puck
// fields outside the site builder. A missing provider must degrade to "no global controls", never
// to a crashed panel — the per-line size control has to keep working either way.

export type SizeIndex = { value: string; selectors: string[] }[];

export type SizeScale = {
  /** Every size the site's stylesheets declare, with the selectors that declare it. */
  index: SizeIndex;
  /** The site's current overrides, keyed by the design's ORIGINAL declared value. */
  scale: Record<string, string>;
  /** How many rules across the whole website use this declared value. */
  places: (declared: string) => number;
  /**
   * Change one declared size everywhere it is used, and publish it.
   * `next` empty = put the design's own size back.
   */
  setGlobal: (declared: string, next: string) => Promise<void>;
  /** "saving" / "saved" / an error, for the panel to show without inventing its own state. */
  status: string;
};

const EMPTY: SizeScale = {
  index: [],
  scale: {},
  places: () => 0,
  setGlobal: async () => {},
  status: "",
};

export const SizeScaleContext = createContext<SizeScale>(EMPTY);
export const useSizeScale = () => useContext(SizeScaleContext);
