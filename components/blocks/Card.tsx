// Generic white card. Deliberately NOT page-specific — drop it into a Columns slot to build a
// 3-across row (the "how it works" steps, a feature row, anything), or use it on its own.
// A numbered badge OR a small eyebrow label, whichever the row needs; leave both blank for a
// plain card. Reusable on any page — that's the point.
//
// EVERY optional prop below defaults to blank/false, and blank renders exactly the card this
// component rendered before they existed. Nothing already built moves.
import Icon from "./Icon";
import { resolveColor, resolveColorOr, tint } from "@/lib/brandColor";

export type CardProps = {
  badge?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  // A large icon above the heading — a calendar for "check in", a bath for "wash". A card with
  // a picture in it reads as designed; a card with only words reads as a template.
  icon?: string;
  iconColor?: string;
  // Per-card badge colour. A three-step row where each step is a different colour is one of the
  // biggest cheap wins in a design; one flat blue for all three is the giveaway.
  badgeColor?: string;
  // "edge" floats the badge half-outside the card's top border, centred — the treatment good
  // designs use for numbered steps. "" leaves it inline at the top-left, as before.
  badgePosition?: string;
  centered?: boolean;
  // "row" puts the icon on the LEFT with the text beside it — the contact-detail treatment
  // (a tinted circle, a bold label, the value under it). "" is the original stacked card.
  layout?: string;
  // Drop the white box + shadow, for rows that sit directly on a coloured band.
  bare?: boolean;

  // TYPE CONTROLS (added 2026-07-30). The card's three text lines had fixed size and colour,
  // so making an eyebrow bigger meant deleting it and stacking a separate Text box on top of
  // the card — a workaround that then has to be re-done every time the row is touched.
  // 0 / "" means "use the card's built-in styling", so every card already on a page is
  // untouched by this.
  eyebrowSize?: number;
  eyebrowColor?: string;
  headingSize?: number;
  headingColor?: string;
  bodySize?: number;
  bodyColor?: string;

  // BOLD PER LINE (2026-07-30). Once size is adjustable, "heading" vs "body" is really just
  // weight — so weight becomes its own switch rather than something you pick a field to get.
  // undefined keeps each line's original weight (eyebrow bold, heading bold, body normal), so
  // every card already on a page renders exactly as before.
  eyebrowBold?: boolean;
  headingBold?: boolean;
  bodyBold?: boolean;

  // The top line was force-uppercased with wide letter-spacing, which is an eyebrow label's
  // look and nothing else. undefined keeps it, so nothing already built changes.
  eyebrowCaps?: boolean;

  // ── SURFACE (2026-07-31) ────────────────────────────────────────────────────────────────────
  // The single biggest visual gap between this card and the one a bought design draws. Theirs
  // sits on a dark band as a translucent pane — a hint of background showing through, a 1px
  // light border, a blurred backdrop, and a lift on hover. Ours was an opaque white box with a
  // soft shadow, which is why a hand-built row next to an imported one announced itself
  // instantly no matter how well the colours were matched.
  //
  // "" keeps the original white box, so every card already on a page is untouched.
  //   "glass"   — translucent + backdrop blur + hairline border. For dark bands.
  //   "outline" — no fill, just a border. For light bands.
  surface?: string;
  /** Tint of the glass/outline shell. Blank = white (i.e. a light pane on a dark band). */
  surfaceColor?: string;
  /**
   * How solid the glass is, 0–100. Blank = 7.
   *
   * ⚠️ THE NUMBER IS THE WHOLE EFFECT. A design writes `bg-[#1E293B]/50` — the card's own colour
   * at HALF opacity. Rendering that at a hardcoded 7% over a dark band produces a pane you
   * cannot see, which is exactly what "the cards are dark on dark" looks like.
   */
  surfaceOpacity?: number;
  /**
   * The hairline. Blank = white.
   *
   * ⚠️ SEPARATE FROM THE FILL ON PURPOSE. Designs use `bg-[#1E293B]/50 border-white/5` — a dark
   * translucent fill with a LIGHT edge. Deriving the border from the fill colour gave a dark
   * border on a dark card, so the pane had no edge and stopped reading as glass.
   */
  borderColor?: string;
  /** Coloured glow under the card. Blank = the plain soft shadow. */
  shadowColor?: string;
  /** Lift and brighten the border on hover — what makes a grid of cards feel alive. */
  hoverLift?: boolean;
  /**
   * The edge colour on hover. Blank = the edge doesn't change.
   *
   * Designs pair a nearly-invisible resting edge with an ACCENT edge on hover
   * (`border-white/5 hover:border-[#00D9FF]/40`). That change is most of what makes a grid of
   * cards feel alive, and it can't be done with an inline style — hence the class + variable.
   */
  hoverBorderColor?: string;
  /** Corner radius in px. 0/blank = the built-in rounded-2xl (16px). */
  radius?: number;
};

