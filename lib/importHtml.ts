// Turn a generated one-page site's HTML into OUR blocks.
//
// WHY THIS EXISTS. The design tools (SiteDrop, LandingSite) produce genuinely good layouts for
// about $2.50, but they charge for the *editing* — every ten-pixel tweak is another round trip
// with a metered chatbot. So the play is: rent the generation, own the editing. That only works
// if moving a design onto our blocks is cheap. Doing it by hand took most of a night.
//
// WHAT IT CAN AND CAN'T DO. These pages are machine-generated, so they're predictable: Tailwind
// utility classes, hex colours inline in the class names, `data-lucide` icon names that match our
// own icon set, one <section> per page section. That regularity is what makes the mapping
// mechanical rather than guesswork. It will NOT handle a hand-written site, and it won't be
// perfect on an unusual layout — expect ~80% and clean the rest up in the builder. That's still
// minutes instead of hours.
//
// COLOURS BECOME ROLES, NOT HEX. The importer resolves each colour to accent / secondary /
// highlight / ink / … using the palette detected from the page, so an imported site is instantly
// re-skinnable from the brand panel. Importing raw hex would just re-create the problem the
// un-weld was built to solve.
import { parse, type HTMLElement } from "node-html-parser";
import type { Data } from "@measured/puck";
import { ICONS } from "@/components/blocks/Icon";

// ── colour helpers ────────────────────────────────────────────────────────────────────────────

const HEX = /#[0-9a-fA-F]{6}\b/g;

/** Perceived lightness 0-1, used to tell "ink" from "a band" from "white". */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Rough saturation 0-1 — separates a real brand colour from a grey. */
function saturation(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}

export type Palette = {
  accent?: string;
  secondary?: string;
  highlight?: string;
  ink?: string;
  mute?: string;
  bandSoft?: string;
  bandDark?: string;
  /** every colour found, most-used first — shown to the operator so a bad guess is obvious */
  ranked: { hex: string; count: number }[];
};

/**
 * Work out which colour is doing which job.
 *
 * Deliberately simple and deliberately *reported back*: the operator sees the ranked list and the
 * assignment, so a wrong guess is caught in ten seconds rather than discovered on a client's site.
 */
export function detectPalette(html: string): Palette {
  const counts = new Map<string, number>();
  for (const m of html.match(HEX) || []) {
    const h = m.toLowerCase();
    counts.set(h, (counts.get(h) || 0) + 1);
  }
  const ranked = [...counts.entries()]
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count);

  // INK FIRST. Nearly every design's text colour is a *tinted* near-black — slate, charcoal,
  // deep navy — which carries enough saturation to look like a brand colour. Claiming the darkest
  // frequently-used tone as ink before looking for accents stops the body colour being mistaken
  // for the brand (which is exactly what happened on the first run: slate became "secondary" and
  // ink came back undefined).
  const dark = ranked.filter((c) => lightness(c.hex) < 0.42);
  const ink = dark[0]?.hex;

  const colourful = ranked.filter(
    (c) => c.hex !== ink && saturation(c.hex) > 0.3 && lightness(c.hex) > 0.35 && lightness(c.hex) < 0.92
  );
  const neutral = ranked.filter((c) => c.hex !== ink && saturation(c.hex) <= 0.3);

  return {
    // most-used saturated mid-tone is the brand; the next two are the supporting accents
    accent: colourful[0]?.hex,
    secondary: colourful[1]?.hex,
    highlight: colourful[2]?.hex,
    ink,
    mute: neutral.filter((c) => lightness(c.hex) >= 0.35 && lightness(c.hex) < 0.72)[0]?.hex,
    bandSoft: ranked.filter((c) => lightness(c.hex) >= 0.93 && c.hex !== "#ffffff")[0]?.hex,
    // a SECOND dark tone, distinct from ink — not every design has one
    bandDark: dark.filter((c) => c.hex !== ink)[0]?.hex,
    ranked,
  };
}

