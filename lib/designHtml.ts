// Import-side handling of a bought design's markup: make it safe, then make it editable.
//
// Pairs with lib/designCss.ts (which turns the design's Tailwind classes into a real stylesheet)
// and components/blocks/DesignSection.tsx (which renders the result).

import { parse, HTMLElement, NodeType, type Node } from "node-html-parser";
import type { DesignText, DesignImage } from "@/components/blocks/DesignSection";

// Tags that can execute or phone home. A bought design has no business containing any of them,
// and the whole point of this pipeline is that the markup reaches a customer's live website.
const STRIP_TAGS = new Set(["script", "iframe", "object", "embed", "link", "meta", "base"]);

// ── WHY THE FORM SURVIVES, AS A <div> ────────────────────────────────────────────────────────
// The inputs and the button are KEPT: a generated contact section is mostly form, and stripping
// it leaves a heading floating over empty space — the section looks broken, which is no good for
// a demo you're showing a prospect. The generator's form isn't wired to anything on its end
// either, so nothing is lost by keeping the shell.
//
// But the <form> ELEMENT is renamed to <div>, because the danger isn't a form that does nothing —
// it's a form that LOOKS like it works. A homeowner filling it in on a live site and pressing
// send would think she'd contacted the business. With no form element there is nothing to submit
// and no action to post to, so the failure can't happen.
//
// Real leads route through the shared LeadForm block. The import reports the placeholder so
// swapping it in doesn't depend on anyone remembering.
const FORM_TO_DIV = "form";

/** Remove anything executable from a chunk of imported markup. */
export function sanitizeDesignHtml(html: string): string {
  const root = parse(String(html || ""), { comment: false });

  for (const el of root.querySelectorAll("*")) {
    const tag = el.rawTagName?.toLowerCase();
    if (tag && STRIP_TAGS.has(tag)) {
      el.remove();
      continue;
    }
    // Keep the look, remove the ability to submit. See FORM_TO_DIV above.
    //
    // It is also MARKED. `data-sjc-form` is how the renderer finds this exact node later and
    // mounts the real LeadForm into it — the design's own layout, its own column, its own
    // spacing, with a form that actually delivers. Without a marker the only way to get a
    // working form was to delete the section and rebuild it.
    if (tag === FORM_TO_DIV) {
      el.rawTagName = "div";
      el.setAttribute("data-sjc-form", "1");
      el.removeAttribute("action");
      el.removeAttribute("method");
      el.removeAttribute("enctype");
      el.removeAttribute("target");
    }
    for (const name of Object.keys(el.attributes)) {
      const lower = name.toLowerCase();
      const value = el.getAttribute(name) || "";
      // Inline event handlers.
      if (lower.startsWith("on")) {
        el.removeAttribute(name);
        continue;
      }
      // javascript:/data: URLs in anything that navigates or loads.
      if (
        (lower === "href" || lower === "src" || lower === "srcset" || lower === "action") &&
        /^\s*(javascript|vbscript|data)\s*:/i.test(value)
      ) {
        el.removeAttribute(name);
      }
    }
  }
  return root.toString();
}

const TEXT_SKIP = new Set(["script", "style", "svg", "path", "noscript"]);

const clean = (s: string) => String(s || "").replace(/\s+/g, " ").trim();

/** "PhoneCall" / "phone_call" -> "phone-call" — lucide's own per-icon module filename. */
const kebab = (name: string) =>
  String(name || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();

/** The shape lucide ships per icon: [tag, attrs][] */
type IconNode = [string, Record<string, string | number>][];

// Matches what lucide-react itself renders, width/height included. The design sizes icons with
// utility classes (`w-5 h-5`), but an SVG with no intrinsic size collapses anywhere a class
// doesn't reach — so the 24×24 default stays as the floor.
const SVG_ATTRS =
  'xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const attrName = (k: string) => k.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

/** Render one lucide icon node array to SVG markup. No React — see inlineLucideIcons. */
function iconSvg(node: IconNode, className: string): string {
  const children = node
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs || {})
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${attrName(k)}="${String(v).replace(/"/g, "&quot;")}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
  const cls = className ? ` class="${className.replace(/"/g, "&quot;")}"` : "";
  return `<svg ${SVG_ATTRS}${cls} aria-hidden="true">${children}</svg>`;
}

