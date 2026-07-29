// Generic white card. Deliberately NOT page-specific — drop it into a Columns slot to build a
// 3-across row (the "how it works" steps, a feature row, anything), or use it on its own.
// A numbered badge OR a small eyebrow label, whichever the row needs; leave both blank for a
// plain card. Reusable on any page — that's the point.
//
// EVERY optional prop below defaults to blank/false, and blank renders exactly the card this
// component rendered before they existed. Nothing already built moves.
import Icon from "./Icon";

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
};

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
}: CardProps) {
  const onEdge = badgePosition === "edge" && !!badge;
  const align = centered ? "text-center items-center" : "";

  const badgeEl = badge ? (
    <span
      className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white shadow-md"
      style={{ backgroundColor: badgeColor || "var(--color-sjc-blue)" }}
    >
      {badge}
    </span>
  ) : null;

  return (
    <div
      // Extra top padding + visible overflow only when a badge is floating on the edge, so a
      // normal card keeps its exact original box.
      className={`relative h-full rounded-2xl bg-white p-7 shadow-sm ${onEdge ? "mt-6 pt-10" : ""}`}
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
            style={{ background: `${iconColor || "#2563eb"}14`, color: iconColor || "#2563eb" }}
          >
            <Icon name={icon} size={26} />
          </span>
        ) : null}

        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--color-sjc-blue)]">
            {eyebrow}
          </p>
        ) : null}

        {heading ? (
          <h3
            className={`text-lg font-bold leading-snug text-[color:var(--color-sjc-ink)] md:text-xl ${
              icon ? "" : badge && !onEdge ? "mt-5" : eyebrow ? "mt-3" : ""
            }`}
          >
            {heading}
          </h3>
        ) : null}

        {body ? (
          <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">{body}</p>
        ) : null}
      </div>
    </div>
  );
}
