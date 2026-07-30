import { resolveColorOr } from "@/lib/brandColor";
// A "what you get" list: coloured dot, bold line, supporting line. Add/remove/reorder rows in
// the builder. Generic on purpose — works for features, inclusions, deliverables, any page.

export type CheckListRow = { heading: string; body: string };
export type CheckListProps = { dotColor?: string; rows?: CheckListRow[] };

export const CHECKLIST_DEFAULTS: CheckListProps = {
  dotColor: "#22c55e",
  rows: [
    { heading: "First thing", body: "What it means for them, in a sentence." },
    { heading: "Second thing", body: "What it means for them, in a sentence." },
  ],
};

export default function CheckList({ dotColor, rows }: CheckListProps) {
  const list = Array.isArray(rows) ? rows : [];
  return (
    <div className="space-y-8">
      {list.map((row, i) => (
        <div key={i} className="flex gap-4">
          <span
            aria-hidden
            className="mt-1 h-6 w-6 shrink-0 rounded-full"
            style={{ backgroundColor: resolveColorOr(dotColor, "#22c55e") }}
          />
          <div>
            {row?.heading ? (
              <h3 className="text-lg font-bold text-[color:var(--color-sjc-ink)] md:text-xl">
                {row.heading}
              </h3>
            ) : null}
            {row?.body ? (
              <p className="mt-1 text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg">
                {row.body}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