/**
 * Turn `<i data-lucide="phone">` placeholders into real inline SVG.
 *
 * ⚠️ WITHOUT THIS THE DESIGN LOSES EVERY ICON, SILENTLY. Generated pages don't ship icon markup —
 * they ship empty `<i>` tags that the Lucide CDN script fills in at runtime. We strip that script
 * (nothing executable reaches a customer's site), so the icons would simply never appear, and the
 * page still renders "fine" apart from a row of empty squares where the design had icons.
 *
 * The original element's classes are carried onto the <svg> so the design's own sizing and colour
 * utilities (`w-5 h-5 text-[#00D9FF]`) keep working. An unknown icon name leaves the element
 * alone rather than throwing — one missing glyph is not worth failing an import over.
 *
 * ⚠️ BUILT FROM lucide's RAW NODE DATA, NOT ITS REACT COMPONENTS. `lucide-react` is marked
 * "use client", so calling one of its components from a server module throws
 * "Attempted to call the default export … from the server, but it's on the client". Each icon's
 * module also exports `__iconNode` — the plain [tag, attrs][] the component is built from — and
 * that has no React in it at all.
 */
export async function inlineLucideIcons(
  html: string
): Promise<{ html: string; inlined: number; missing: string[] }> {
  const root = parse(String(html || ""), { comment: false });
  const nodes = root.querySelectorAll("[data-lucide]");
  if (!nodes.length) return { html: root.toString(), inlined: 0, missing: [] };

  // One dynamic import per DISTINCT icon, not per occurrence — a page uses a handful of icons
  // dozens of times.
  const cache = new Map<string, IconNode | null>();

  const importIcon = async (name: string) => {
    return (await import(`lucide-react/dist/esm/icons/${name}.mjs`)) as {
      __iconNode?: IconNode;
      default?: { displayName?: string };
    };
  };

  const load = async (name: string, hop = 0): Promise<IconNode | null> => {
    if (cache.has(name)) return cache.get(name)!;
    let node: IconNode | null = null;
    try {
      const mod = await importIcon(name);
      if (mod.__iconNode) {
        node = mod.__iconNode;
      } else if (hop < 2 && mod.default?.displayName) {
        // A RENAMED icon. Lucide keeps the old filename as a stub that re-exports only the
        // component — no `__iconNode` — so reading the node straight off it returns nothing and
        // the icon silently vanishes. The component still carries its canonical name, so follow
        // that instead of maintaining a rename table by hand (`code-2` -> `CodeXml`).
        const canonical = kebab(mod.default.displayName);
        if (canonical && canonical !== name) node = await load(canonical, hop + 1);
      }
    } catch {
      node = null; // unknown icon name — leave the placeholder alone
    }
    cache.set(name, node);
    return node;
  };

  let inlined = 0;
  const missing = new Set<string>();
  for (const el of nodes) {
    const raw = el.getAttribute("data-lucide") || "";
    const name = kebab(raw);
    if (!/^[a-z0-9-]+$/.test(name)) continue; // never let a page name build an import path
    const node = await load(name);
    if (!node) {
      missing.add(raw);
      continue;
    }
    el.replaceWith(parse(iconSvg(node, el.getAttribute("class") || "")));
    inlined++;
  }
  // ⚠️ REPORTED, NOT SWALLOWED. A design missing three icons still renders and still looks
  // finished — the gaps read as deliberate whitespace. Naming them is the only way anyone knows.
  return { html: root.toString(), inlined, missing: [...missing] };
}

// No rename table here on purpose — `load()` follows lucide's own alias stubs via displayName,
// so every rename it ships is handled without anyone updating a list. What CAN'T be recovered is
// a brand mark (github, twitter, facebook…): lucide removed those outright, there is no
// substitute, and they surface in `missing` instead of being quietly dropped.

/** A short human label so the editor's field list is navigable. */
function labelFor(el: HTMLElement | null, value: string, n: number): string {
  const tag = el?.rawTagName?.toLowerCase() || "";
  const kind =
    /^h[1-6]$/.test(tag) ? "Heading"
    : tag === "a" ? "Link"
    : tag === "li" ? "List item"
    : tag === "span" ? "Label"
    : "Text";
  const preview = value.replace(/\s+/g, " ").trim().slice(0, 42);
  return preview ? `${kind}: ${preview}${value.length > 42 ? "…" : ""}` : `${kind} ${n}`;
}

/**
 * Replace a section's editable content with tokens and lift the values out.
 *
 * Returns markup safe to store plus the field lists the editor drives. Text nodes that are pure
 * whitespace, and text inside script/style/svg, are left alone — turning an SVG path's contents
 * into an editable field would be noise in a list Steven has to read.
 */
