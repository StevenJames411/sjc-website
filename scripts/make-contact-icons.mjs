/**
 * make-contact-icons.mjs — turn Steven's generated icon art into web assets.
 *
 * THE PROBLEM IT SOLVES. The four contact tiles (Book a Call · Click to Call · Click to Text ·
 * Click to Email) want real artwork rather than drawn glyphs. What comes out of an image generator
 * is a 2.2MB, 1536px picture of an icon sitting on a background — a dark green gradient behind the
 * SMS bubble, grey behind the envelope. Dropped straight into a tile that renders at 56px, each one
 * shows a coloured square behind it and costs two megabytes to say "email".
 *
 * ⛔ AND IT REMOVES A THIRD PARTY FROM THE MOST-CLICKED CONTROLS ON THE PAGE. The calendar and phone
 * were being hotlinked from imagedelivery.net — Landing Site's CDN — because that is where Steven
 * originally uploaded them. If that account ever lapses those tiles go blank, silently. Output goes
 * to public/icons and is served from SJC's own domain.
 *
 * Re-runnable. Sources are never modified; drop new art in SRC_DIR and run it again.
 *
 *   node scripts/make-contact-icons.mjs
 */
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const SRC_DIR = path.join(os.homedir(), "Downloads");
const OUT_DIR = path.join(process.cwd(), "public", "icons");
const SIZE = 256; // 4x the 56px tile so it stays sharp on retina, and big enough for larger cards later

// ⛔ MAPPED EXPLICITLY, NOT MATCHED BY NAME. The first version of this script looked for "calendar"
// or "envelope" in the filename and matched nothing — an image generator names its output
// "ChatGPT Image Aug 9, 2026, 07_18_20 PM (1).png". There is no content in the name to match on,
// and guessing by modified-time would silently swap two icons the day two are exported together.
//
// So the pairing is stated on the command line:
//   node scripts/make-contact-icons.mjs sms="~/Downloads/… (1).png" email="~/Downloads/… (2).png"
//
// Anything not named keeps whatever URL the port script already has, and says so.
const NAMES = ["calendar", "phone", "sms", "email"];

/**
 * Find the icon inside its frame.
 *
 * Every one of these is a rounded square centred on a flat-ish background, so we scan in from each
 * edge for the first pixel that differs from the CORNER colour by more than `tol`.
 *
 * ⚠️ THE GLOW IS THE TRAP. These have a soft outer glow bleeding into the background. A tight
 * tolerance stops at the glow rather than the icon, and the crop then carries a halo of background
 * colour that shows against the blue tile. So: a generous tolerance, and then an inset that eats a
 * little of the icon's own edge rather than risking a rim of green or grey.
 */
async function findBox(img, tol = 46, insetPct = 0.012) {
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const at = (x, y) => {
    const i = (y * w + x) * c;
    return [data[i], data[i + 1], data[i + 2], c > 3 ? data[i + 3] : 255];
  };

  // ⛔ ALPHA FIRST, COLOUR ONLY AS A FALLBACK — AND GETTING THIS WRONG COST A ROUND.
  // The generated art already ships with a transparent background; the dark vignette it appears to
  // sit on is the IMAGE VIEWER's backdrop, not pixels in the file. Scanning by colour therefore
  // compared the RGB of fully transparent pixels — which is meaningless data — decided the whole
  // frame was content, and returned a crop the full height of the image. The icon then rendered
  // small inside a field of empty transparency.
  //
  // So: if the file has an alpha channel, find the bounds of what is actually OPAQUE. Fall back to
  // the colour scan only for a source that is genuinely flat-backed.
  const hasAlpha = c > 3 && (() => {
    for (let y = 0; y < h; y += 7) for (let x = 0; x < w; x += 7) if (at(x, y)[3] < 250) return true;
    return false;
  })();

  let differs;
  if (hasAlpha) {
    differs = (x, y) => at(x, y)[3] > 24; // anything more than a whisper of glow counts as content
  } else {
    // Average the four corners — a single corner pixel can sit inside a vignette and skew the read.
    const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
    const bg = [0, 1, 2].map((k) => corners.reduce((s, p) => s + p[k], 0) / 4);
    differs = (x, y) => {
      const p = at(x, y);
      return Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > tol;
    };
  }

  let top = 0, bottom = h - 1, left = 0, right = w - 1;
  const rowHit = (y) => { for (let x = 0; x < w; x += 2) if (differs(x, y)) return true; return false; };
  const colHit = (x) => { for (let y = 0; y < h; y += 2) if (differs(x, y)) return true; return false; };
  while (top < bottom && !rowHit(top)) top++;
  while (bottom > top && !rowHit(bottom)) bottom--;
  while (left < right && !colHit(left)) left++;
  while (right > left && !colHit(right)) right--;

  // Square it off around the centre — these are square icons, and a 1px difference between width
  // and height shows as a squashed icon once it is scaled to 256.
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  let side = Math.max(right - left, bottom - top);
  side -= side * insetPct * 2;
  const l = Math.max(0, Math.round(cx - side / 2));
  const t = Math.max(0, Math.round(cy - side / 2));
  const s = Math.min(Math.round(side), w - l, h - t);
  return { box: { left: l, top: t, width: s, height: s }, hasAlpha };
}

// A rounded-rect alpha mask. dest-in keeps only what the mask covers, so the corners come out
// genuinely transparent instead of carrying whatever background was behind them.
const maskSvg = (size, radiusPct = 0.22) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${Math.round(size * radiusPct)}" ry="${Math.round(size * radiusPct)}" fill="#fff"/></svg>`
  );

const main = async () => {
  const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const i = a.indexOf("=");
      return [a.slice(0, i), a.slice(i + 1).replace(/^~/, os.homedir())];
    })
  );
  const unknown = Object.keys(args).filter((k) => !NAMES.includes(k));
  if (unknown.length) {
    // Fail loudly on a typo'd key rather than silently skipping the icon it was meant to build.
    console.error(`unknown icon name(s): ${unknown.join(", ")} — expected ${NAMES.join(", ")}`);
    process.exit(1);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  let made = 0;

  for (const name of NAMES) {
    const src = args[name];
    if (!src) {
      console.log(`  SKIP  ${(name + ".png").padEnd(13)} not supplied`);
      continue;
    }
    const want = { out: `${name}.png` };
    const { box, hasAlpha } = await findBox(sharp(src));
    // `contain` on a transparent source, `fill` otherwise: the box is squared already, so contain
    // just guarantees a non-square source is letterboxed rather than stretched.
    const body = await sharp(src)
      .extract(box)
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();
    const out = path.join(OUT_DIR, want.out);
    // ⛔ MASK ONLY A FLAT-BACKED SOURCE. Art that already carries its own transparency also carries
    // its own silhouette and outer glow — forcing a rounded rectangle over it would slice that glow
    // off square, which looks worse than the background ever did.
    const pipeline = sharp(body);
    if (!hasAlpha) pipeline.composite([{ input: maskSvg(SIZE), blend: "dest-in" }]);
    await pipeline.png({ compressionLevel: 9 }).toFile(out);
    const kb = Math.round((await fs.stat(out)).size / 1024);
    const srcKb = Math.round((await fs.stat(src)).size / 1024);
    console.log(`  OK    ${want.out.padEnd(13)} ${srcKb}KB -> ${kb}KB   crop ${box.width}px`);
    made++;
  }

  console.log(`\n${made}/${NAMES.length} written to public/icons`);
  if (made < NAMES.length) {
    console.log("Missing ones keep whatever URL the port script already has.");
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
