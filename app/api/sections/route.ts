// The section library: keep a band you like, drop it onto any other page.
//
// ── WHY ──────────────────────────────────────────────────────────────────────────────────────
// "Save as template" copies a WHOLE PAGE, which is the wrong grain for the thing that actually
// repeats. What repeats is one band — the reviews strip, the guarantee, the numbers row, the
// contact section with the form already wired. Rebuilding that by hand on every client site is
// the slow part of a build, and the copy is never quite the same twice.
//
//   GET                          -> { ok, sections: [{ id, name, type, savedAt }] }
//   POST { name, block }         -> { ok, id }        save the selected block
//   DELETE ?id=                  -> { ok }
//
// ⚠️ SHARED ACROSS EVERY SITE, deliberately — one library, not one per client. That is the whole
// point: a band proven on one build is available on the next.
//
// ⚠️ WHICH MEANS IT MUST NOT CARRY A BUSINESS'S DETAILS. A section saved from a live client site
// holds their phone number, their photos and — the one that ends relationships — their lead
// form's `source`, the tag deciding whose inbox an enquiry lands in. Saving strips it, the same
// way make-template does, rather than trusting whoever clicks Save to have checked.
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";

export const dynamic = "force-dynamic";

const KEY = "sjc-section-library";

type Saved = {
  id: string;
  name: string;
  type: string;
  savedAt: string;
  block: Record<string, unknown>;
};

const store = () => createKvStore(getClient(), KEY);
const readAll = async (): Promise<Saved[]> => (await store().read<Saved[]>()) || [];

/**
 * Blank every lead form's `source` in a saved section.
 *
 * ⚠️ THE ONE THAT ENDS RELATIONSHIPS. `source` is the tag that says whose lead this is. A section
 * carrying one is inherited by every site it is dropped onto, and two clients' enquiries become
 * indistinguishable — client A's enquiry landing in client B's pile. Same rule and same reason as
 * make-template's blankLeadSources.
 */
function blankLeadSources(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(blankLeadSources);
  if (!node || typeof node !== "object") return;
  const n = node as { type?: string; props?: Record<string, unknown> };
  if (n.type === "LeadForm" && n.props && typeof n.props.source === "string") n.props.source = "";
  if (n.props) Object.values(n.props).forEach(blankLeadSources);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const all = await readAll();

  // One section's full contents, asked for only at the moment it's being inserted.
  if (id && url.searchParams.get("full")) {
    const hit = all.find((s) => s.id === id);
    if (!hit) return Response.json({ ok: false, error: "no such section" }, { status: 404 });
    return Response.json({ ok: true, block: hit.block });
  }

  // The blocks themselves are deliberately left out of the list: a library of twenty sections is
  // megabytes, and a picker only needs names.
  return Response.json({
    ok: true,
    sections: all.map(({ id: sid, name, type, savedAt }) => ({ id: sid, name, type, savedAt })),
  });
}

export async function POST(req: Request) {
  let body: { name?: string; block?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const block = body?.block;
  if (!name) return Response.json({ ok: false, error: "Give it a name." }, { status: 400 });
  if (!block?.type) return Response.json({ ok: false, error: "No section selected." }, { status: 400 });

  const copy = JSON.parse(JSON.stringify(block)) as Record<string, unknown>;
  blankLeadSources(copy);
  // The id must be re-minted when it's inserted, not carried: two blocks sharing an id are ONE
  // node to Puck, and the page renders the last one's content in every slot. Dropped here so the
  // insert side is forced to mint a fresh one rather than inheriting a stale one.
  if (copy.props && typeof copy.props === "object") {
    delete (copy.props as Record<string, unknown>).id;
  }

  const all = await readAll();
  const id = `sec-${all.length + 1}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)}`;
  const saved: Saved = {
    id,
    name,
    type: String(copy.type || "Section"),
    // Stamped server-side: a client clock can be anything at all.
    savedAt: new Date().toISOString(),
    block: copy,
  };

  if (!(await store().write([saved, ...all]))) {
    return Response.json({ ok: false, error: "Couldn't save that section." }, { status: 500 });
  }
  return Response.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ ok: false, error: "which section?" }, { status: 400 });
  const all = await readAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return Response.json({ ok: false, error: "no such section" }, { status: 404 });
  // Plain write, no bypass. The guard only refuses an array that loses more than three entries
  // AND more than half its length; removing one never trips it, including the last one. There is
  // deliberately no way to force a write from here — see kvStateStore.purge for why the bypass is
  // its own method rather than an option anyone can pass without thinking about it.
  if (!(await store().write(next))) {
    return Response.json({ ok: false, error: "Couldn't remove that section." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
