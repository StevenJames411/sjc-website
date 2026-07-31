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
