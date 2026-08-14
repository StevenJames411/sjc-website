// DOWNLOAD ONE WEBSITE — the exit hatch, reachable without a terminal.
//
//   GET /api/admin/export?site=<id>  -> a .zip of plain HTML, CSS, JS and images
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────────────────────
// scripts/export-site.mjs already does this and is described in its own header as "the exit
// hatch" — the promise that a customer owns what they bought. In practice nobody could reach it:
// it is a CLI script that needs shell access and a SITE_EDIT_TOKEN out of .env, which means the
// only person who can ever hand a client their own website is Steven, at a terminal. A promise
// that requires him to be online is not the promise. This route is the same trick, pressable from
// the gallery.
//
// ── THE SAME LOGIC, DELIBERATELY, NOT A REWRITE ──────────────────────────────────────────────
// It fetches the LIVE PUBLIC PAGES rather than re-rendering from stored content — same as the
// script, and for the same reason: whatever a visitor's browser receives is what lands in the
// zip, so there is exactly one renderer and it cannot drift from what a leaving client is handed.
// The origin comes from lib/hostShared's publicBaseFor (already shared with the gallery and the
// editor) instead of the script's own --host flag, and the page list comes from readPages()
// in-process instead of a second HTTP round trip through /api/pages — everything else (the
// rewrite regex, the asset walk, the README) is the script's logic, inlined because this route is
// the only file this task may create.
//
// ⚠️ PLAIN FETCH, NO COOKIE FORWARDED — SAME LIMIT AS THE SCRIPT, NOT A NEW ONE. A page only
// answers here if it is Demo or Published; a Draft site's demo address 404s for anyone, owner
// included, unless the request carries the owner's session (see lib/host.ts:isOwnerRequest). The
// script never forwarded one either, so a Draft export failing is not a regression — it is
// surfaced below as a clean 422 instead of a zip full of nothing.
//
// ⚠️ WHAT A DOWNLOAD CANNOT CARRY, SURFACED AT DOWNLOAD TIME, NOT DISCOVERED LATER: the forms
// stop working. They POST to /api/apply on this app, which is not in the zip. SiteGallery says so
// before the browser saves the file, and EXPORT-README.txt inside it says so again — a client who
// finds out by losing enquiries is a client who tells people about it.
//
// ── WHY A HAND-ROLLED ZIP ─────────────────────────────────────────────────────────────────────
// package.json carries no zip library. A STORE-only (uncompressed) zip is a small, well-specified
// format — local file header, the same data again in a central directory, one end-of-directory
// record — and unzips with Finder, Explorer and every archive tool without needing a dependency
// for something this codebase does once.
import { siteOr } from "@/lib/siteAccess";
import { SJC } from "@/lib/siteKeys";
import { readPages } from "@/lib/pageRegistry";
import { isChrome } from "@/lib/puckPages";
import { publicBaseFor } from "@/lib/hostShared";
import { extname } from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const siteOf = (v: unknown) => String(v ?? "").trim() || SJC;

