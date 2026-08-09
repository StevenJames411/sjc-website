import { resolveColorOr } from "@/lib/brandColor";

// THE CHAIN — a customer's path across several steps, with the ones you own lit up.
//
// ⛔ WHY THIS IS A BLOCK AND NOT A SCREENSHOT. A browser frame says "one product". The chain says
// "we own the whole sequence", which is the only thing a parent-brand page has to communicate.
// It is also connective tissue: whichever page someone lands on, they see the same shape and
// where they are inside it.
//
// ⚠️ THE CONNECTOR IS DRAWN ON THE NODE, NOT BETWEEN NODES. A line rendered between items leaves
// an orphan stub hanging off the end of the first row the moment six columns wrap to three on a
// phone. Drawn as a ::before on each node and suppressed on the first, it wraps correctly at any
// column count.

export type ChainNode = { k: string; note?: string; mine?: boolean };
export type ChainStripProps = {
  nodes?: ChainNode[];
  color?: string;
  onDark?: boolean;
};

export const CHAINSTRIP_DEFAULTS: ChainStripProps = {
  color: "accent",
  onDark: true,
  nodes: [
    { k: "Maps", note: "where they start", mine: false },
    { k: "Reviews", note: "the entry fee", mine: true },
    { k: "Website", note: "it confirms", mine: true },
    { k: "Social", note: "rented ground", mine: false },
    { k: "Follow-up", note: "where it leaks", mine: true },
    { k: "Ads", note: "only amplify", mine: true },
  ],
};

export default function ChainStrip({ nodes, color, onDark }: ChainStripProps) {
  const list = Array.isArray(nodes) ? nodes : [];
  const accent = resolveColorOr(color, "var(--color-sjc-accent)");
  // On a dark band the text is white and the connectors are white-at-low-alpha; on a light band
  // both invert. currentColor can't do it — the dim states need their own alpha.
  const ink = onDark ? "#fff" : "var(--color-sjc-ink)";
  const dim = onDark ? "rgba(255,255,255,.42)" : "rgba(0,0,0,.45)";
  const hair = onDark ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.14)";

  return (
    <div className="w-full">
      <style>{`
        .cs-grid{display:grid;grid-template-columns:repeat(6,1fr);width:100%}
        .cs-node{position:relative;text-align:center;padding:0 6px}
        .cs-node::before{content:"";position:absolute;top:9px;left:-50%;width:100%;height:1px;background:var(--cs-hair)}
        .cs-node:first-child::before{display:none}
        @media (max-width:760px){
          .cs-grid{grid-template-columns:repeat(3,1fr);row-gap:34px}
          .cs-node:nth-child(4)::before{display:none}
        }
      `}</style>
      <div className="cs-grid" style={{ ["--cs-hair" as string]: hair }}>
        {list.map((n, i) => (
          <div className="cs-node" key={i}>
            <span
              className="relative z-[2] mx-auto block h-[19px] w-[19px] rounded-full"
              style={
                n?.mine
                  ? { background: accent, boxShadow: `0 0 0 5px color-mix(in srgb, ${accent} 16%, transparent)` }
                  : { background: "transparent", border: `1px solid ${hair}` }
              }
            />
            <div className="mt-4 text-base leading-tight md:text-lg" style={{ color: n?.mine ? ink : dim }}>
              {n?.k}
            </div>
            {n?.note ? (
              <div className="mt-1.5 text-[11px] leading-normal tracking-[0.1em]" style={{ color: dim }}>
                {n.note}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
