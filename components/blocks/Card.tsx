// Generic white card. Deliberately NOT page-specific — drop it into a Columns slot to build a
// 3-across row (the "how it works" steps, a feature row, anything), or use it on its own.
// A numbered badge OR a small eyebrow label, whichever the row needs; leave both blank for a
// plain card. Reusable on any page — that's the point.

export type CardProps = {
  badge?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
};

export const CARD_DEFAULTS: CardProps = {
  badge: "",
  eyebrow: "",
  heading: "New card",
  body: "A sentence or two about this one.",
};

export default function Card({ badge, eyebrow, heading, body }: CardProps) {
  return (
    <div className="h-full rounded-2xl bg-white p-7 shadow-sm">
      {badge ? (
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
          style={{ backgroundColor: "var(--color-sjc-blue)" }}
        >
          {badge}
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
            badge ? "mt-5" : eyebrow ? "mt-3" : ""
          }`}
        >
          {heading}
        </h3>
      ) : null}
      {body ? (
        <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">{body}</p>
      ) : null}
    </div>
  );
}
