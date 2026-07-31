// Pull a page's images off somebody else's server and onto ours.
//
// WHY THIS IS NOT OPTIONAL. An imported design's photos still point at the tool that generated
// them. That is a live dependency on a third party inside a site a client is paying for: they
// delete the project, or the account lapses, or they change a URL — and every photo on the
// client's website turns into a broken box. We find out when the client calls.
//
// So: download each one, store it in OUR blob under a per-page prefix, and rewrite the page to
// point at the copy. After this runs, nothing on the page depends on anyone else.
//
//   POST { slug, dryRun? } -> { ok, found, adopted, skipped, failures }
//
// dryRun lists what WOULD be pulled without touching anything.
//
// Runs against the DRAFT and the PUBLISHED copy together, so a published page can't be left
// pointing at the old host after the draft has been fixed.
import { put } from "@vercel/blob";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { findPageMeta } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Anything already on one of these is ours (or a CDN we control) — leave it alone.
const OURS = [
  ".public.blob.vercel-storage.com",
  "imagedelivery.net", // the existing logo CDN
];

const MAX_BYTES = 12 * 1024 * 1024; // a page photo has no business being bigger

type Node = { type?: string; props?: Record<string, unknown> };

/**
 * Every prop on the page that holds an image URL, wherever it's nested.
 *
 * ⚠️ AN ITEM IN AN ARRAY IS NOT ALWAYS A BLOCK. This used to read `n.props` only, so it recursed
 * into arrays but then skipped anything whose items were plain records rather than blocks —
 * which is exactly how DesignSection stores an imported design's photos (`images: [{key, alt,
 * src}]`). The result was silent and slow-acting: the adopter reported success, adopted nothing,
 * and the client's website kept loading its photos from the design tool that generated them,
 * until that tool cleaned them up.
 */
function imageSlots(nodes: Node[] | undefined, out: { props: Record<string, unknown>; key: string }[] = []) {
  for (const n of nodes || []) {
    if (!n || typeof n !== "object") continue;
    // A block keeps its values under `props`; a plain record IS its own values.
    const p = (n.props ?? n) as Record<string, unknown>;
    for (const key of ["src", "poster", "image", "logo"]) {
      if (typeof p[key] === "string" && /^https?:\/\//i.test(p[key] as string)) out.push({ props: p, key });
    }
    for (const v of Object.values(p)) if (Array.isArray(v)) imageSlots(v as Node[], out);
  }
  return out;
}

const isForeign = (url: string) => !OURS.some((h) => url.includes(h));

export async function POST(req: Request) {
  let body: { slug?: string; siteId?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const slug = String(body?.slug || "").trim();
  // Defaults to SJC so the editor's existing button keeps working unchanged.
  const siteId = String(body?.siteId || SJC).trim() || SJC;
  if (!slug) return Response.json({ ok: false, error: "Which page?" }, { status: 400 });
  if (!(await findPageMeta(slug, siteId))) {
    return Response.json({ ok: false, error: "No such page." }, { status: 404 });
  }

  const client = getClient();
  const stores = [
    { label: "draft", store: createKvStore(client, puckKey(slug, false, siteId)) },
    { label: "published", store: createKvStore(client, puckKey(slug, true, siteId)) },
  ];

  // One download per distinct URL even when the draft and the published copy share it.
  const rehosted = new Map<string, string>();
  const failures: { url: string; why: string }[] = [];
  let found = 0, adopted = 0, skipped = 0;

  for (const { label, store } of stores) {
    const data = await store.read<{ content?: Node[] }>();
    if (!data?.content) continue;

    const slots = imageSlots(data.content);
    let changed = false;

    for (const slot of slots) {
      const url = slot.props[slot.key] as string;
      found++;
      if (!isForeign(url)) { skipped++; continue; }

      if (!rehosted.has(url)) {
        if (body?.dryRun) { rehosted.set(url, "(would download)"); continue; }
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          if (buf.byteLength > MAX_BYTES) throw new Error(`${Math.round(buf.byteLength / 1e6)}MB — too big`);
          const type = res.headers.get("content-type") || "image/png";
          if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
          const ext = (type.split("/")[1] || "png").split("+")[0].replace("jpeg", "jpg");
          // Per-SITE prefix, so handing a client their website later means copying one folder.
          const name = `sites/${siteId}/${slug}/${Date.now()}-${rehosted.size + 1}.${ext}`;
          const blob = await put(name, Buffer.from(buf), { access: "public", contentType: type });
          rehosted.set(url, blob.url);
          adopted++;
        } catch (e) {
          failures.push({ url, why: (e as Error).message });
          continue; // leave the original in place rather than blanking the image
        }
      }

      const next = rehosted.get(url);
      if (next && !body?.dryRun && next !== url) { slot.props[slot.key] = next; changed = true; }
    }

    if (changed && !body?.dryRun) {
      const ok = await store.write(data as unknown as Record<string, unknown>);
      if (!ok) failures.push({ url: `(${label})`, why: "write refused" });
    }
  }

  // Read back and confirm nothing foreign is left — reporting intent instead of result is how
  // you end up believing a job ran that didn't.
  let remaining = 0;
  if (!body?.dryRun) {
    for (const { store } of stores) {
      const data = await store.read<{ content?: Node[] }>();
      for (const s of imageSlots(data?.content)) {
        if (isForeign(s.props[s.key] as string)) remaining++;
      }
    }
  }

  return Response.json({
    ok: failures.length === 0,
    dryRun: !!body?.dryRun,
    found,
    adopted,
    skipped,
    remainingForeign: body?.dryRun ? undefined : remaining,
    urls: [...rehosted.entries()].map(([from, to]) => ({ from, to })),
    failures,
  });
}
