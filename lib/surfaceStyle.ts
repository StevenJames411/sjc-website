// ONE set of looks, for ANY box on the page.
//
// ── WHY THIS IS SHARED AND NOT PER-ELEMENT ────────────────────────────────────────────────────
// A photo frame, a button, a pill and a card are the same thing wearing different names: a box
// with a fill, corners, a band around it, a glow under it, and something that happens on hover.
// Bolting those controls onto each element type separately means writing the same six controls
// three times, watching them drift apart, and teaching three slightly different panels for what
// is one idea. That is exactly what makes the block editors Steven has tried feel clumsy.
//
// So the controls live here once, and each element type just says "I'm a surface, here's my
// selector". Webflow and Framer work this way — click anything, get the same panel.
//
// ⚠️ EVERY VALUE IS OPTIONAL AND BLANK MEANS UNTOUCHED. These styles land on top of a bought
// design that already looks finished. A default that isn't "leave it alone" would repaint the
// page the moment the block rendered.
import { resolveColor } from "./brandColor";

export type Surface = {
  /** Background. A brand role, a `custom:#hex`, or blank to keep the design's own. */
  fill?: string;
  /** 0–100. Below 100 makes the FILL see-through without fading the text on top of it. */
  fillOpacity?: number | null;
  /** Corner radius in px. 0 = square, large = pill. */
  corners?: number | null;
  bandWidth?: number | null;
  bandColor?: string;
  glowColor?: string;
  glowSize?: number | null;
  textColor?: string;
  /** What changes while the mouse is over it. Blank = no change. */
  hoverFill?: string;
  hoverText?: string;
  /** "" | "pulse" | "lift" */
  motion?: string;
};

/** The name of the shared pulse animation, and its definition. Emitted once per section. */
export const PULSE_NAME = "sjc-pulse";
export const PULSE_KEYFRAMES =
  `@keyframes ${PULSE_NAME}{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}`;

/**
 * Make a fill see-through WITHOUT fading what sits on top of it.
 *
 * ⚠️ `opacity` would be the obvious answer and it is the wrong one: it fades the element AND
 * everything inside it, so a half-transparent button gets half-transparent label text and reads as
 * disabled. `color-mix` dilutes only the colour, so the fill goes glassy and the words stay solid.
 */
function translucent(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${Math.max(0, Math.min(100, pct))}%, transparent)`;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * The CSS for one surface. `sel` is the selector that reaches it — an attribute the importer
 * already stamped on the element, never a guess at the design's own class names.
 *
 * Returns "" when nothing was set, so a caller can skip emitting an empty rule.
 */
export function surfaceCss(sel: string, s: Surface | undefined): string {
  if (!s) return "";

  const fill = resolveColor(s.fill);
  const opacity = num(s.fillOpacity);
  const corners = num(s.corners);
  const bandW = num(s.bandWidth);
  const bandC = resolveColor(s.bandColor);
  const glowC = resolveColor(s.glowColor);
  const glowS = num(s.glowSize);
  const text = resolveColor(s.textColor);
  const hoverFill = resolveColor(s.hoverFill);
  const hoverText = resolveColor(s.hoverText);
  const pulse = s.motion === "pulse";
  const lift = s.motion === "lift";

  const base: string[] = [];
  if (fill) base.push(`background:${opacity !== null && opacity < 100 ? translucent(fill, opacity) : fill}`);
  if (corners !== null) base.push(`border-radius:${corners}px`);
  // A band with no colour would draw the browser's default (black); a colour with no width would
  // draw nothing. Either one alone is a control that appears to do nothing, so each implies a
  // sensible partner.
  if (bandW !== null || bandC) {
    base.push(`border:${bandW ?? 1}px solid ${bandC || "currentColor"}`);
  }
  if (glowC) base.push(`box-shadow:0 0 ${glowS ?? 24}px ${glowC}`);
  if (text) base.push(`color:${text}`);
  if (pulse) base.push(`animation:${PULSE_NAME} 2.4s ease-in-out infinite`);

  const hover: string[] = [];
  // A card that rises under the cursor. Transform only — never top/margin, which would reflow the
  // grid and nudge every card beside it.
  if (lift) hover.push("transform:translateY(-6px)");
  if (hoverFill) hover.push(`background:${opacity !== null && opacity < 100 ? translucent(hoverFill, opacity) : hoverFill}`);
  if (hoverText) hover.push(`color:${hoverText}`);

  // ⚠️ ONE transition declaration, built from everything that actually animates. Emitting a second
  // `transition` in its own rule silently replaces the first — which is what made a lifting card
  // jump instead of glide the first time this was written.
  if (hover.length) {
    const moves = [
      hoverFill ? "background .2s ease" : "",
      hoverText ? "color .2s ease" : "",
      lift ? "transform .2s ease" : "",
      lift ? "box-shadow .2s ease" : "",
    ].filter(Boolean);
    if (moves.length) base.push(`transition:${moves.join(",")}`);
  }

  const out: string[] = [];
  if (base.length) out.push(`${sel}{${base.join(";")}}`);
  if (hover.length) out.push(`${sel}:hover{${hover.join(";")}}`);
  return out.join("");
}

/** True when this surface asks for the shared pulse animation. */
export const wantsPulse = (s?: Surface): boolean => s?.motion === "pulse";