export async function GET(req: Request) {
  const { site, deny } = await siteOr(siteOf(new URL(req.url).searchParams.get("site")), req);
  if (deny) return deny;

  const { origin } = publicBaseFor(site);
  const slugs = (await readPages(site.id)).map((p) => p.slug).filter((s) => !isChrome(s));

  const assets = new Map<string, string>(); // absolute url -> local relative path
  let assetN = 0;
  function localName(url: string): string {
    const found = assets.get(url);
    if (found) return found;
    let ext = extname(new URL(url).pathname).split("?")[0] || "";
    if (ext.length > 6) ext = "";
    const name = `assets/a${++assetN}${ext}`;
    assets.set(url, name);
    return name;
  }

  /** Rewrite one page's HTML so every reference points inside the zip. Ported from export-site.mjs. */
  function rewrite(html: string): string {
    const up = "./";

    html = html.replace(/(href|src)="(https?:\/\/[^"]+)"/g, (m, attr, url) => {
      const sameApp = url.startsWith(origin) || url.includes(".vercel-storage.com") || url.includes("/_next/");
      if (!sameApp) return m; // leave third-party links alone — they still work
      if (/\.(html?|)$/.test(new URL(url).pathname) && url.startsWith(origin) && !url.includes("/_next/")) return m;
      return `${attr}="${up}${localName(url)}"`;
    });

    html = html.replace(/(href|src)="\/([^"/][^"]*)"/g, (m, attr, path) => {
      if (path.startsWith("api/")) return m; // an API path in a static zip is honest breakage
      const abs = `${origin}/${path}`;
      if (slugs.includes(path.replace(/\/$/, ""))) return `${attr}="${up}${path.replace(/\/$/, "")}.html"`;
      return `${attr}="${up}${localName(abs)}"`;
    });

    html = html.replace(/url\((['"]?)(\/[^)'"]+|https?:\/\/[^)'"]+)\1\)/g, (m, q, url) => {
      const abs = url.startsWith("/") ? `${origin}${url}` : url;
      if (!abs.startsWith(origin) && !abs.includes(".vercel-storage.com")) return m;
      return `url(${q}${up}${localName(abs)}${q})`;
    });

    html = html.replace(/(href)="\/"/g, `$1="${up}index.html"`);
    return html;
  }

  const files: { path: string; data: Buffer }[] = [];
  let ok = 0;
  for (const slug of slugs) {
    const url = slug === "home" ? `${origin}/` : `${origin}/${slug}`;
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) continue; // unpublished/unreachable — named in the ok-count below, not fatal
    files.push({ path: slug === "home" ? "index.html" : `${slug}.html`, data: Buffer.from(rewrite(await res.text()), "utf8") });
    ok++;
  }

  // ⛔ NOTHING REACHABLE = A CLEAN ERROR, NOT AN EMPTY ZIP. The only way every page 404s is a
  // Draft or Archived site — see the note at the top of this file — and a customer who downloads a
  // zip of nothing learns that from a broken index.html instead of a sentence.
  if (ok === 0) {
    return Response.json(
      {
        ok: false,
        error: `Nothing was reachable to export. '${site.name || site.id}' needs to be Demo or Published first — a Draft site answers nobody, including this download.`,
      },
      { status: 422 }
    );
  }

  let assetOk = 0;
  for (const [url, local] of assets) {
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok) continue;
    files.push({ path: local, data: Buffer.from(await res.arrayBuffer()) });
    assetOk++;
  }

  files.push({
    path: "EXPORT-README.txt",
    data: Buffer.from(
      `${site.name || site.id} — exported ${new Date().toISOString().slice(0, 10)}
from ${origin}

WHAT THIS IS
A complete, working copy of the website: ${ok} pages and ${assetOk} files (images, styles, fonts).
Open index.html in a browser, or upload this whole folder to any web host. Nothing needs to be
installed and nothing phones home.

WHAT DOES NOT WORK IN THIS COPY
The forms. On the live site they send enquiries to an inbox, a spreadsheet and a CRM; that runs on
the server, which is not part of a folder of files. The forms will still LOOK right and a visitor
can still type in them, but nothing is sent or recorded. Anyone rehosting this needs to point the
forms at their own handler first.

Everything else — every page, every image, the layout, the styling — is here and works offline.
`,
      "utf8"
    ),
  });

  const zip = buildZip(files);
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${site.id}.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}

// ── STORE-ONLY ZIP, BY HAND ──────────────────────────────────────────────────────────────────
// See the file header for why: no dependency, and the format is small enough to write out in
// full — a local header + the bytes for every file, then the same metadata again as a central
// directory, then one end-of-central-directory record pointing at it.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date): { time: number; date: number } {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((d.getSeconds() >> 1) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f);
  return { time, date };
}

function buildZip(files: { path: string; data: Buffer }[]): Buffer {
  const { time, date } = dosDateTime(new Date());
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.path, "utf8");
    const crc = crc32(f.data);
    const size = f.data.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(0, 8); // method: store (no compression)
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(size, 18); // compressed size == uncompressed, store method
    local.writeUInt32LE(size, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // extra length
    localChunks.push(local, nameBuf, f.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8); // flags
    central.writeUInt16LE(0, 10); // method
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(size, 20);
    central.writeUInt32LE(size, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra length
    central.writeUInt16LE(0, 32); // comment length
    central.writeUInt16LE(0, 34); // disk number start
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // offset of this file's local header
    centralChunks.push(central, nameBuf);

    offset += local.length + nameBuf.length + f.data.length;
  }

  const centralStart = offset;
  const centralBuf = Buffer.concat(centralChunks);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4); // disk number
  end.writeUInt16LE(0, 6); // disk with central directory
  end.writeUInt16LE(files.length, 8); // entries on this disk
  end.writeUInt16LE(files.length, 10); // entries total
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localChunks, centralBuf, end]);
}
