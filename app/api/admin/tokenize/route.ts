// Link a page's typed-in business details to the website's settings.
//
// An imported design arrives with the phone number as characters inside seven different blocks.
// Filling in Website settings does nothing for those blocks — they hold digits, not a reference.
// This finds the literal values and swaps them for {{business.*}} tokens, so from then on the
// settings screen drives the page.
//
//   POST { site, slug, dryRun? } -> { ok, replacements: {token: count}, missing }
//
// It only ever replaces values that are ALREADY IN THE SETTINGS. Nothing is guessed: if the phone
// field is blank, no phone is touched. That is what keeps this safe to run on any page — it can't
// invent a match, so the worst case is that it changes nothing.
import { findSite } from "@/lib/sites";
import { findPageMeta } from "@/lib/pageRegistry";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { SJC } from "@/lib/siteKeys";
import { applyTokens, tokenRules } from "@/lib/tokenizePage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { site?: string; slug?: string; dryRun?: boolean; sweep?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // ── SWEEP: every page of every website ──────────────────────────────────────────────────────
  //
  // ⚠️ THE POINT IS THE `blocked` LIST, NOT THE REPLACEMENTS. Tokenizing only ever swaps values
  // that are ALREADY in a site's settings — it cannot invent a match, which is what makes it safe
  // to run anywhere. The flip side is that a site with a thin settings record silently does
  // nothing, and you find out much later when a page refuses to save to the library, or when a
  // client changes their phone number in settings and the page does not move.
  //
  // So the sweep reports what it CANNOT do and why, per site. That list is the work.
  if (body?.sweep) {
    const { readSites } = await import("@/lib/sites");
    const { readPages } = await import("@/lib/pageRegistry");
    const client = getClient();
    const dry = body?.dryRun !== false;

    const done: { site: string; page: string; total: number; replacements: Record<string, number> }[] = [];
    const blocked: { site: string; missing: string[] }[] = [];

    for (const s of await readSites()) {
      const rs = tokenRules(s.business);
      const missing = (["name", "phoneDisplay", "email", "address"] as const).filter(
        (k) => !s.business[k]?.trim()
      );
      if (!rs.length) {
        blocked.push({ site: s.id, missing });
        continue;
      }
      for (const p of await readPages(s.id)) {
        const store = createKvStore(client, puckKey(p.slug, false, s.id));
        const draft = await store.read<Record<string, unknown>>();
        if (!draft) continue;
        const counts: Record<string, number> = {};
        const { _pub, ...rest } = draft as { _pub?: number };
        const next = applyTokens(rest, rs, counts) as Record<string, unknown>;
        const total = Object.values(counts).reduce((a, n) => a + n, 0);
        if (!total) continue;
        if (!dry && !(await store.write(next))) {
          return Response.json(
            { ok: false, error: `Couldn't save ${s.id}/${p.slug}.`, done },
            { status: 500 }
          );
        }
        done.push({ site: s.id, page: p.slug, total, replacements: counts });
      }
      if (missing.length) blocked.push({ site: s.id, missing });
    }

    return Response.json({
      ok: true,
      dryRun: dry,
      done,
      // Sites whose settings are too thin to link everything. Fill these in and run it again.
      blocked,
      note: dry
        ? "Dry run. Nothing written."
        : "Drafts tokenized. Publish each page to take it live.",
    });
  }

  const siteId = String(body?.site || SJC).trim() || SJC;
  const slug = String(body?.slug || "").trim();
  const site = await findSite(siteId);
  if (!site) return Response.json({ ok: false, error: "No such website." }, { status: 404 });
  if (!slug || !(await findPageMeta(slug, siteId))) {
    return Response.json({ ok: false, error: "No such page." }, { status: 404 });
  }

  const b = site.business;
  const missing = (["name", "phoneDisplay", "email", "address"] as const).filter((k) => !b[k]?.trim());
  const rs = tokenRules(b);
  if (!rs.length) {
    return Response.json(
      { ok: false, error: "Nothing in this website's settings to link to. Fill in the business details first.", missing },
      { status: 400 }
    );
  }

  const client = getClient();
  const draft =
    (await createKvStore(client, puckKey(slug, false, siteId)).read<Record<string, unknown>>()) ||
    (await createKvStore(client, puckKey(slug, true, siteId)).read<Record<string, unknown>>());
  if (!draft) return Response.json({ ok: false, error: "That page has no saved content." }, { status: 404 });

  const counts: Record<string, number> = {};
  const { _pub, ...rest } = draft as { _pub?: number };
  const next = applyTokens(rest, rs, counts) as Record<string, unknown>;
  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  if (body?.dryRun) return Response.json({ ok: true, dryRun: true, replacements: counts, total, missing });

  if (!total) return Response.json({ ok: true, replacements: {}, total: 0, missing, note: "Nothing on this page matched." });

  // DRAFT ONLY. Publish is a separate, deliberate act — same as every other edit in the builder.
  if (!(await createKvStore(client, puckKey(slug, false, siteId)).write(next))) {
    return Response.json({ ok: false, error: "Couldn't save the page." }, { status: 500 });
  }

  return Response.json({ ok: true, replacements: counts, total, missing });
}
