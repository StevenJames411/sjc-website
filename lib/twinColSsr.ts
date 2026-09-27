// THE TWIN'S HERO, BUILT ON THE SERVER (2026-09-27). Steven's Loom: on every refresh the page painted
// the ORIGINAL imported hero — his old white-cap headshot, no orb, the headline jammed against the list
// — and half a second later HomeTwinOrb rebuilt it in the browser. Every visitor saw the old page flash.
//
// So the first paint is now the finished layout: the orb slot (orb + tagline) sits in the HTML, and the
// column photo already IS the twin's cutout poster at its final shape. HomeTwinOrb finds the slot, wires
// the orb it already holds, and overlays the films on the same poster — nothing moves, nothing swaps.
// A section without data-sjc-twin-col passes through untouched.

const POSTER = "https://agent-sjc.onrender.com/sjc/roleplay/media/twin-cutout.webp";

// Same markup HomeTwinOrb renders, so the server orb and the live orb are pixel-identical.
const ORB_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" />' +
  '<path d="M5.2 9.7v4.6h2.3l3.2 2.8V6.9L7.5 9.7z" /><path d="M13.3 9.6a3.4 3.4 0 0 1 0 4.8" />' +
  '<path d="M15.4 7.6a6.2 6.2 0 0 1 0 8.8" /></svg>';

const SLOT =
  '<div data-sjc-orb-slot="" style="display:flex;flex-direction:column;align-items:center;padding:52px 0 18px">' +
  `<button type="button" class="sjc-twin-orb" data-sjc-orb-ssr="" aria-label="Tap and I'll talk to you">${ORB_SVG}</button>` +
  '<div class="sjc-twin-tagline">Tap and talk to me about growing your business.</div></div>';

function withStyle(tag: string, css: string): string {
  if (/\sstyle="/.test(tag)) return tag.replace(/\sstyle="([^"]*)"/, (_m, s: string) => ` style="${s}${s && !s.trim().endsWith(";") ? ";" : ""}${css}"`);
  return tag.replace(/^<(\w+)/, `<$1 style="${css}"`);
}

export function prepTwinCol(html: string): string {
  const col = html.indexOf("data-sjc-twin-col");
  if (col < 0 || html.includes("data-sjc-orb-slot")) return html;
  const imgAt = html.indexOf('data-sjc-img="i1"', col);
  if (imgAt < 0) return html;
  const imgStart = html.lastIndexOf("<img", imgAt);
  const imgEnd = html.indexOf(">", imgAt) + 1;
  const wrapStart = html.lastIndexOf("<div", imgStart);
  // On home the photo's wrapper IS the twin column (the attribute sits on it); on the system pages the
  // wrapper is inside the column. Either is fine — it only has to start at or after the column's tag.
  if (imgStart < 0 || imgEnd <= 0 || wrapStart < html.lastIndexOf("<", col)) return html;
  const wrapEnd = html.indexOf(">", wrapStart) + 1;

  let img = html.slice(imgStart, imgEnd).replace(/\s(?:srcset|sizes)="[^"]*"/g, "");
  img = /\ssrc="/.test(img) ? img.replace(/\ssrc="[^"]*"/, ` src="${POSTER}"`) : img.replace("<img", `<img src="${POSTER}"`);
  img = withStyle(img, "aspect-ratio:10/9;height:auto;object-fit:cover");
  const wrap = withStyle(html.slice(wrapStart, wrapEnd), "width:100%;padding-top:0;padding-bottom:0");

  return html.slice(0, wrapStart) + SLOT + wrap + html.slice(wrapEnd, imgStart) + img + html.slice(imgEnd);
}
