import { resolveColorOr } from "@/lib/brandColor";

// One-price box: a big number, a divider, a second number, and a plain-English footnote.
// Both halves are optional — clear the bottom fields and it renders a single price. Generic
// enough for any offer, not just the $795 website.

export type PriceBoxProps = {
  topAmount?: string;
  topNote?: string;
  bottomAmount?: string;
  bottomSuffix?: string;
  bottomNote?: string;
  footnote?: string;
  // ⚠️ THIS WAS A PERMANENT WHITE CARD — the only block in the library with no dark-band switch
  // while ChainStrip/SelfCheck/CheckList all have one. Drop it on a dark band and the numbers
  // vanish. false = the original white card; every box built before this existed stays put.
  onDark?: boolean;
  /** The card's fill. Blank = white, the original card. */
  background?: string;
  /** The price figures' colour. Blank = ink on a light card, white on a dark one. */
  textColor?: string;
  /** px, applies to the top figure (the bottom one scales at 80% of it, matching the built-in
   *  ratio). 0/blank = the original responsive Tailwind sizes. */
  priceSize?: number;
};

export const PRICEBOX_DEFAULTS: PriceBoxProps = {
  topAmount: "$795",
  topNote: "one time, to build it",
  bottomAmount: "$25",
  bottomSuffix: "/month",
  bottomNote: "to host it, run the form, and keep it current",
  footnote:
    "That's the whole price. No contract, no setup fees stacked on top, no packages to pick from. Cancel any time and the site is still yours.",
  onDark: false,
  background: "",
  textColor: "",
  priceSize: 0,
};

export default function PriceBox({
  topAmount,
  topNote,
  bottomAmount,
  bottomSuffix,
  bottomNote,
  footnote,
  onDark,
  background,
  textColor,
  priceSize,
}: PriceBoxProps) {
  const hasBottom = Boolean(bottomAmount || bottomNote);

  // resolveColorOr falls through to the fallback when the field is blank, so an untouched box
  // still resolves to exactly what was hardcoded before: a white card, ink figures, grey notes.
  const bg = resolveColorOr(background, "#ffffff");
  const ink = resolveColorOr(textColor, onDark ? "#ffffff" : "var(--color-sjc-ink)");
  const mute = onDark ? "rgba(255,255,255,.7)" : "var(--color-sjc-mute)";
  const hair = onDark ? "rgba(255,255,255,.16)" : "#e5e7eb"; // #e5e7eb == the old bg-gray-200 divider

  // Only overrides the size when set — otherwise the inline style is `undefined` and React drops
  // it, leaving the original `text-5xl md:text-6xl` / `text-4xl md:text-5xl` classes in charge.
  const topPx = priceSize && priceSize > 0 ? `${priceSize}px` : undefined;
  const bottomPx = priceSize && priceSize > 0 ? `${Math.round(priceSize * 0.8)}px` : undefined;

  return (
    <div className="rounded-2xl p-8 text-center shadow-sm md:p-12" style={{ background: bg }}>
      {topAmount ? (
        <p
          className="text-5xl font-bold tracking-tight md:text-6xl"
          style={{ color: ink, fontSize: topPx }}
        >
          {topAmount}
        </p>
      ) : null}
      {topNote ? (
        <p className="mt-2 text-lg font-semibold" style={{ color: mute }}>
          {topNote}
        </p>
      ) : null}

      {hasBottom ? <div className="mx-auto my-8 h-px w-24" style={{ background: hair }} /> : null}

      {bottomAmount ? (
        <p
          className="text-4xl font-bold tracking-tight md:text-5xl"
          style={{ color: ink, fontSize: bottomPx }}
        >
          {bottomAmount}
          {bottomSuffix ? (
            <span className="text-2xl font-semibold" style={{ color: mute }}>
              {bottomSuffix}
            </span>
          ) : null}
        </p>
      ) : null}
      {bottomNote ? (
        <p className="mt-2 text-lg font-semibold" style={{ color: mute }}>
          {bottomNote}
        </p>
      ) : null}

      {footnote ? (
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed" style={{ color: mute }}>
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
