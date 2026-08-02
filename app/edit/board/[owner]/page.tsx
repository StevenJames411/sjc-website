// ONE OWNER'S BOARD — every joint under one customer, on one page.
//
// The roster (../page.tsx) answers "is anything on fire anywhere." This answers "what exactly is
// wrong with HER machine," which is the question you have the moment the answer to the first one
// is yes. Nothing else belongs here: no other client's tiles, no cross-client rollup.
//
// `owner` is either a site id or the reserved `_sjc` for the global checks that sit under
// everybody. An unknown owner 404s rather than rendering an empty board — an empty board is
// indistinguishable from a healthy one, which is the exact lie this whole system refuses.
//
// Owner-only: /edit/* is gated in middleware.ts.
import Link from "next/link";
import { notFound } from "next/navigation";
import { ageText } from "@/lib/checksShared";
import { readBoardView, summarise, SJC_KEY } from "../groups";
import { Dot, FOOTNOTE, LayerSections, SWATCH } from "../shared";

export const dynamic = "force-dynamic";

export default async function OwnerBoardPage({ params }: { params: Promise<{ owner: string }> }) {
  const { owner } = await params;
  const view = await readBoardView();
  const group = view.groups.find((g) => g.key === owner);
  if (!group) notFound();

  const sw = SWATCH[group.colour];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px 80px" }}>
      <Link href="/edit/board" style={{ fontSize: 14, color: "#4b5563", textDecoration: "none" }}>
        ← The board
      </Link>

      <h1 style={{ fontSize: 32, fontWeight: 800, margin: "18px 0 4px", overflowWrap: "anywhere" }}>
        {group.title}
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 18px" }}>{group.subtitle}</p>

      {/* This owner's one-line verdict, same sentence the roster row shows — so the page you open
          confirms what the row said instead of making you re-read eight tiles to check. */}
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: sw.bg, border: `1px solid ${sw.border}`,
          borderRadius: 999, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, marginBottom: 10,
        }}
      >
        <Dot colour={group.colour} />
        {summarise(group)}
      </div>

      <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 26px" }}>
        {group.rows.length} checks · last sweep {ageText(view.sweptAt)} ·{" "}
        <a href="/api/cron/checks" style={{ color: "#2563eb" }}>run one now</a>
        {group.key !== SJC_KEY && (
          <>
            {" "}· <Link href={`/edit/${group.key}`} style={{ color: "#2563eb" }}>open her website</Link>
          </>
        )}
      </p>

      <LayerSections rows={group.rows} />

      {FOOTNOTE}
    </div>
  );
}
