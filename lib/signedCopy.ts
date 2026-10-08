// EVERY COPY OF THE BOOK IS A SIGNATURE EDITION (Steven, 2026-10-08).
//
// A file cannot check who is opening it, so nothing stops a buyer forwarding the download itself. His answer:
// "we flip it around and we call it John Smith's signature version, like we signed the book for them... and then
// when John Smith is passing the book around, he's the one that looks like an idiot because we put the copyright
// in the footnote of the book that it's not to be shared. You've paid for it, it's your copy. That doesn't mean
// you have the right to go give it to ten other people."
//
// So the files in storage are TEMPLATES, and the buyer's own copy is made at the moment of download:
//   study guides (PDF)  the cover line, the left footer on every page, and the copyright note on the last page
//   the book (EPUB)     the signature and the copyright note on the title page
// The templates leave those places empty (CEO repo: build-checklist/study-guide/build_study_guide.py).
import { PDFDict, PDFDocument, PDFHexString, PDFName, PDFString, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { strToU8, strFromU8, unzipSync, zipSync, type Zippable } from "fflate";

export type Buyer = { name: string; email: string };

// THE BUYER'S OWN LINKS (see lib/bookBuyers.ts). Inside a buyer's copy, every tracked link carries their short
// code:  /go/<slug>  becomes  /b/<code>/<slug>, which logs the tap under their name and then counts it on the
// same smart link as before. No code (the owner's preview) leaves the links as they are.
const GO = "stevenjamesconsulting.com/go/";
const personal = (url: string, code?: string) => (code ? url.split(GO).join(`stevenjamesconsulting.com/b/${code}/`) : url);

const YEAR = new Date().getFullYear();
// The name as it is printed. No name on the order (Stripe did not collect one) falls back to the email.
const who = (b: Buyer) => (b.name || b.email || "you").trim();
const possessive = (n: string) => (/s$/i.test(n) ? `${n}'` : `${n}'s`);
const NOTE = (b: Buyer) =>
  // His wording rule (2026-10-08): say it the way a copyright notice says it, "a copyrighted edition, not to be
  // shared". Never "you paid for it, it's your copy": that is understood once the notice is there.
  `© ${YEAR} Steven Barchetti, Steven James Consulting. All rights reserved. This signature edition was made for ${who(b)}` +
  (b.name && b.email ? ` (${b.email})` : "") +
  `. It is a copyrighted edition, not to be shared.`;

// The built-in PDF fonts only know Western European letters. Anything else is dropped rather than failing the
// whole download; the email on the note still names the buyer.
const plain = (s: string) => s.normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF©]/g, "").replace(/\s+/g, " ").trim();

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = []; let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Where the empty places are on each of the three page sizes, in points. Matches the @page rules in the builder.
const LAYOUT = {
  guidePhone: { left: 17.3, footY: 14, foot: 6.3, cover: 6.5, coverY: 36, note: 6.2, noteY: 74 },
  guideTablet: { left: 36, footY: 20, foot: 8, cover: 8.5, coverY: 50, note: 7.5, noteY: 92 },
  guideLaptop: { left: 32.4, footY: 18, foot: 8, cover: 8, coverY: 42, note: 7.2, noteY: 84 },
} as const;
export type GuideKey = keyof typeof LAYOUT;

