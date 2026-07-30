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
}: CardProps) {
  const onEdge = badgePosition === "edge" && !!badge;
  const align = centered ? "text-center items-center" : "";
  const shell = bare ? "h-full" : "h-full rounded-2xl bg-white p-7 shadow-sm";

  // Icon left, text right — a contact detail rather than a feature card.
  if (layout === "row") {
    return (
      <div className={`${shell} flex items-start gap-4`}>
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
    >
      {onEdge ? (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">{badgeEl}</div>
      ) : (
        badgeEl
      )}

      <div className={`flex flex-col ${align}`}>
        {icon ? (
          <span
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${onEdge || centered ? "" : ""}`}
            style={{ background: tint(iconColor, 8), color: resolveColorOr(iconColor, "#2563eb") }}
          >
            <Icon name={icon} size={26} />
          </span>
        ) : null}

        {eyebrow ? (
          // The size class is dropped when an explicit size is set, otherwise Tailwind's
          // text-xs would fight the inline style. Same pattern on the heading and body.
          <p
            className={`${weight(eyebrowBold, true)} uppercase tracking-[0.14em] ${eyebrowSize ? "" : "text-xs"}`}
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
