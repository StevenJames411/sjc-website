// Import-side handling of a bought design's markup: make it safe, then make it editable.
//
// Pairs with lib/designCss.ts (which turns the design's Tailwind classes into a real stylesheet)
// and components/blocks/DesignSection.tsx (which renders the result).

import { parse, HTMLElement, NodeType, type Node } from "node-html-parser";
import type { DesignText, DesignImage, DesignLink } from "@/components/blocks/DesignSection";

// Tags that can execute or phone home. A bought design has no business containing any of them,
// and the whole point of this pipeline is that the markup reaches a customer's live website.
const STRIP_TAGS = new Set(["script", "iframe", "object", "embed", "link", "meta", "base"]);

// ── THE ONE EXCEPTION: A VIDEO EMBED WE RECOGNISE ────────────────────────────────────────────
// `iframe` is on the strip list above and stays there, because an imported design must not be
// able to put an arbitrary frame on a customer's live site. But a podcast page IS its videos,
// and the embed code YouTube hands you is an iframe — so a blanket strip meant five interviews
// imported as five empty gaps, with the import still reporting success.
//
// So: an iframe survives ONLY if its src host is one of these. Anything else — an ad network, a
// tracker, a login form, a frame with no src at all — is removed exactly as before. Matched on
// the parsed HOST, never a substring of the URL: "youtube.com.evil.tld" is not youtube.com, and
// a `src="//..."` with no protocol resolves against https so it can't slip through as garbage.
const EMBED_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
]);

function isAllowedEmbed(src: string | undefined): boolean {
  const raw = String(src || "").trim();
  if (!raw) return false;
  try {
    const u = new URL(raw, "https://x.invalid");
    return u.protocol === "https:" && EMBED_HOSTS.has(u.host.toLowerCase());
  } catch {
    return false;
  }
}

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
      // See EMBED_HOSTS: a recognised video embed is the single allowed iframe.
      if (tag === "iframe" && isAllowedEmbed(el.getAttribute("src"))) {
        // Strip anything that could turn the frame into more than a player.
        el.removeAttribute("srcdoc");
        el.removeAttribute("onload");
        el.removeAttribute("onerror");
        el.setAttribute("loading", "lazy");
        el.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        // ⚠️ DELIBERATELY NO `sandbox`. The security control here is the HOST ALLOWLIST — the frame
        // can only ever point at YouTube or Vimeo. A sandbox on top of that adds nothing we need
        // and is a known way to break playback and fullscreen, which would ship as "the videos are
        // there but they don't work" — worse than the problem it pretends to solve.
        continue;
      }
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

// ── TAILWIND v3 OPACITY UTILITIES DIE SILENTLY UNDER v4 ───────────────────────────────────────
// The design tools emit v3 syntax — `bg-white bg-opacity-10` — and lib/designCss.ts compiles with
// v4, which replaced that whole family with a slash modifier (`bg-white/10`). v4 doesn't error on
// an unknown utility, it just emits nothing, so the class silently renders at FULL opacity.
//
// That is not a subtle shift. On Pecan Ridge it turned three translucent social buttons into
// solid white blocks with white icons on them (invisible), and four 20%-white icon tiles into
// glaring white slabs on a blue band. 24 dead classes across the two demos, none of them
// reported by anything, because a class that compiles to nothing looks exactly like a class the
// designer never wrote.
//
// Rewritten here, BEFORE tokenizing and before compiling, so the stored markup and the compiled
// stylesheet agree. ⚠️ It cannot retro-fix a site already imported: that stylesheet is compiled
// and stored. Existing sites need the inline-style patch instead.
const OPACITY_FAMILIES = "bg|text|border|divide|ring|placeholder|from|via|to";
const OPACITY_CLASS = new RegExp(`^((?:[\\w-]+:)*)(${OPACITY_FAMILIES})-opacity-(\\d+)$`);

// ⚠️ THE BASE HAS TO BE A *COLOUR*, NOT JUST THE SAME PREFIX. `border-t border-white
// border-opacity-20` matches `border-t` first on a naive prefix test, and produced the nonsense
// `border-t/20` while leaving `border-white` opaque. So a candidate only counts if what follows
// the family reads like a colour: a bare keyword, an arbitrary value, or a name-shade pair.
const COLOUR_VALUE = /^(inherit|current|transparent|black|white|\[[^\]]*\]|[a-z]+-\d{2,3})$/;

