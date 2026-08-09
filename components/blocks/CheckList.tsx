import { resolveColor, resolveColorOr } from "@/lib/brandColor";
// A "what you get" list: coloured dot, bold line, supporting line. Add/remove/reorder rows in
// the builder. Generic on purpose — works for features, inclusions, deliverables, any page.

export type CheckListRow = { heading: string; body: string };
// ⚠️ textColor exists because this list hardcoded ink — invisible the first time one was placed
// on a dark band. Blank still means ink, so every list already saved renders unchanged.
export type CheckListProps = { dotColor?: string; textColor?: string; rows?: CheckListRow[] };

// ⚠️ A DEFAULT IS A HEX YOU CAN'T EDIT. Every block added from now on carries this value, and a
// literal one would be frozen the moment it lands — the brand screen can't reach it, and neither
// can the re-skin route unless someone remembers to add it to a map. A ROLE follows the palette.
export const CHECKLIST_DEFAULTS: CheckListProps = {
  dotColor: "secondary",
  rows: [
    { heading: "First thing", body: "What it means for them, in a sentence." },
    { heading: "Second thing", body: "What it means for them, in a sentence." },
  ],
};

export default function CheckList({ dotColor, textColor, rows }: CheckListProps) {
  const list = Array.isArray(rows) ? rows : [];
  const head = resolveColorOr(textColor, "var(--color-sjc-ink)");
  // The supporting line always sits a step back from the bold one. On a white text colour that
  // means translucent white, not the muted grey that only works on a pale ground.
  const sub = textColor === "white" ? "rgba(255,255,255,.7)" : resolveColor(textColor) || "var(--color-sjc-mute)";
  return (
    <div className="space-y-8">
      {list.map((row, i) => (
        <div key={i} className="flex gap-4">
          <span
            aria-hidden
            className="mt-1 h-6 w-6 shrink-0 rounded-full"
            style={{ backgroundColor: resolveColorOr(dotColor, "var(--color-sjc-secondary)") }}
          />
          <div>
            {row?.heading ? (
              <h3 className="text-lg font-bold md:text-xl" style={{ color: head }}>
                {row.heading}
              </h3>
            ) : null}
            {row?.body ? (
              <p className="mt-1 text-base leading-relaxed md:text-lg" style={{ color: sub }}>
                {row.body}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
