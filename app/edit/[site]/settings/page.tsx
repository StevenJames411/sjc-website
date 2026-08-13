import { notFound } from "next/navigation";
import SiteSettings from "@/components/edit/SiteSettings";
import { findSite } from "@/lib/sites";
import { readPages } from "@/lib/pageRegistry";
import { readBrand } from "@/lib/brand";
import { readPuckDraft, sheetsFor } from "@/lib/puckContent";
import { sizesIn, sampleFor, roleFor } from "@/lib/typeScale";
import { governingSize } from "@/lib/typeScaleMap";

// Everything global to one website. Static segment, so it wins over /edit/[site]/[page] — which
// is why "settings" is a reserved page slug (see lib/pageRegistry).
export const dynamic = "force-dynamic";

export default async function SiteSettingsPage({ params }: { params: Promise<{ site: string }> }) {
  const { site: id } = await params;
  const site = await findSite(id);
  if (!site) notFound();
  const pages = await readPages(id);
  // ⚠️ THE PUBLISHED BRAND, NOT THE DRAFT. This screen's fonts apply on click, so the value it
  // shows has to be the one the public site is actually using — reading the draft would show a
  // face nobody outside the studio can see. That exact gap is what put sjc-2026 on Lexend while
  // its draft held Space Grotesk: set once, never published, invisible either way.
  const brand = await readBrand(true, id);

  // ⛔ EVERY SIZE THE WHOLE WEBSITE USES, NOT JUST THIS PAGE'S. The complaint this screen answers is
  // "ten pages, six sections each, every one a different size" — so a list built from one page
  // would send him back to the same hunt with a nicer UI on it. Read every page's sheets, dedupe,
  // and show the union.
  //
  // ⚠️ DRAFTS, because that is what the builder edits and what he is looking at while he decides.
  const chromeDocs = await Promise.all(["nav", "footer"].map((sl) => readPuckDraft(sl, id)));
  const pageDocs = await Promise.all(pages.map((pg) => readPuckDraft(pg.slug, id)));
  const allDocs = [...pageDocs, ...chromeDocs].filter(Boolean);
  // Every imported block on the whole website, so a size can be shown with the words it sets.
  const blocks: { html?: string; text?: { key: string; value: string }[] }[] = [];
  const collect = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(collect);
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown> & { props?: Record<string, unknown>; type?: string };
    if (o.type === "DesignSection" && o.props) {
      blocks.push(o.props as { html?: string; text?: { key: string; value: string }[] });
    }
    for (const k of ["content", "zones", "props"]) if (o[k as keyof typeof o]) collect(o[k as keyof typeof o]);
  };
  allDocs.forEach(collect);
  // ⛔ GROUPED BY WHAT THE SIZE IS NOW, NOT BY WHAT THE DESIGN DECLARED.
  //
  // The list is built from the RAW stylesheets, so every original value is a row — and after a
  // collapse that means `h3 · 29px` showing 28 in its box, sitting directly above `h3 · 28px`
  // showing 28 in its box. Two rows doing the identical thing, and no sign anywhere that anything
  // had been collapsed. Steven: *"I don't know why some are highlighted and some aren't."*
  //
  // Grouping by the EFFECTIVE value makes the screen say what actually happened: one row per size
  // the website really uses, carrying the originals it absorbed. 36 rows become 21, which is the
  // change itself finally being visible.
  const raw = sizesIn(await sheetsFor(allDocs));
  const scale = brand?.typeScale || {};
  const groups = new Map<string, { effective: string; members: string[]; rules: number; selectors: string[] }>();
  for (const z of raw) {
    const eff = scale[z.value] || z.value;
    const g = groups.get(eff) || { effective: eff, members: [], rules: 0, selectors: [] };
    g.members.push(z.value);
    g.rules += z.rules;
    g.selectors = [...new Set([...g.selectors, ...z.selectors])];
    groups.set(eff, g);
  }
  const sizes = [...groups.values()]
    .map((g) => ({
      ...g,
      absorbed: g.members.filter((m) => m !== g.effective),
      changed: g.members.some((m) => !!scale[m]),
      sample: sampleFor(g.selectors, blocks),
      role: roleFor(g.selectors),
    }))
    .sort((a, b) => {
      const px = (v: string) => {
        const n = [...v.matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1]));
        return n.length ? Math.max(...n) : -1;
      };
      return px(b.effective) - px(a.effective) || a.effective.localeCompare(b.effective);
    });

  // ⛔ THE PANEL IS THE HOME PAGE. THIS IS THE WHOLE POINT AND I MISSED IT THREE TIMES.
  //
  // Steven, having said it in four different ways: *"I don't mind setting the header and the footer
  // and the rest of the home page one time, but then I want the other nine pages to follow suit…
  // The global panel should be a reflection of the header, the footer, and the home page sections.
  // So nobody's guessing what the fuck they're looking at. Every element that goes on a section is
  // the same element: H1, H2, H3, a pill, a book-a-call button, a phone number button. It's all
  // universal."*
  //
  // A list of 21 sizes sorted biggest-first is a stylesheet with a nicer font. This is the home
  // page, in the order it is read: the chrome first, then the hero, then down the page. Each entry
  // is an element he can point at, and setting it sets it everywhere BECAUSE the other nine pages
  // are built from the same elements.
  //
  // ⚠️ FIRST OCCURRENCE WINS, AND THE ORDER IS THE PAGE'S. Deduped by the size that governs it, so
  // the row is named by the first place that size is used going down the page — which is the place
  // he will recognise. Sizes that appear ONLY on other pages fall through to the full list below
  // rather than being hidden: he named that case himself, *"the only difference is when one page
  // has more sections than the home page."*
  const homeDoc = await readPuckDraft("home", id);
  const ordered: {
    declared: string;
    effective: string;
    members: string[];
    rules: number;
    role: string;
    sample: string;
    where: string;
    changed: boolean;
  }[] = [];
  const seenSize = new Set<string>();
  const walk = (doc: unknown, where: string) => {
    const found: { html?: string; text?: { key: string; value: string }[] }[] = [];
    const dig = (n: unknown) => {
      if (Array.isArray(n)) return n.forEach(dig);
      if (!n || typeof n !== "object") return;
      const o = n as Record<string, unknown> & { props?: Record<string, unknown>; type?: string };
      if (o.type === "DesignSection" && o.props) found.push(o.props as (typeof found)[number]);
      for (const k of ["content", "zones", "props"]) if (o[k as keyof typeof o]) dig(o[k as keyof typeof o]);
    };
    dig(doc);
    for (const b of found) {
      for (const row of b.text || []) {
        const declared = governingSize(String(b.html || ""), row.key, raw);
        if (!declared) continue;
        const g = groups.get(scale[declared] || declared);
        if (!g) continue;
        // ⚠️ DEDUPE ON THE COLLAPSED SIZE, NOT THE DECLARED ONE. Deduping by `declared` while
        // DISPLAYING `effective` put the same row on screen twice the moment two originals were
        // collapsed together — "Book a Call · 15px · 130 places" listed twice, identical, because
        // one line was declared 14.5px and the other 15px and both now render at 15. One row per
        // size the page actually shows.
        if (seenSize.has(g.effective)) continue;
        seenSize.add(g.effective);
        ordered.push({
          declared,
          effective: g.effective,
          members: g.members,
          rules: g.rules,
          role: roleFor(g.selectors),
          sample: (row.value || "").replace(/\s+/g, " ").trim().slice(0, 60),
          where,
          changed: g.members.some((m) => !!scale[m]),
        });
      }
    }
  };
  walk(chromeDocs[0], "Header");
  walk(homeDoc, "Home page");
  walk(chromeDocs[1], "Footer");

  // Everything the home page and chrome never show — other pages' extra sections.
  const elsewhere = sizes.filter((z) => !ordered.some((o) => o.effective === z.effective));

  return (
    <SiteSettings
      site={site}
      pageCount={pages.length}
      pages={pages.map((p) => ({ slug: p.slug, title: p.title }))}
      brand={brand}
      sizes={ordered}
      elsewhere={elsewhere}
    />
  );
}
