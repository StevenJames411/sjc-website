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

/** Map a literal hex from their markup to one of our roles, or keep it as a marked one-off. */
function toRole(hex: string | undefined, p: Palette): string {
  if (!hex) return "";
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

/** Pull a hex out of a Tailwind arbitrary class (`bg-[#0ea5e9]`) or an inline style. */
function hexFrom(el: HTMLElement, kind: "bg" | "text"): string | undefined {
  const c = cls(el), s = styleOf(el);
  const bracket = kind === "bg"
    ? c.match(/bg-\[(#[0-9a-fA-F]{6})\]/)
    : c.match(/text-\[(#[0-9a-fA-F]{6})\]/);
  if (bracket) return bracket[1].toLowerCase();
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
  const scale: Record<string, number> = { "12": 48, "16": 64, "20": 80, "24": 96, "28": 112, "32": 128, "40": 160 };
  const pt = c.match(/(?:^|\s)pt-(\d+)/)?.[1] || c.match(/(?:^|\s)py-(\d+)/)?.[1];
  const pb = c.match(/(?:^|\s)pb-(\d+)/)?.[1] || c.match(/(?:^|\s)py-(\d+)/)?.[1];
  return { top: scale[pt || ""] ?? 80, bottom: scale[pb || ""] ?? 80 };
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
      icon,
      iconColor: iconHex ? toRole(iconHex, p) : icon ? "accent" : "",
      centered: /text-center/.test(cls(el)),
      layout: "",
      bare: false,
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
    const gridN = cls(el).match(/(?:md|lg):grid-cols-(\d)/)?.[1];
    if (gridN && /grid/.test(cls(el))) {
      const kids = el.childNodes.filter((n) => n.nodeType === 1) as HTMLElement[];
      const n = Math.min(Number(gridN), 3);
      const cols: Block[][] = [[], [], []];

      // Resolve every child FIRST, then drop the empties. Decorative children (their dotted
      // connector line between the steps) map to nothing but were still eating a column, which
      // rotated the numbered steps into 3-1-2.
      const resolved = kids
        .map((k) => {
          const isCard = /rounded/.test(cls(k)) && (k.querySelector("h3") || k.querySelector("h4"));
          const badge = isCard ? (clean(k.text).match(/^([1-9])\b/)?.[1] || "") : "";
          return isCard ? [cardBlock(k, p, badge)] : blocksFrom(k, p, depth + 1);
        })
        .filter((blocks) => blocks.length > 0);

      // More items than columns still works — the extras wrap onto the next row.
      resolved.forEach((blocks, i) => cols[i % n].push(...blocks));
      out.push({
        type: "Columns",
        props: { id: nid("cols"), columns: n, gap: 24, col1: cols[0], col2: cols[1], col3: cols[2] },
      });
      continue;
    }

    // anything else: keep walking down
    out.push(...blocksFrom(el, p, depth + 1));
  }
  return out;
}

// ── the whole page ────────────────────────────────────────────────────────────────────────────

export type ImportResult = {
  data: Data;
  palette: Palette;
  report: string[];
};

export function importHtml(html: string, businessName: string): ImportResult {
  seq = 0;
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
    content.push({
      type: "Section",
      props: {
        id,
        background: toRole(hexFrom(sec, "bg"), palette) || "white",
        maxWidth: "80rem",
        paddingTop: pad.top,
        paddingBottom: pad.bottom,
        decor: "",
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
