// optimize-images.mjs — WebP a whole directory tree of a hand-built static site.
//
// ⛔ WHY THIS EXISTS: only the studio side optimises photos. `app/api/adopt-images/route.ts`
// re-encodes on adoption, so every site built THROUGH the studio is already WebP. A hand-built
// static demo has no such moment — Vercel's image optimiser is a Next.js feature, so a plain
// <img src="x.jpg"> in a static file is served byte-for-byte off disk. Measured 2026-08-28:
// four hand-built sites, 308 MB of jpg/png, zero webp between them.
//
// The encode settings below are COPIED from adopt-images/route.ts on purpose. One pipeline,
// one set of numbers — if the quality ceiling ever moves it moves in both places.
//
// Usage:  node scripts/optimize-images.mjs <dir>            # dry run, prints what it would save
//         node scripts/optimize-images.mjs <dir> --apply    # writes .webp beside each original
//
// Originals are never deleted: they are the masters. Keep them out of the deploy with
// .vercelignore, not with rm.

import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DIR = process.argv[2];
const APPLY = process.argv.includes("--apply");
if (!DIR) { console.error("usage: optimize-images.mjs <dir> [--apply]"); process.exit(1); }

// Same ceiling and quality as adopt-images/route.ts — plenty for a full-bleed hero on retina.
const MAX_EDGE = 2000;
const WEBP_QUALITY = 82;

const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "stock-candidates"]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jpe?g|png)$/i.test(e)) out.push(p);
  }
  return out;
}

const files = walk(DIR).sort();
let before = 0, after = 0, written = 0, kept = 0;

for (const f of files) {
  const input = readFileSync(f);
  const dest = f.replace(/\.(jpe?g|png)$/i, ".webp");
  before += input.byteLength;
  try {
    const img = sharp(input, { failOn: "none" });
    const meta = await img.metadata();
    const out = await img
      .rotate() // EXIF orientation before the resize, or a phone photo lands sideways
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    // A heavy photo is a slow page; a LOST photo is a broken one. Never trade the second for
    // the first — if webp comes out fatter, the original stays and the markup keeps pointing at it.
    if (out.byteLength >= input.byteLength) {
      after += input.byteLength; kept++;
      console.log(`  keep  ${path.relative(DIR, f)}  (webp was larger)`);
      continue;
    }
    after += out.byteLength; written++;
    const pct = Math.round((1 - out.byteLength / input.byteLength) * 100);
    console.log(
      `  ${APPLY ? "write" : "would"} ${path.relative(DIR, f).padEnd(42)}` +
      `${(input.byteLength/1048576).toFixed(2).padStart(6)} → ${(out.byteLength/1048576).toFixed(2).padStart(5)} MB  ` +
      `${String(pct).padStart(2)}% smaller  (${meta.width}×${meta.height})`
    );
    if (APPLY) writeFileSync(dest, out);
  } catch (e) {
    after += input.byteLength; kept++;
    console.log(`  keep  ${path.relative(DIR, f)}  (sharp: ${e.message})`);
  }
}

console.log(
  `\n${files.length} images · ${written} converted · ${kept} left as-is\n` +
  `${(before/1048576).toFixed(1)} MB → ${(after/1048576).toFixed(1)} MB  ` +
  `(${Math.round((1 - after/before) * 100)}% smaller)` +
  (APPLY ? "" : "\n\nDRY RUN — nothing written. Re-run with --apply.")
);