/**
 * PRESERVE MODE (2026-07-31). Off = the original behaviour: every colour is quantised into one of
 * our brand roles so the copy re-skins from one screen. That is right for a plain page and WRONG
 * for a design that was paid for — the exact cyan IS the product.
 *
 * On, `toRole` hands the literal hex straight back (resolveColor passes raw hex through
 * untouched), and the section/card readers below pick up the gradient, glass and glow that used
 * to be dropped on the floor.
 */
let PRESERVE = false;

/** Map a literal hex from their markup to one of our roles, or keep it as a marked one-off. */
function toRole(hex: string | undefined, p: Palette): string {
  if (!hex) return "";
  if (PRESERVE) return hex.toLowerCase();
  const h = hex.toLowerCase();
  if (h === "#ffffff" || h === "#fff") return "white";
  if (h === p.accent) return "accent";
  if (h === p.secondary) return "secondary";
  if (h === p.highlight) return "highlight";
  if (h === p.ink) return "ink";
  if (h === p.mute) return "mute";
  if (h === p.bandSoft) return "bandSoft";
  if (h === p.bandDark) return "bandDark";
  return `custom:${h}`; // marked, so it's obvious in the data that it didn't map
}

// ── reading their markup ──────────────────────────────────────────────────────────────────────

const cls = (el: HTMLElement) => el.getAttribute("class") || "";
const styleOf = (el: HTMLElement) => el.getAttribute("style") || "";

/**
 * Tailwind's NAMED colours, which a generated design uses constantly and this function used to
 * ignore completely.
 *
 * ⚠️ THIS IS WHY EVERY HEADING IMPORTED INVISIBLE. A design writes `text-white` on a headline
 * sitting on a dark band, and `text-slate-400` on the paragraph under it. Reading only the
 * ARBITRARY form (`text-[#ffffff]`) meant white came back as "no colour found", the heading fell
 * back to `ink` — near-black — and rendered black-on-navy. The body text survived by luck: its
 * fallback, `mute`, is grey, which is roughly what slate-400 looks like anyway. So the page
 * looked 80% right and the single most important line on it was gone.
 *
 * Only the neutral families are here. An accent is virtually always an arbitrary hex (that IS
 * the brand colour), while text and surfaces are named — so this covers the gap without
 * pretending to be a full Tailwind palette.
 */
const TW_NAMED: Record<string, string> = {
  white: "#ffffff", black: "#000000",
  "slate-50": "#f8fafc", "slate-100": "#f1f5f9", "slate-200": "#e2e8f0", "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8", "slate-500": "#64748b", "slate-600": "#475569", "slate-700": "#334155",
  "slate-800": "#1e293b", "slate-900": "#0f172a", "slate-950": "#020617",
  "gray-100": "#f3f4f6", "gray-200": "#e5e7eb", "gray-300": "#d1d5db", "gray-400": "#9ca3af",
  "gray-500": "#6b7280", "gray-600": "#4b5563", "gray-700": "#374151", "gray-800": "#1f2937",
  "gray-900": "#111827",
  "zinc-400": "#a1a1aa", "zinc-500": "#71717a", "zinc-800": "#27272a", "zinc-900": "#18181b",
  "neutral-400": "#a3a3a3", "neutral-800": "#262626", "neutral-900": "#171717",
};