export async function signPdf(bytes: Uint8Array, key: GuideKey, buyer: Buyer, code?: string): Promise<Uint8Array> {
  const L = LAYOUT[key];
  const b = { name: plain(buyer.name), email: plain(buyer.email) };
  const pdf = await PDFDocument.load(bytes);
  const sans = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const copper = rgb(0.91, 0.67, 0.41), brown = rgb(0.54, 0.42, 0.27);
  const centre = (text: string, font: PDFFont, size: number, w: number) => (w - font.widthOfTextAtSize(text, size)) / 2;

  // the cover: the signature line, in the copper of the cover's own small capitals
  const cover = pages[0]; const cw = cover.getWidth();
  let line = `SIGNATURE EDITION  ·  SIGNED FOR ${who(b).toUpperCase()}`; let cs: number = L.cover;
  while (bold.widthOfTextAtSize(line, cs) > cw * 0.86 && cs > 4.5) cs -= 0.25;
  cover.drawText(line, { x: centre(line, bold, cs, cw), y: L.coverY, size: cs, font: bold, color: copper });

  // every page after the cover: the left footer, beside the page number the template already carries
  let foot = `${possessive(who(b))} Signature Edition  ·  © Steven Barchetti  ·  Not to be shared`;
  const room = (w: number) => w - L.left * 2 - 26;
  if (sans.widthOfTextAtSize(foot, L.foot) > room(pages[1].getWidth())) foot = `${possessive(who(b))} Signature Edition  ·  Not to be shared`;
  let fs: number = L.foot; while (sans.widthOfTextAtSize(foot, fs) > room(pages[1].getWidth()) && fs > 4.5) fs -= 0.25;
  for (const p of pages.slice(1)) p.drawText(foot, { x: L.left, y: L.footY, size: fs, font: sans, color: brown });

  // the last page: the copyright note in full, centred above the footer
  const last = pages[pages.length - 1]; const lw = last.getWidth();
  const lines = wrap(NOTE(b), sans, L.note, lw - L.left * 2 - 8);
  lines.forEach((t, i) => last.drawText(t, { x: centre(t, sans, L.note, lw), y: L.noteY - i * L.note * 1.45, size: L.note, font: sans, color: brown }));

  // the links on the cover and the last page
  if (code) {
    for (const p of pages) {
      const annots = p.node.Annots();
      for (let i = 0; i < (annots?.size() || 0); i++) {
        const act = annots!.lookupMaybe(i, PDFDict)?.lookupMaybe(PDFName.of("A"), PDFDict);
        const uri = act?.lookup(PDFName.of("URI"));
        if (act && (uri instanceof PDFString || uri instanceof PDFHexString) && uri.decodeText().includes(GO)) {
          act.set(PDFName.of("URI"), PDFString.of(personal(uri.decodeText(), code)));
        }
      }
    }
  }

  pdf.setTitle(`Attention To Dollars: The 15-Stage Checklist. ${possessive(who(b))} Signature Edition`);
  return pdf.save();
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function signEpub(bytes: Uint8Array, buyer: Buyer, code?: string): Uint8Array {
  const files = unzipSync(bytes);
  const path = Object.keys(files).find((n) => /(^|\/)title\.xhtml$/.test(n));
  if (!path) return bytes; // a book without a title page is handed over as it is
  const add =
    `<p style="margin-top:2em;letter-spacing:.14em;text-transform:uppercase;font-size:.8em">Signature Edition</p>` +
    `<p style="font-size:1.25em"><strong>Signed for ${xml(who(buyer))}</strong></p>` +
    `<p><em>Steven Barchetti</em></p>` +
    `<p style="margin-top:2.5em;font-size:.75em;line-height:1.5">${xml(NOTE(buyer))}</p>`;
  const page = strFromU8(files[path]);
  const at = page.lastIndexOf("</div>");
  if (at < 0) return bytes;
  files[path] = strToU8(page.slice(0, at) + add + page.slice(at));
  if (code) {
    for (const name of Object.keys(files)) {
      if (!/\.xhtml$/i.test(name)) continue;
      const text = strFromU8(files[name]);
      if (text.includes(GO)) files[name] = strToU8(personal(text, code));
    }
  }
  // An e-book file must open with its "mimetype" entry, stored uncompressed. Pictures are already compressed,
  // so they are stored as they are, which keeps a 15 MB book to about a second of work.
  const out: Zippable = {};
  for (const [name, data] of Object.entries(files)) out[name] = [data, { level: name === "mimetype" || /\.(jpe?g|png|webp|gif)$/i.test(name) ? 0 : 6 }];
  return zipSync(out);
}
