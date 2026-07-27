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
};

export const PRICEBOX_DEFAULTS: PriceBoxProps = {
  topAmount: "$795",
  topNote: "one time, to build it",
  bottomAmount: "$25",
  bottomSuffix: "/month",
  bottomNote: "to host it, run the form, and keep it current",
  footnote:
    "That's the whole price. No contract, no setup fees stacked on top, no packages to pick from. Cancel any time and the site is still yours.",
};

export default function PriceBox({
  topAmount,
  topNote,
  bottomAmount,
  bottomSuffix,
  bottomNote,
  footnote,
}: PriceBoxProps) {
  const hasBottom = Boolean(bottomAmount || bottomNote);
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm md:p-12">
      {topAmount ? (
        <p className="text-5xl font-bold tracking-tight text-[color:var(--color-sjc-ink)] md:text-6xl">
          {topAmount}
        </p>
      ) : null}
      {topNote ? (
        <p className="mt-2 text-lg font-semibold text-[color:var(--color-sjc-mute)]">{topNote}</p>
      ) : null}

      {hasBottom ? <div className="mx-auto my-8 h-px w-24 bg-gray-200" /> : null}

      {bottomAmount ? (
        <p className="text-4xl font-bold tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
          {bottomAmount}
          {bottomSuffix ? (
            <span className="text-2xl font-semibold text-[color:var(--color-sjc-mute)]">
              {bottomSuffix}
            </span>
          ) : null}
        </p>
      ) : null}
      {bottomNote ? (
        <p className="mt-2 text-lg font-semibold text-[color:var(--color-sjc-mute)]">{bottomNote}</p>
      ) : null}

      {footnote ? (
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
          {footnote}
        </p>
      ) : null}
    </div>
  );
}
