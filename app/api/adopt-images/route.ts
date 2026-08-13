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
import { siteOr } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { puckKey } from "@/lib/puckContent";
import { findPageMeta } from "@/lib/pageRegistry";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Anything already on one of these is ours (or a CDN we control) — leave it alone.
//
// ⚠️ imagedelivery.net USED TO BE ON THIS LIST, labelled "the existing logo CDN". It is not ours.
// It's Cloudflare Images, and the account hash in those URLs (xaKlCos5cTg_1RWzIu_h-A) belongs to
// LandingSite.ai — the design tool. An account hash is unique to one Cloudflare account, so every
// URL on that host is served out of somebody else's account, including the SJC logo. Whitelisting
// it told the adopter to skip exactly the photos it exists to rescue: an import from that tool
// reported success, adopted nothing, and left the page loading off the vendor we were leaving.
// If a host is ever added back here, prove the account is ours first.
const OURS = [".public.blob.vercel-storage.com"];

const MAX_BYTES = 12 * 1024 * 1024; // a page photo has no business being bigger

// ── OPTIMISING ON THE WAY IN ──────────────────────────────────────────────────────────────────
// Adoption is the only moment every photo on a page passes through our own code, so it's the
// cheapest place to fix weight. A design tool hands back whatever the generator produced —
// 3000px hero JPEGs are normal — and the visitor is on a phone on cell data.
//
// Re-encode to WebP at a sane ceiling. Deliberately conservative:
//   - never enlarge: a small image stays small rather than being blown up and re-compressed
//   - SVG is left completely alone: it's vector, rasterising it makes it worse and bigger
//   - animated GIF is left alone: sharp would flatten it to a single frame
//   - if the re-encode comes out heavier than the original, keep the original
//   - if sharp throws for any reason we store the ORIGINAL bytes. A heavy photo is a slow page;
//     a lost photo is a broken one. Never trade the second for the first.
const MAX_EDGE = 2000; // plenty for a full-bleed hero on a retina laptop
const WEBP_QUALITY = 82;

type Encoded = { buf: Buffer; type: string; ext: string; note: string };

async function optimise(input: Buffer, type: string): Promise<Encoded> {
  const asIs = (note: string): Encoded => ({
    buf: input,
    type,
    ext: (type.split("/")[1] || "png").split("+")[0].replace("jpeg", "jpg"),
    note,
  });
  if (type.includes("svg")) return asIs("svg, left as-is");
  if (type.includes("gif")) return asIs("gif, left as-is");
  try {
    const { default: sharp } = await import("sharp");
    const img = sharp(input, { failOn: "none" });
    const meta = await img.metadata();
    const out = await img
      .rotate() // honour EXIF orientation before the resize, or a phone photo lands sideways
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    if (out.byteLength >= input.byteLength) return asIs("original was already smaller");
    const was = `${meta.width || "?"}×${meta.height || "?"}`;
    const pct = Math.round((1 - out.byteLength / input.byteLength) * 100);
    return { buf: out, type: "image/webp", ext: "webp", note: `${was} → webp, ${pct}% smaller` };
  } catch (e) {
    return asIs(`kept original (${(e as Error).message})`);
  }
}

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
  // ⛔ SCOPED. It still defaults to SJC so the editor's existing button keeps working — but the
  // default is now CHECKED like any other value, so it is a convenience rather than a way in.
  const { site: __s, deny } = await siteOr(String(body?.siteId || SJC).trim() || SJC, req);
  if (deny) return deny;
  const siteId = __s.id;
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
  // What the re-encode actually did, per photo — reported back so "optimised" is a number you
  // can read rather than a claim.
  const savings: { url: string; from: number; to: number; note: string }[] = [];
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
          // Resize + re-encode BEFORE it lands, so the stored copy is the optimised one and
          // there's never a second pass over the same photo.
          const enc = await optimise(Buffer.from(buf), type);
          savings.push({ url, from: buf.byteLength, to: enc.buf.byteLength, note: enc.note });
          // Per-SITE prefix, so handing a client their website later means copying one folder.
          const name = `sites/${siteId}/${slug}/${Date.now()}-${rehosted.size + 1}.${enc.ext}`;
          const blob = await put(name, enc.buf, { access: "public", contentType: enc.type });
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
    optimised: savings.length
      ? {
          bytesBefore: savings.reduce((n, s) => n + s.from, 0),
          bytesAfter: savings.reduce((n, s) => n + s.to, 0),
          perImage: savings.map((s) => ({ url: s.url, kbBefore: Math.round(s.from / 1024), kbAfter: Math.round(s.to / 1024), note: s.note })),
        }
      : undefined,
    failures,
  });
}