export const CARD_DEFAULTS: CardProps = {
  badge: "",
  eyebrow: "",
  heading: "New card",
  body: "A sentence or two about this one.",
  icon: "",
  iconColor: "",
  badgeColor: "",
  badgePosition: "",
  centered: false,
  layout: "",
  bare: false,
  eyebrowSize: 0,
  eyebrowColor: "",
  headingSize: 0,
  headingColor: "",
  bodySize: 0,
  bodyColor: "",
  eyebrowBold: true,
  headingBold: true,
  bodyBold: false,
  eyebrowCaps: true,
  surface: "",
  surfaceColor: "",
  surfaceOpacity: 0,
  borderColor: "",
  hoverBorderColor: "",
  shadowColor: "",
  hoverLift: false,
  radius: 0,
};

/** px override when set, otherwise let the Tailwind class decide. */
const sizeOf = (n?: number) => (n && n > 0 ? `${n}px` : undefined);

/** Explicit choice wins; undefined falls back to that line's original weight. */
const weight = (chosen: boolean | undefined, wasBold: boolean) =>
  (chosen ?? wasBold) ? "font-bold" : "font-normal";

export default function Card({
  badge,
  eyebrow,
  heading,
  body,
  icon,
  iconColor,
  badgeColor,
  badgePosition,
  centered,
  layout,
  bare,
  eyebrowSize,
  eyebrowColor,
  headingSize,
  headingColor,
  bodySize,
  bodyColor,
  eyebrowBold,
  headingBold,
  bodyBold,
  eyebrowCaps,
  surface,
  surfaceColor,
  surfaceOpacity,
  borderColor,
  shadowColor,
  hoverLift,
  hoverBorderColor,
  radius,
}: CardProps) {
  const onEdge = badgePosition === "edge" && !!badge;
  const align = centered ? "text-center items-center" : "";

  // ── THE SHELL ───────────────────────────────────────────────────────────────────────────────
  // Three looks off one switch. Blank is the original white box, so a card saved before any of
  // this existed renders byte-identical.
  const glassy = surface === "glass" || surface === "outline";
  const tone = resolveColorOr(surfaceColor, "#ffffff");
  const fillPct = typeof surfaceOpacity === "number" && surfaceOpacity > 0 ? surfaceOpacity : 7;
  const edge = resolveColorOr(borderColor, "#ffffff");

  const shell = bare
    ? "h-full"
    : glassy
      ? `h-full p-7${hoverLift ? " transition-all duration-500 hover:-translate-y-2" : ""}${
          hoverBorderColor ? " sjc-hover-edge" : ""
        }`
      : `h-full rounded-2xl bg-white p-7 shadow-sm${
          hoverLift ? " transition-all duration-500 hover:-translate-y-2 hover:shadow-lg" : ""
        }`;

  // Inline because these are colour-derived and can't be utility classes. `color-mix` is what
  // lets one picked colour produce both the translucent fill and the hairline border, so the
  // card stays a single decision rather than three.
  const shellStyle: React.CSSProperties | undefined = bare
    ? undefined
    : {
        ...(radius ? { borderRadius: `${radius}px` } : glassy ? { borderRadius: "16px" } : {}),
        // ⚠️ tint() takes a PERCENTAGE (0–100), not a fraction — 0.07 here is 0.07%, which is
        // invisible and reads as "the glass setting does nothing".
        ...(glassy
          ? {
              backgroundColor: surface === "outline" ? "transparent" : tint(tone, fillPct),
              border: `1px solid ${tint(edge, 12)}`,
              backdropFilter: surface === "glass" ? "blur(16px)" : undefined,
            }
          : {}),
        ...(shadowColor
          ? { boxShadow: `0 18px 40px -12px ${tint(resolveColor(shadowColor), 35)}` }
          : {}),
        ...(hoverBorderColor
          ? ({ ["--sjc-hover-edge"]: tint(resolveColor(hoverBorderColor), 40) } as React.CSSProperties)
          : {}),
      };

  // Icon left, text right — a contact detail rather than a feature card.
  if (layout === "row") {
    return (
      <div className={`${shell} flex items-start gap-4`} style={shellStyle}>
        {icon ? (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: tint(iconColor, 12), color: resolveColorOr(iconColor, "#2563eb") }}
          >
            <Icon name={icon} size={20} />
          </span>
        ) : null}
        <div>
          {heading ? (
            <p
              className={weight(headingBold, true)}
              style={{
                fontSize: sizeOf(headingSize),
                color: resolveColorOr(headingColor, "var(--color-sjc-ink)"),
              }}
            >
              {heading}
            </p>
          ) : null}
          {body ? (
            <p
              className={`mt-0.5 ${weight(bodyBold, false)}`}
              style={{
                fontSize: sizeOf(bodySize),
                color: resolveColorOr(bodyColor, "var(--color-sjc-mute)"),
              }}
            >
              {body}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const badgeEl = badge ? (
    <span
      className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
      style={{ backgroundColor: resolveColorOr(badgeColor, "var(--color-sjc-blue)") }}
    >
      {badge}
    </span>
  ) : null;

  return (
    <div
      // Extra top padding + visible overflow only when a badge is floating on the edge, so a
      // normal card keeps its exact original box.
      className={`relative ${shell} ${onEdge ? "mt-6 pt-10" : ""}`}
      style={shellStyle}
    >
      {onEdge ? (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">{badgeEl}</div>
      ) : (
        badgeEl
      )}

      <div className={`flex flex-col ${align}`}>
        {icon ? (
          <span
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: tint(iconColor, glassy ? 10 : 8),
              color: resolveColorOr(iconColor, "#2563eb"),
              // The tile's own hairline. A bought design draws it in the accent
              // (`bg-[#00D9FF]/10 border border-[#00D9FF]/20`) and it is a surprising amount of
              // what reads as "expensive" — without it the icon floats on a flat patch.
              // Glass-only so every white-box card already on a page is untouched.
              ...(glassy ? { border: `1px solid ${tint(iconColor, 20)}` } : {}),
            }}
          >
            <Icon name={icon} size={26} />
          </span>
        ) : null}

        {eyebrow ? (
          // The size class is dropped when an explicit size is set, otherwise Tailwind's
          // text-xs would fight the inline style. Same pattern on the heading and body.
          <p
            className={`${weight(eyebrowBold, true)} ${(eyebrowCaps ?? true) ? "uppercase tracking-[0.14em]" : ""} ${eyebrowSize ? "" : "text-xs"}`}
            style={{
              fontSize: sizeOf(eyebrowSize),
              color: resolveColorOr(eyebrowColor, "var(--color-sjc-blue)"),
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        {heading ? (
          <h3
            className={`${weight(headingBold, true)} leading-snug ${headingSize ? "" : "text-lg md:text-xl"} ${
              icon ? "" : badge && !onEdge ? "mt-5" : eyebrow ? "mt-3" : ""
            }`}
            style={{
              fontSize: sizeOf(headingSize),
              color: resolveColorOr(headingColor, "var(--color-sjc-ink)"),
            }}
          >
            {heading}
          </h3>
        ) : null}

        {body ? (
          <p
            className={`mt-3 leading-relaxed ${weight(bodyBold, false)} ${bodySize ? "" : "text-base"}`}
            style={{
              fontSize: sizeOf(bodySize),
              color: resolveColorOr(bodyColor, "var(--color-sjc-mute)"),
            }}
          >
            {body}
          </p>
        ) : null}
      </div>
    </div>
  );
}