export function tokenizeSection(html: string): {
  html: string;
  text: DesignText[];
  images: DesignImage[];
  hasForm: boolean;
  formFields: { label: string; inputType: string }[];
  formButton: string;
} {
  const root = parse(sanitizeDesignHtml(html), { comment: false });
  const text: DesignText[] = [];
  const images: DesignImage[] = [];

  const walk = (node: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        const raw = child.rawText;
        if (!raw || !raw.trim()) continue;
        const parent = node instanceof HTMLElement ? node : null;
        if (parent && TEXT_SKIP.has(parent.rawTagName?.toLowerCase() || "")) continue;
        const key = `t${text.length + 1}`;
        const value = raw.trim();
        text.push({ key, label: labelFor(parent, value, text.length + 1), value });
        // Preserve the original surrounding whitespace so inline layout doesn't shift.
        const [, lead = "", , trail = ""] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
        child.rawText = `${lead}{{t:${key}}}${trail}`;
        continue;
      }
      if (child instanceof HTMLElement) {
        if (child.rawTagName?.toLowerCase() === "img") {
          const src = child.getAttribute("src") || "";
          if (src) {
            const key = `i${images.length + 1}`;
            images.push({ key, alt: child.getAttribute("alt") || `Image ${images.length + 1}`, src });
            child.setAttribute("src", `{{i:${key}}}`);
          }
        }
        walk(child);
      }
    }
  };

  // ⚠️ READ THE FORM BEFORE WALKING. walk() replaces every text node with a token, so reading
  // the field labels afterwards returned "{{t:t18}}" instead of "Your Name" — the swap would have
  // mounted a form asking three questions named after their own placeholders.
  const formEl = root.querySelector("[data-sjc-form]");
  const formFields = formEl
    ? formEl
        .querySelectorAll("input,textarea")
        .filter((i) => i.getAttribute("type") !== "hidden")
        .map((i) => ({
          label: clean(
            formEl.querySelector(`label[for="${i.getAttribute("id")}"]`)?.text ||
              i.getAttribute("placeholder") ||
              i.getAttribute("name") ||
              "Field"
          ),
          inputType:
            i.getAttribute("type") === "email"
              ? "email"
              : i.getAttribute("type") === "tel"
                ? "tel"
                : "text",
        }))
    : [];
  const formButton = clean(formEl?.querySelector("button")?.text || "");

  walk(root);

  return {
    html: root.toString(),
    text,
    images,
    hasForm: !!formEl,
    formFields,
    formButton,
  };
}

/**
 * Split a whole imported page into top-level sections.
 *
 * A generated page is a flat run of <section>/<header>/<footer> siblings — that shape is what
 * app/api/import-html/route.ts already guards for. Each becomes one DesignSection block, which is
 * what gives Steven delete / reorder / duplicate at the section level.
 */
/**
 * The vertical padding a generated section shipped with, in px.
 *
 * Read so the builder's stepper OPENS at the design's real number instead of a guess — dialling
 * 128 down to 64 is obvious, dialling an arbitrary 80 is someone fighting the control.
 *
 * Tailwind's spacing scale is 4px per step (`py-20` = 80px). Where a section declares responsive
 * padding (`py-20 md:py-28 lg:py-32`) the LARGEST is taken, because that is the desktop value and
 * desktop is where the spacing looks wrong.
 */
export function paddingOf(sectionHtml: string): { top: number | null; bottom: number | null } {
  const open = String(sectionHtml || "").match(/<[a-z][a-z0-9]*\b[^>]*>/i)?.[0] || "";
  const cls = open.match(/class\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] || "";

  const biggest = (re: RegExp) => {
    let best: number | null = null;
    for (const m of cls.matchAll(re)) {
      const n = Number(m[1]) * 4;
      if (Number.isFinite(n) && (best === null || n > best)) best = n;
    }
    return best;
  };

  const py = biggest(/(?:^|\s|:)py-(\d+(?:\.\d+)?)\b/g);
  const pt = biggest(/(?:^|\s|:)pt-(\d+(?:\.\d+)?)\b/g);
  const pb = biggest(/(?:^|\s|:)pb-(\d+(?:\.\d+)?)\b/g);
  return { top: pt ?? py, bottom: pb ?? py };
}

export function splitSections(html: string): string[] {
  const root = parse(String(html || ""), { comment: false });

  // Find the element the sections actually live in, rather than guessing how many wrappers a
  // generator put around them. SiteDrop nests them in <html><body><div id="lp-root">; another
  // tool will nest them somewhere else. Taking the sections' own PARENT works for all of them.
  //
  // ⚠️ Getting this wrong is quiet and expensive: descending one level too few returns the whole
  // page as a single block, which still renders perfectly and still lets you edit every word —
  // so it looks like it worked, while section-level reorder and delete are silently gone.
  const anchors = root.querySelectorAll("section, header, footer, main");
  const host = (anchors.find((el) => el.parentNode)?.parentNode as HTMLElement | undefined) || root;

  const out: string[] = [];
  for (const el of host.childNodes) {
    if (!(el instanceof HTMLElement)) continue;
    const tag = el.rawTagName?.toLowerCase();
    if (!tag || tag === "script" || tag === "style") continue;
    out.push(el.toString());
  }
  return out;
}