/** Pull a hex out of a Tailwind class (arbitrary OR named) or an inline style. */
function hexFrom(el: HTMLElement, kind: "bg" | "text"): string | undefined {
  const c = cls(el), s = styleOf(el);
  const bracket = kind === "bg"
    ? c.match(/bg-\[(#[0-9a-fA-F]{6})\]/)
    : c.match(/text-\[(#[0-9a-fA-F]{6})\]/);
  if (bracket) return bracket[1].toLowerCase();

  // Named form. The opacity suffix (`text-white/70`) is deliberately ignored — the block system
  // has no per-text opacity, and a slightly-too-solid heading beats an invisible one.
  // ⚠️ SCAN EVERY CANDIDATE, don't stop at the first. `text-xl font-bold text-white` matched
  // `text-xl`, found no colour called "xl", and gave up — so the heading came back colourless
  // and fell through to near-black. Tailwind puts size and colour in the same `text-` namespace.
  const re = kind === "bg"
    ? /(?:^|\s)bg-([a-z]+(?:-\d{2,3})?)(?:\/\d+)?(?=\s|$)/g
    : /(?:^|\s)text-([a-z]+(?:-\d{2,3})?)(?:\/\d+)?(?=\s|$)/g;
  for (const m of c.matchAll(re)) if (TW_NAMED[m[1]]) return TW_NAMED[m[1]];

  const inline = kind === "bg"
    ? s.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{6})/)
    : s.match(/(?<!-)color:\s*(#[0-9a-fA-F]{6})/);
  return inline ? inline[1].toLowerCase() : undefined;
}

/** The lucide name on an element or anywhere inside it — their icons and ours share names. */
function iconIn(el: HTMLElement | null): string {
  if (!el) return "";
  const self = el.getAttribute?.("data-lucide");
  if (self && self in ICONS) return self;
  const child = el.querySelector("[data-lucide]");
  const n = child?.getAttribute("data-lucide") || "";
  return n in ICONS ? n : "";
}

const clean = (s: string) => s.replace(/\s+/g, " ").trim();

/** Their section's vertical padding, so a band doesn't come across squashed or bloated. */
function paddingFrom(el: HTMLElement): { top: number; bottom: number } {
  const c = cls(el);
  // Tailwind's spacing scale is 4px a step. Responsive padding (`py-20 md:py-28 lg:py-32`) takes
  // the LARGEST — that is the desktop value, and desktop is where a band's spacing is judged.
  // Reading the base value imported every section at 80px when the design drew it at 128.
  const biggest = (re: RegExp) => {
    const hits = [...c.matchAll(re)].map((m) => Number(m[1]) * 4).filter(Number.isFinite);
    return hits.length ? Math.max(...hits) : undefined;
  };
  const py = biggest(/(?:^|\s|:)py-(\d+)/g);
  const pt = biggest(/(?:^|\s|:)pt-(\d+)/g);
  const pb = biggest(/(?:^|\s|:)pb-(\d+)/g);
  return { top: pt ?? py ?? 80, bottom: pb ?? py ?? 80 };
}

let seq = 0;
const nid = (p: string) => `${p}-${++seq}`;

type Block = { type: string; props: Record<string, unknown> };

// ── element → block ───────────────────────────────────────────────────────────────────────────

function headingBlock(el: HTMLElement, p: Palette): Block {
  const text = clean(el.text);
  // A <span> inside a heading with its own colour is the two-tone treatment.
  const span = el.querySelectorAll("span").find((s) => hexFrom(s, "text"));
  const hlHex = span ? hexFrom(span, "text") : undefined;
  const hlText = span ? clean(span.text) : "";
  // An <svg> inside the coloured span is their hand-drawn underline swipe.
  const swipe = span?.querySelector("svg");
  const swipeHex = swipe ? hexFrom(swipe, "text") : undefined;

  const size = /text-7xl/.test(cls(el)) ? 60 : /text-6xl/.test(cls(el)) ? 52 : /text-5xl/.test(cls(el)) ? 44 : /text-4xl/.test(cls(el)) ? 36 : 32;

  return {
    type: "Heading",
    props: {
      id: nid("h"),
      text,
      fontSize: el.tagName === "H1" ? size : Math.min(size, 44),
      align: /text-center/.test(cls(el)) ? "center" : "left",
      color: toRole(hexFrom(el, "text"), p) || "ink",
      spaceAbove: 0,
      spaceBelow: 16,
      underline: swipeHex ? toRole(swipeHex, p) : "",
      highlight: hlText && hlText !== text ? hlText : "",
      highlightColor: hlHex ? toRole(hlHex, p) : "",
    },
  };
}

function textBlock(el: HTMLElement, p: Palette): Block {
  const isPill = /rounded-full/.test(cls(el)) && /border|shadow|bg-/.test(cls(el));
  return {
    type: "Text",
    props: {
      id: nid("t"),
      text: clean(el.innerHTML.includes("<") ? el.innerHTML : el.text),
      fontSize: /text-xl/.test(cls(el)) ? 20 : /text-lg/.test(cls(el)) ? 18 : /text-sm/.test(cls(el)) ? 14 : /text-xs/.test(cls(el)) ? 13 : 17,
      align: /text-center/.test(cls(el)) ? "center" : "left",
      color: toRole(hexFrom(el, "text"), p) || "mute",
      spaceAbove: 0,
      spaceBelow: 16,
      pill: isPill ? toRole(hexFrom(el, "bg"), p) || "white" : "",
      pillBorder: isPill ? "line" : "",
      icon: iconIn(el),
      iconColor: isPill ? "highlight" : "",
    },
  };
}

function buttonBlock(el: HTMLElement, p: Palette): Block {
  const c = cls(el);
  const outlined = /border-2|border\s|bg-white/.test(c) && !/bg-\[#/.test(c);
  return {
    type: "Button",
    props: {
      id: nid("btn"),
      title: clean(el.text),
      subtitle: "",
      href: el.getAttribute("href") || "#",
      icon: iconIn(el),
      variant: outlined ? "outline" : "filled",
      shape: /rounded-full/.test(c) ? "pill" : "",
      color: toRole(hexFrom(el, outlined ? "text" : "bg"), p) || "accent",
      align: "left",
      fullWidth: false,
    },
  };
}

/**
 * The element that actually IS the card, looking through a wrapper if there is one.
 *
 * A card is a rounded box carrying a heading. The generator often puts an animation wrapper
 * around it, so the rounded box is a child rather than the grid item itself. Requiring a heading
 * is what stops this matching an icon tile — those are rounded too, and contain no h3.
 */
function cardShell(el: HTMLElement): HTMLElement | null {
  const looksLikeCard = (d: HTMLElement) =>
    /rounded/.test(cls(d)) && !!(d.querySelector("h3") || d.querySelector("h4"));
  if (looksLikeCard(el)) return el;
  return (el.querySelectorAll("div").find(looksLikeCard) as HTMLElement | undefined) || null;
}

function cardBlock(el: HTMLElement, p: Palette, badge?: string): Block {
  const h = el.querySelector("h3") || el.querySelector("h4");
  const paras = el.querySelectorAll("p");
  const icon = iconIn(el);
  const iconHex = icon ? hexFrom(el.querySelector("[data-lucide]")?.parentNode as HTMLElement ?? el, "text") : undefined;
  return {
    type: "Card",
    props: {
      id: nid("card"),
      badge: badge || "",
      badgeColor: badge ? "accent" : "",
      badgePosition: badge ? "edge" : "",
      eyebrow: "",
      heading: h ? clean(h.text) : "",
      body: paras.length ? clean(paras[paras.length - 1].text) : "",
      // ⚠️ READ THE CARD'S OWN TEXT COLOURS. Card defaults to near-black ink, which is right on a
      // white box and invisible on a glass pane over a dark band — the exact failure seen on the
      // first editable import: six cards with readable body copy and no visible headings.
      ...(PRESERVE
        ? {
            headingColor: h ? toRole(hexFrom(h, "text"), p) : "",
            bodyColor: paras.length ? toRole(hexFrom(paras[paras.length - 1], "text"), p) : "",
          }
        : {}),
      icon,
      iconColor: iconHex ? toRole(iconHex, p) : icon ? "accent" : "",
      centered: /text-center/.test(cls(el)),
      layout: "",
      bare: false,
      // A bought design's card is a translucent pane on a dark band, not a white box. Read from
      // the markup rather than guessed: an opacity-suffixed background (`bg-[#1E293B]/50`,
      // `bg-white/5`) or a backdrop blur means glass.
      ...(PRESERVE
        ? {
            surface: /bg-\[#[0-9a-f]{3,8}\]\/\d|bg-white\/\d|backdrop-blur/i.test(cls(el)) ? "glass" : "",
            surfaceColor: hexFrom(el, "bg") || "",
            // ⚠️ THE OPACITY IS THE EFFECT, not a detail. `bg-[#1E293B]/50` is the card's colour
            // at HALF — render it at a hardcoded 7% over a dark band and the pane vanishes,
            // which is what "the cards are dark on dark" looks like.
            surfaceOpacity: Number(cls(el).match(/bg-(?:\[#[0-9a-fA-F]{3,8}\]|white|black)\/(\d{1,3})/)?.[1] || 0),
            // The edge is its OWN colour: designs pair a dark translucent fill with a LIGHT
            // hairline (`border-white/5`). Deriving it from the fill gave a dark border on a
            // dark card, so the pane had no edge and stopped reading as glass.
            borderColor:
              /border-white/.test(cls(el))
                ? "#ffffff"
                : cls(el).match(/border-\[(#[0-9a-fA-F]{3,8})\]/)?.[1]?.toLowerCase() || "",
            // The accent edge on hover — `hover:border-[#00D9FF]/40`. Reading it is what makes a
            // grid of imported cards feel alive rather than static.
            hoverBorderColor:
              cls(el).match(/hover:border-\[(#[0-9a-fA-F]{3,8})\]/)?.[1]?.toLowerCase() || "",
            hoverLift: /hover:-translate-y/.test(cls(el)),
            shadowColor: "",
            radius: 0,
          }
        : {}),
    },
  };
}

function heroImageBlock(img: HTMLElement, container: HTMLElement, p: Palette): Block {
  // A floating card over the photo: an absolutely-positioned box with a bold line and a small one.
  const floats = container.querySelectorAll("div").filter((d) => /absolute/.test(cls(d)) && d.querySelectorAll("p").length >= 1 && !/blur/.test(cls(d)));
  const badge = floats.find((d) => d.querySelectorAll("p").length >= 2);
  const pill = floats.find((d) => d !== badge && /rounded-full/.test(cls(d)));
  const badgeP = badge?.querySelectorAll("p") || [];
  return {
    type: "HeroImage",
    props: {
      id: nid("hero"),
      src: img.getAttribute("src") || "",
      alt: img.getAttribute("alt") || "",
      height: 560,
      tilt: /rotate-3/.test(cls(container)) ? 2 : 0,
      glow: "accent",
      frame: "white",
      radius: 40,
      badgeTitle: badgeP[0] ? clean(badgeP[0].text) : "",
      badgeBody: badgeP[1] ? clean(badgeP[1].text) : "",
      pillText: pill ? clean(pill.text) : "",
      pillColor: pill ? toRole(hexFrom(pill, "bg"), p) || "secondary" : "secondary",
      spaceAbove: 0,
      spaceBelow: 0,
    },
  };
}

/** Walk a container and turn the things we recognise into blocks, in document order. */
function blocksFrom(root: HTMLElement, p: Palette, depth = 0): Block[] {
  const out: Block[] = [];
  if (depth > 8) return out;

  for (const el of root.childNodes.filter((n) => n.nodeType === 1) as HTMLElement[]) {
    const tag = el.tagName;

    // A container holding a photo WITH overlaid cards is a single HeroImage — take it whole and
    // stop, or the badges come out as stray paragraphs under the picture.
    //
    // The test has to be TIGHT. A first attempt matched on "contains an img and something
    // absolutely positioned", which is also true of the entire hero section — so the headline and
    // buttons vanished into the photo block. A photo wrapper contains NO heading, NO form and no
    // more than one picture; anything else is a layout container and must be walked into.
    if (tag !== "IMG") {
      const imgs = el.querySelectorAll("img");
      const isPhotoWrapper =
        imgs.length === 1 &&
        !el.querySelector("h1") && !el.querySelector("h2") && !el.querySelector("h3") &&
        !el.querySelector("form") &&
        el.querySelectorAll("a").length === 0 &&
        el.querySelectorAll("div").some((d) => /absolute/.test(cls(d)));
      if (isPhotoWrapper) {
        out.push(heroImageBlock(imgs[0], el, p));
        continue;
      }
    }

    if (tag === "H1" || tag === "H2" || tag === "H3") {
      // an <h3> inside a card is handled by cardBlock; only take standalone ones
      out.push(headingBlock(el, p));
      continue;
    }
    if (tag === "P") {
      const t = clean(el.text);
      if (t) out.push(textBlock(el, p));
      continue;
    }
    if (tag === "A" && /rounded|px-\d/.test(cls(el)) && clean(el.text)) {
      out.push(buttonBlock(el, p));
      continue;
    }
    if (tag === "FORM") {
      out.push({
        type: "LeadForm",
        props: {
          id: nid("form"),
          source: "",
          fields: el.querySelectorAll("input,textarea")
            .filter((i) => i.getAttribute("type") !== "hidden")
            .map((i) => ({
              label: clean(
                (el.querySelector(`label[for="${i.getAttribute("id")}"]`)?.text) ||
                i.getAttribute("placeholder") || i.getAttribute("name") || "Field"
              ),
              inputType: i.getAttribute("type") === "email" ? "email" : i.getAttribute("type") === "tel" ? "tel" : "text",
            })),
          buttonLabel: clean(el.querySelector("button")?.text || "Send"),
          note: "",
          successHeading: "Got it — we'll be in touch shortly.",
          successBody: "",
          buttonColor: "accent",
          inColumn: true,
        },
      });
      continue;
    }
    if (tag === "IMG") {
      out.push(heroImageBlock(el, root, p));
      continue;
    }

    // a grid becomes Columns; its children become the column contents
    // ⚠️ TAKE THE LARGEST BREAKPOINT, NOT THE FIRST. `md:grid-cols-2 lg:grid-cols-4` matched md
    // first and imported a four-across process row as two columns.
    // ⚠️ MULTI-DIGIT, AND THE LARGEST. `grid-cols-(\d)` matched only one digit, so a
    // `lg:grid-cols-12` layout grid came through as ONE column; and matching the first
    // breakpoint turned `md:grid-cols-2 lg:grid-cols-4` into two.
    const gridNs = [...cls(el).matchAll(/(?:sm|md|lg|xl):grid-cols-(\d+)/g)].map((m) => Number(m[1]));
    const gridN = gridNs.length ? Math.max(...gridNs) : undefined;
    if (gridN && /grid/.test(cls(el))) {
      const kids = el.childNodes.filter((n) => n.nodeType === 1) as HTMLElement[];

      // Resolve every child FIRST, then drop the empties. Decorative children (their dotted
      // connector line between the steps) map to nothing but were still eating a column, which
      // rotated the numbered steps into 3-1-2.
      const resolved = kids
        .map((k) => {
          // ⚠️ THE CARD SHELL IS OFTEN ONE LEVEL DOWN. A design wraps each grid child for its
          // scroll animation — `<div class="relative animate-on-scroll">` outside, `rounded-2xl
          // bg-…/60 border` inside. Testing only the child itself for `rounded` meant the whole
          // four-step process row failed the card test and got walked apart into loose headings
          // and paragraphs: no shell, no number badge, no icon. Look through the wrapper.
          const cardEl = cardShell(k);
          const badge = cardEl ? (clean(k.text).match(/^([1-9])\b/)?.[1] || "") : "";
          return cardEl ? [cardBlock(cardEl, p, badge)] : blocksFrom(k, p, depth + 1);
        })
        .filter((blocks) => blocks.length > 0);

      // ⚠️ A GRID OF MORE THAN 4 IS A LAYOUT GRID, NOT A ROW OF COLUMNS. `grid-cols-12` with two
      // col-span children is a 7/5 split; `grid-cols-5` with two is 2/3. Taking the declared
      // number would shred both into empty columns — so above 4, the CHILD COUNT is the truth.
      const n = gridN <= 4 ? gridN : Math.min(resolved.length || 1, 4);

      // ⚠️ ONE `Columns` PER ROW, not one for the whole grid.
      //
      // Six cards into three columns used to mean two cards STACKED inside each column — so
      // card 4 started wherever card 1 happened to end, and the second row came out ragged and
      // misaligned. Their markup is a single grid with six children flowing 3-across, where a
      // row's cards share a row and therefore share a height.
      //
      // Our Columns block is genuinely one row, so a 3x2 grid is TWO of them. Splitting here is
      // what makes the rows line up, and it also leaves each row independently editable.
      for (let i = 0; i < resolved.length; i += n) {
        const row: Block[][] = [[], [], [], []];
        resolved.slice(i, i + n).forEach((blocks, j) => row[j].push(...blocks));
        out.push({
          type: "Columns",
          props: { id: nid("cols"), columns: n, gap: 24, col1: row[0], col2: row[1], col3: row[2], col4: row[3] },
        });
      }
      continue;
    }

    // anything else: keep walking down
    out.push(...blocksFrom(el, p, depth + 1));
  }
  return out;
}

/**
 * The three things a bought design does to a band that the old importer threw away.
 *
 * Each is read from the markup, never guessed. All return "" when absent, which is the
 * do-nothing value on the Section block — so a plain page imports exactly as it always did.
 */
function bandLook(sec: HTMLElement): {
  background: string;
  gradientTo: string;
  gradientAngle: number;
  grid: string;
  decor: string;
} {
  const style = styleOf(sec);

  // `background: linear-gradient(135deg, #0A0E27 0%, #1E293B 100%)` — the contact band.
  const g = style.match(/linear-gradient\(\s*(\d+)deg\s*,\s*(#[0-9a-f]{3,8})[^,]*,\s*(#[0-9a-f]{3,8})/i);

  // The faint graph-paper overlay is a child whose background-image is two 1px gradients.
  const gridEl = sec
    .querySelectorAll("[style]")
    .find((d) => /linear-gradient\([^)]*1px/i.test(styleOf(d)));
  const gridHex = gridEl ? (styleOf(gridEl).match(/#[0-9a-f]{3,8}/i)?.[0] || "") : "";

  // Glow blobs: big blurred circles. Their colour is the band's accent wash.
  const blob = sec
    .querySelectorAll("div")
    .find((d) => /rounded-full/.test(cls(d)) && /blur-/.test(cls(d)) && hexFrom(d, "bg"));

  return {
    background: (g ? g[2] : hexFrom(sec, "bg")) || "",
    gradientTo: g ? g[3] : "",
    gradientAngle: g ? Number(g[1]) : 135,
    grid: gridHex.toLowerCase(),
    decor: blob ? (hexFrom(blob, "bg") || "") : "",
  };
}

// ── the whole page ────────────────────────────────────────────────────────────────────────────

export type ImportResult = {
  data: Data;
  palette: Palette;
  report: string[];
};

export function importHtml(
  html: string,
  businessName: string,
  opts?: { preserve?: boolean }
): ImportResult {
  seq = 0;
  PRESERVE = !!opts?.preserve;
  const palette = detectPalette(html);
  const root = parse(html);
  const report: string[] = [];
  const content: Block[] = [];

  // Header → SiteHeader. Anchors keep their names, which is what makes the address bar read
  // like real page navigation.
  const header = root.querySelector("header");
  if (header) {
    // These pages ship the nav TWICE — once for desktop, once inside the mobile menu — so
    // scraping the whole <header> produced every link doubled. Dedupe by target.
    const seenTargets = new Set<string>();
    const navLinks = header.querySelectorAll("a")
      .filter((a) => (a.getAttribute("href") || "").startsWith("#"))
      .map((a) => ({ label: clean(a.text), target: a.getAttribute("href") || "#", fontSize: 15, color: "ink", newTab: false }))
      .filter((l) => {
        if (!l.label || l.label.length > 24 || seenTargets.has(l.target)) return false;
        seenTargets.add(l.target);
        return true;
      });
    const cta = header.querySelectorAll("a").find((a) => /rounded-full|rounded-lg/.test(cls(a)) && /bg-\[#/.test(cls(a)));
    content.push({
      type: "SiteHeader",
      props: {
        id: nid("nav"), brandName: businessName, brandHref: "/", brandSize: 20,
        tagline: "", taglineColor: "white", taglineSize: 14,
        links: navLinks.filter((l) => l !== undefined && l.target !== cta?.getAttribute("href")),
        ctaLabel: cta ? clean(cta.text) : "Book Appointment",
        ctaHref: cta?.getAttribute("href") || "#contact",
        ctaNewTab: false,
        background: "white", foreground: "ink", showLogo: false,
        ctaColor: "accent", brandIcon: iconIn(header), brandIconColor: "accent",
      },
    });
    report.push(`header: ${navLinks.length} nav links, cta "${cta ? clean(cta.text) : "—"}"`);
  }

  for (const sec of root.querySelectorAll("section")) {
    const id = sec.getAttribute("id") || nid("section");
    const pad = paddingFrom(sec);
    // Walk the SECTION, not its first <div>: these designs open with decorative blur blobs, so
    // "first div" reliably found an empty one and skipped the section's real content.
    const kids = blocksFrom(sec, palette);
    if (!kids.length) { report.push(`section #${id}: SKIPPED (nothing recognised)`); continue; }
    const look = PRESERVE ? bandLook(sec) : null;
    content.push({
      type: "Section",
      props: {
        id,
        background: look
          ? look.background || toRole(hexFrom(sec, "bg"), palette) || "white"
          : toRole(hexFrom(sec, "bg"), palette) || "white",
        maxWidth: "80rem",
        paddingTop: pad.top,
        paddingBottom: pad.bottom,
        decor: look?.decor || "",
        grid: look?.grid || "",
        gradientTo: look?.gradientTo || "",
        gradientAngle: look?.gradientAngle ?? 135,
        content: kids,
      },
    });
    report.push(`section #${id}: ${kids.length} blocks (${kids.map((k) => k.type).join(", ")})`);
  }

  const footer = root.querySelector("footer");
  if (footer) {
    content.push({
      type: "SiteFooter",
      props: {
        id: nid("footer"),
        blurb: clean(footer.querySelector("p")?.text || ""),
        links: footer.querySelectorAll("a")
          .filter((a) => (a.getAttribute("href") || "").startsWith("#"))
          .slice(0, 6)
          .map((a) => ({ label: clean(a.text), target: a.getAttribute("href") || "#" }))
          .filter((l) => l.label),
        phone: (html.match(/tel:(\+?[\d-]+)/) || [])[1] || "",
        phoneDisplay: clean(footer.text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] || ""),
        email: (footer.text.match(/[\w.+-]+@[\w-]+\.[\w.]+/) || [])[0] || "",
        privacyUrl: "", tosUrl: "",
        copyright: businessName,
        background: "ink", foreground: "white", brandName: businessName, showLogo: false,
      },
    });
    report.push("footer: mapped");
  }

  return {
    data: { root: { props: { title: businessName } }, zones: {}, content } as unknown as Data,
    palette,
    report,
  };
}
