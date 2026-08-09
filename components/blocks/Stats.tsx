import { resolveColorOr } from "@/lib/brandColor";

// A row of proof numbers — "40+ YEARS · 100% CUSTOM · 4.9★ RATED".
//
// ── WHY THIS IS A BLOCK AND NOT THREE TEXT BOXES ──────────────────────────────────────────────
// Every bought design has this row, and until now rebuilding one in blocks mode meant a Columns
// block holding six alternating Headings and Texts — twelve fields to fill in, spacing tuned by
// hand, and a row that fell apart the moment somebody added a fourth number. It's the single most
// copied pattern in the designs SJC buys, so it should cost one block and a list.
//
// The numbers carry the page's accent by default because that is what they are for: they are the
// evidence, and they should read as the loudest thing in the band.
export type StatItem = { value: string; label: string };
export type StatsProps = {
  items?: StatItem[];
  /** Colour of the big number. A role, so it follows the brand screen. */
  valueColor?: string;
  /** Blank = the muted grey, which is invisible on a dark band. A role follows the brand. */
  labelColor?: string;
  /** px. 0 = the responsive default, which is what almost every page should use. */
  valueSize?: number;
  align?: "left" | "center";
};

export const STATS_DEFAULTS: StatsProps = {
  items: [
    { value: "40+", label: "Years in business" },
    { value: "100%", label: "Custom built" },
    { value: "4.9★", label: "Customer rating" },
  ],
  valueColor: "accent",
  labelColor: "",
  valueSize: 0,
  align: "center",
};

export default function Stats({ items, valueColor,
  labelColor, valueSize, align = "center" }: StatsProps) {
  const list = (items || []).filter((s) => s && (s.value || s.label));
  if (!list.length) return null;

  return (
    // Auto-fit rather than a fixed column count: three numbers sit in a row, five wrap to two
    // rows, and one centres itself — without anyone choosing a layout. A fixed count is the thing
    // that breaks when a fourth number gets added, which is the whole reason this block exists.
    <div
      style={{
        display: "grid",
        gap: 28,
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        textAlign: align,
      }}
    >
      {list.map((s, i) => (
        <div key={i}>
          <div
            style={{
              // clamp() so the number is big on a laptop and still fits a phone without a
              // breakpoint to maintain. An explicit size overrides it when a design needs one.
              fontSize: valueSize ? `${valueSize}px` : "clamp(28px, 5vw, 44px)",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: resolveColorOr(valueColor, "var(--color-sjc-blue)"),
              fontFamily: "var(--font-heading)",
            }}
          >
            {s.value}
          </div>
          {s.label ? (
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: resolveColorOr(labelColor, "var(--color-sjc-mute)"),
              }}
            >
              {s.label}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