/** Rewrite `X-opacity-N` pairs to v4's `X/N` slash modifier, in every class attribute. */
export function modernizeOpacityUtilities(html: string): string {
  return String(html || "").replace(/\bclass="([^"]*)"/g, (whole, value: string) => {
    if (!value.includes("-opacity-")) return whole;
    const tokens = value.split(/\s+/).filter(Boolean);
    const drop = new Set<number>();
    const add: string[] = [];

    tokens.forEach((tok, i) => {
      const m = tok.match(OPACITY_CLASS);
      if (!m) return;
      const [, variant, family, amount] = m;
      const baseOf = (want: string) =>
        tokens.findIndex((t, j) => {
          if (j === i || drop.has(j) || t.includes("/")) return false;
          const head = `${want}${family}-`;
          return t.startsWith(head) && COLOUR_VALUE.test(t.slice(head.length));
        });

      // The utility is dead under v4 either way, so it always goes.
      drop.add(i);

      const same = baseOf(variant);
      if (same >= 0) {
        tokens[same] = `${tokens[same]}/${amount}`;
        return;
      }
      // ⚠️ A variant-only opacity (`hover:bg-opacity-90` over a plain `bg-[var(--accent)]`) must
      // ADD a hover token, never rewrite the base — mutating it in place deleted the normal-state
      // background entirely and the button rendered transparent until you moused over it.
      if (!variant) return;
      const plain = baseOf("");
      if (plain >= 0) add.push(`${variant}${tokens[plain]}/${amount}`);
    });

    const out = [...tokens.filter((_, i) => !drop.has(i)), ...add].join(" ");
    return `class="${out}"`;
  });
}

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
  links: DesignLink[];
  hasForm: boolean;
  formFields: { label: string; inputType: string }[];
  formButton: string;
} {
  const root = parse(sanitizeDesignHtml(html), { comment: false });
  const text: DesignText[] = [];
  const images: DesignImage[] = [];
  const links: DesignLink[] = [];

  // ── A NAV EXISTS TWICE, AND USED TO EDIT ONCE ────────────────────────────────────────────────
  //
  // Every responsive design ships its menu twice: the row across the top, and the stack that
  // opens behind the burger on a phone. Same links, different markup. Tokenising walked them as
  // two unrelated sets, so "Services" appeared as two rows in the editor with nothing saying
  // which was which.
  //
  // The failure was one-sided and invisible on a laptop: delete the row for the desktop copy and
  // the link disappears from the page you're looking at — and stays on every phone. You cannot
  // see it unless you pick up a phone, which is exactly where a contractor's customers are.
  //
  // Identical links (same destination, same words) now share ONE key, so one row drives both
  // copies: rename it once, both change; delete it once, both go.
  //
  // ⚠️ THE TEXT KEYS HAVE TO BE PAIRED TOO, not just the destination. The link's words are a
  // separate token from its href — pairing only the href would leave the destinations in step
  // while the two labels drifted apart, which is worse than the bug it replaced.
  //
  // ⚠️ Scoped to ONE section, and to links that match on BOTH destination and words. Two buttons
  // reading "Get Free Quote" that both point at /contact genuinely are the same button, and
  // editing them together is what anyone would expect.
  const linkSig = new Map<string, { key: string; textKeys: string[] }>();

  /**
   * @param reuse when walking the second copy of a paired link, the text keys the FIRST copy
   *              created, in order — popped as each text node is met so both copies point at the
   *              same editable row instead of minting new ones.
   */
  const walk = (node: Node, reuse?: string[]) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === NodeType.TEXT_NODE) {
        const raw = child.rawText;
        if (!raw || !raw.trim()) continue;
        // Second copy of a paired link: point at the first copy's row, add no new one.
        if (reuse && reuse.length) {
          const shared = reuse.shift() as string;
          const [, lead0 = "", , trail0 = ""] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
          child.rawText = `${lead0}{{t:${shared}}}${trail0}`;
          continue;
        }
        const parent = node instanceof HTMLElement ? node : null;
        if (parent && TEXT_SKIP.has(parent.rawTagName?.toLowerCase() || "")) continue;
        const key = `t${text.length + 1}`;
        // ⚠️ DECODED, NOT RAW. rawText keeps the design's entities as literal characters
        // (`&amp;`, `&mdash;`, `&#39;`), and DesignSection's fillTokens() escapes every value
        // again on the way out — correctly, that's the XSS guard. So a stored `&amp;` reached
        // the visitor as the visible text "&amp;", and both demos shipped with a nav reading
        // "Tile &amp; Flooring". A stored value is the words a person would type; escaping on
        // the way out is the renderer's job, and it must not be done twice.
        const value = child.text.trim();
        text.push({ key, label: labelFor(parent, value, text.length + 1), value });
        // Preserve the original surrounding whitespace so inline layout doesn't shift.
        const [, lead = "", , trail = ""] = raw.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
        child.rawText = `${lead}{{t:${key}}}${trail}`;
        continue;
      }
      if (child instanceof HTMLElement) {
        // ⚠️ WHERE A LINK GOES IS CONTENT, NOT DESIGN. Only the link's TEXT was editable, so a
        // footer could be renamed but every destination stayed whatever the generator invented —
        // "Call" dialling a made-up number, nav items pointing at sections that don't exist.
        // Unusable on a client's site, and not fixable without a code change.
        if (child.rawTagName?.toLowerCase() === "a") {
          // Normalised BEFORE anything else reads it, so the pairing signature, the label and the
          // stored editable value all agree on one destination.
          const href = normalizeInternalHref(child.getAttribute("href") || "");
          if (href) {
            // Same destination AND same words = the desktop and mobile copies of one link.
            const sig = `${href.trim()}||${clean(child.text)}`;
            const paired = linkSig.get(sig);
            if (paired) {
              child.setAttribute("href", `{{h:${paired.key}}}`);
              child.setAttribute("data-sjc-link", paired.key);
              // Walk this copy handing it the first copy's text keys, then move on — no new rows.
              walk(child, [...paired.textKeys]);
              continue;
            }

            const key = `h${links.length + 1}`;
            // An icon-only link has no text, so the list would read "Link 1, Link 2, Link 3"
            // and you'd have to guess which social button you were editing. aria-label is what
            // the design already wrote there for screen readers.
            const label =
              clean(child.text).slice(0, 40) ||
              clean(child.getAttribute("aria-label") || "") ||
              clean(child.getAttribute("title") || "") ||
              (href.startsWith("tel:")
                ? `Call ${href.slice(4)}`
                : href.startsWith("mailto:")
                  ? `Email ${href.slice(7)}`
                  : `Link ${links.length + 1}`);
            links.push({ key, label, href });
            child.setAttribute("href", `{{h:${key}}}`);
            // Marked so the renderer can REMOVE this link if its row is deleted. Without a
            // marker, deleting a row only blanked the destination and the link stayed on the
            // page pointing nowhere — five dead social icons you couldn't get rid of.
            child.setAttribute("data-sjc-link", key);

            // Walk it now and record which text rows it created, so the mobile copy can reuse
            // exactly those, in order. Snapshotting around the walk handles a link that holds
            // more than one text node — an icon plus a label is the common case.
            const before = text.length;
            walk(child);
            linkSig.set(sig, { key, textKeys: text.slice(before).map((t) => t.key) });
            continue;
          }
        }
        if (child.rawTagName?.toLowerCase() === "img") {
          const src = child.getAttribute("src") || "";
          if (src) {
            const key = `i${images.length + 1}`;
            images.push({ key, alt: child.getAttribute("alt") || `Image ${images.length + 1}`, src });
            child.setAttribute("src", `{{i:${key}}}`);
            // Marked so a size/crop override can be applied to THIS image later. The token lives
            // in the src attribute, which styles nothing — the element itself has to be findable.
            child.setAttribute("data-sjc-img", key);
          }
        }
        // `reuse` is passed down, not dropped: a nav link is usually <a><span>Services</span></a>,
        // so the text node lives one level below the <a> that was paired. Without threading it
        // here the mobile copy minted a fresh row and the pairing did nothing at all.
        walk(child, reuse);
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
    links,
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

/** Element children, skipping text nodes and anything that can't be a band. */
function elementKids(el: HTMLElement): HTMLElement[] {
  return el.childNodes.filter(
    (n): n is HTMLElement =>
      n instanceof HTMLElement && !!n.rawTagName && n.rawTagName.toLowerCase() !== "script"
  );
}

const HEADING = /<h[1-4]\b/i;

/**
 * Split ONE oversized block into the bands hiding inside it.
 *
 * ── THE CASE THIS EXISTS FOR ─────────────────────────────────────────────────────────────────
 * The top-level pass cuts on the design's own `<section>` boundaries, which works when whoever
 * built it used them — the studio home page splits into seven. The portfolio page didn't: hero,
 * builds grid, banner and two more bands all shipped inside a SINGLE `<section class="pf">`.
 * Splitting found one block, correctly, and there was nothing to reorder or delete. Nine
 * headings, one block.
 *
 * ⚠️ THE WRAPPER IS CLONED ONTO EVERY PIECE, and that is the whole reason this is safe. `.pf`
 * carries the dark background and the white text for everything inside it. Lifting the five
 * children out and dropping the wrapper would give five correctly-separated bands of black text
 * on white — layout intact, design destroyed. Each piece keeps the wrapper.
 *
 * ⚠️ ONLY ON A CLEAR MULTI-BAND BLOCK: three or more children that EACH carry a heading of their
 * own. A services section is `[h2, p, div.grid]` — one child with a heading, two without — so it
 * fails the test and stays whole, which is right. Cutting a section into its heading, its
 * paragraph and its card grid is worse than not cutting it at all.
 *
 * Returns null when the block should be left alone, which is the common case.
 */
export function explodeBands(block: string): string[] | null {
  const root = parse(block, { comment: false });
  const el = root.childNodes.find((n): n is HTMLElement => n instanceof HTMLElement);
  if (!el || !el.rawTagName) return null;

  const kids = elementKids(el);
  // A <style> inside the wrapper defines the classes every band below it uses, so it rides along
  // with each piece rather than staying with whichever band happened to contain it.
  const styles = kids.filter((k) => k.rawTagName.toLowerCase() === "style");
  const bands = kids.filter((k) => k.rawTagName.toLowerCase() !== "style");

  const withHeading = bands.filter((b) => HEADING.test(b.toString()));
  if (bands.length < 3 || withHeading.length < 3) return null;

  const tag = el.rawTagName;
  const styleHtml = styles.map((s) => s.toString()).join("");
  const attrs = (el.rawAttrs || "").trim();
  // Drop `id` after the first piece. The wrapper's id would otherwise repeat on every band, and
  // a duplicated id silently breaks in-page anchor links — the same class of failure as the bare
  // `#anchor` hrefs that died the day a second page existed.
  const attrsNoId = attrs.replace(/\s*\bid\s*=\s*("[^"]*"|'[^']*'|\S+)/i, "").trim();

  return bands.map((b, i) => {
    const a = i === 0 ? attrs : attrsNoId;
    return `<${tag}${a ? " " + a : ""}>${styleHtml}${b.toString()}</${tag}>`;
  });
}

/**
 * Turn a design's page-to-page link into a route this site actually serves.
 *
 * ── THE FAILURE ───────────────────────────────────────────────────────────────────────────────
 * A generated design links between its pages by FILENAME — `href="custom-websites.html"` — because
 * it was built as a folder of files you open off a disk. We serve those same pages as ROUTES
 * (`/custom-websites`), so every one of those links 404s the moment the site is live. On sjc-2026
 * that was the entire nav and the entire footer: 9 destinations, every page, both menus.
 *
 * ⚠️ IT SURVIVES EVERY OBVIOUS CHECK. The pages import fine, publish fine, and each one loads
 * perfectly when you type its address — the only thing broken is getting there by clicking, which
 * is the only way a visitor ever does it.
 *
 * Left alone deliberately:
 *   - absolute URLs, `tel:`, `mailto:`, `sms:` and anything else with a scheme — not ours to touch
 *   - `/already-a-route` — already correct
 *   - `#anchor` — an in-page target, a different problem (and one that needs a human to say where
 *     it should point when the target doesn't exist)
 *
 * `index.html` becomes `/` rather than `/home`, because the root is what the site actually serves
 * and what a person would type.
 */
export function normalizeInternalHref(href: string): string {
  const raw = String(href || "").trim();
  if (!raw) return raw;
  // Anything with a scheme (http:, tel:, mailto:, //cdn…) or already rooted, or a bare anchor.
  if (/^([a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(raw)) return raw;

  // Split off ?query and #hash so they survive the rewrite.
  const m = raw.match(/^([^?#]*)([?#][\s\S]*)?$/);
  if (!m) return raw;
  const path = m[1].replace(/^\.\//, "");
  const tail = m[2] || "";
  if (!/\.html?$/i.test(path)) return raw;

  const name = path.replace(/\.html?$/i, "").replace(/^.*\//, "");
  if (!name || /^index$/i.test(name)) return `/${tail}`;
  return `/${name}${tail}`;
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
    const block = el.toString();
    // One extra level, and only where the block is obviously several bands in a trench coat.
    // Deliberately not recursive: a second pass would start cutting card grids into cards.
    const bands = explodeBands(block);
    if (bands) out.push(...bands);
    else out.push(block);
  }
  return out;
}
