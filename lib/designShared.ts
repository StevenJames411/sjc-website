// The one constant shared between the design CSS compiler (server) and the block that renders a
// design (client).
//
// It lives alone because lib/designCss.ts imports node:path and node:fs at module level — pulling
// that into a client component would break the browser build. A single string doesn't need any of
// it.

/**
 * The class every imported design is rendered inside, and the class every rule in its compiled
 * stylesheet is scoped under.
 *
 * ⚠️ IT GOES ON THE BLOCK, NOT ON THE PAGE. Putting it on a page wrapper worked for the public
 * render and left the EDITOR CANVAS unstyled, because the canvas doesn't go through the public
 * page component at all — an imported design looked destroyed in the one place you actually work
 * on it, while `?preview=1` looked perfect.
 *
 * On the block, the scope travels with the content: canvas, preview and live page all style it
 * the same way, and the design's CSS (which carries Tailwind's preflight) can never reach the
 * builder's own buttons and panels.
 */
export const DESIGN_SCOPE = "sjc-design";

/**
 * The class ONE design's compiled stylesheet is scoped under — `sjc-design-<first 8 of its id>`.
 *
 * ⚠️ WHY THE SHARED SCOPE ABOVE IS NOT ENOUGH (2026-08-12). `DESIGN_SCOPE` separates a design from
 * the BUILDER. It does nothing to separate a design from ANOTHER DESIGN: every imported sheet
 * declared its rules under the same `.sjc-design`, so two designs on one page collide rule for
 * rule — identical Tailwind utility names carrying different arbitrary values, `:root` custom
 * properties from both landing on both wrappers, last-in-document-order winning per declaration.
 *
 * It was masked only because the old per-page key meant a page could never emit more than one
 * sheet, so the failure showed up as "the other design's band is unstyled" rather than as a
 * collision. Now that a page emits exactly the sheets its blocks reference, two designs on one page
 * is an ordinary thing to do — so the sheets have to be tellable apart.
 *
 * BOTH classes go on the block: the shared one for the isolation rules DesignSection generates at
 * runtime, this one for the compiled sheet.
 */
export const sheetScope = (sheetId: string) =>
  `${DESIGN_SCOPE}-${String(sheetId || "").slice(0, 8)}`;

/**
 * ⛔ BUMP THIS WHENEVER THE DESIGN COMPILER CHANGES — lib/designCss.ts or lib/designHtml.ts.
 *
 * A sheet's id is a hash of (source markup + Tailwind version + this). Tailwind's version catches
 * an upstream upgrade, but it does NOT catch a fix to OUR pipeline — and this codebase has already
 * had two of those in a fortnight (a comment hiding an `@media` from `scopeCss`, and
 * `revealHiddenStates` stripping a mobile menu's hide state).
 *
 * Without this, a compiler fix leaves every existing page hashing to the SAME id, so
 * `admin/recompile-css` finds nothing to do and reports success while the old broken CSS stays
 * live. Bumping it gives the recompile a new id to move pages onto — which is what makes the fix
 * reach sites already in the database, and is the entire reason the source archive exists.
 */
export const DESIGN_PIPELINE_REV = "2026-08-13.1";
