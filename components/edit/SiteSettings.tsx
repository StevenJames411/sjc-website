"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reachability, type Site } from "@/lib/sitesShared";
import { FONTS as FONT_VAR_KEYS, FONT_SETS, FONT_VAR, SWATCHES, fontsForSet, type Brand, type BrandFont } from "@/lib/brandShared";
import { publicUrlFor } from "@/lib/hostShared";

// EVERYTHING GLOBAL TO ONE WEBSITE, ON ONE SCREEN.
//
// The card in the gallery carries the company name and nothing else; you open the website and set
// its details here — the same shape GoHighLevel and Landingsite use. Before this, the business's
// phone number and address existed only as text typed inside individual blocks, which is why
// copying a finished site dragged the previous owner's details along with it.
//
// Fill this in once and the whole website can use it: any text on any block can carry a token
// like {{business.phone}} and it resolves at render. Change the number here, every page updates.

type Props = {
  site: Site;
  pageCount: number;
  pages: { slug: string; title: string }[];
  brand: Brand;
  /** Every distinct text size this website's designs use, biggest first. See lib/typeScale. */
  /**
   * The home page, in the order it is read — header, hero, down the page, footer. One entry per
   * element, named by the words on it. See the note in app/edit/[site]/settings/page.tsx.
   */
  sizes: {
    declared: string;
    effective: string;
    members: string[];
    rules: number;
    role: string;
    sample: string;
    where: string;
    changed: boolean;
    selectors: string[];
  }[];
  /** Every colour the imported designs declare, most-used first. See lib/designColors. */
  designColors: {
    value: string;
    rules: number;
    props: string[];
    selectors: string[];
    dark: boolean;
    current: string;
    changed: boolean;
  }[];
  /** Sizes that appear only on pages with more sections than the home page. */
  elsewhere: {
    effective: string;
    members: string[];
    absorbed: string[];
    changed: boolean;
    rules: number;
    selectors: string[];
    sample: string;
    role: string;
  }[];
};

const TOKENS: [string, keyof Site["business"]][] = [
  ["{{business.name}}", "name"],
  ["{{business.phone}}", "phoneDisplay"],
  ["{{business.email}}", "email"],
  ["{{business.address}}", "address"],
  ["{{business.hours}}", "hours"],
  // Listed like the rest so the review form's button reads as a normal reference rather than
  // machinery — it is the one token that resolves to a LINK instead of words.
  ["{{business.reviewUrl}}", "reviewUrl"],
];

export default function SiteSettings({ site, pageCount, pages, brand, sizes, elsewhere, designColors }: Props) {
  const router = useRouter();
  const [s, setS] = useState<Site>(site);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [sweepMsg, setSweepMsg] = useState("");
  const [fonts, setFonts] = useState<Brand>(brand);
  const [fontMsg, setFontMsg] = useState("");

  /**
   * ONE CLICK. Pick a face and the live website is wearing it — no draft, no second Publish.
   *
   * ⛔ THE THREE SIDESTEPS THIS DELETES, AND WHY EACH ONE HAD TO GO (Steven, 2026-08-13:
   * *"just like a customer, I set my own website to what I like and I'm done with it… with one
   * click they change the damn font family. We don't have to do three side steps in between."*)
   *
   *   1. A SEPARATE SCREEN AT A URL WITH NO LINK TO IT. The picker lived at /edit/<site>/brand and
   *      nothing in the studio pointed there, so the honest summary was that it did not exist:
   *      *"obviously I can't get to something I can't see."*
   *   2. A DRAFT THAT LOOKED SAVED. Picking wrote a draft; publishing was a separate button on
   *      that same invisible screen. sjc-2026 sat with Space Grotesk saved and Lexend live for
   *      weeks — the screen agreed with him and the website disagreed, with nothing on either to
   *      say so.
   *   3. AN IMPORTED SECTION IGNORING THE ANSWER ANYWAY, until stripFontFamily (lib/designCss)
   *      stopped the design's compiled sheet from out-ranking the brand.
   *
   * So this writes the draft and publishes in the same click. The rest of this screen already
   * behaves that way — a phone number typed here is live when it saves — and a control that
   * behaves differently from its neighbours is the thing that teaches nobody to trust it.
   */
  /**
   * Same contract as the fonts above: merge onto the DRAFT, publish only what this control owns.
   *
   * ⛔ WHY COLOURS MOVED HERE. `/edit/<site>/brand` was never linked from anywhere in the studio,
   * and the back-office rail's "Brand" entry carries no site parameter — so opening it from inside
   * a client's builder edited STEVEN'S palette. A client's colours had no reachable editor at all:
   * they could be stored and they could be rendered, and there was nowhere to set them.
   *
   * Debounced because a colour input fires continuously while the swatch is dragged; without it a
   * single pick is dozens of publishes.
   */
  const colourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pickColour(key: keyof Brand, value: string) {
    const next = { ...fonts, [key]: value } as Brand;
    setFonts(next);
    setFontMsg("Saving…");
    if (colourTimer.current) clearTimeout(colourTimer.current);
    colourTimer.current = setTimeout(async () => {
      try {
        const cur = await fetch(`/api/brand?site=${encodeURIComponent(s.id)}`, {
          credentials: "same-origin",
        }).then((x) => x.json());
        const merged = { ...(cur?.brand || {}), ...pickOnly(next, SWATCHES.map((w) => w.key)) };
        const put = await fetch("/api/brand", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, brand: merged }),
        }).then((x) => x.json());
        if (!put.ok) throw new Error(put.error || "Couldn't save the colour.");
        const pub = await fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, action: "publish-colours" }),
        }).then((x) => x.json());
        if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
        setFontMsg("Live on the website.");
        router.refresh();
      } catch (e) {
        setFontMsg((e as Error).message);
      }
    }, 500);
  }

  /**
   * One text size, changed everywhere it is used.
   *
   * ⛔ THE COMPLAINT THIS ANSWERS, VERBATIM: *"I have to go back through this website, this 10-page
   * website that has six sections per page, and match everything. That'll take me all fucking
   * day."* Three merged designs left 36 distinct sizes on four pages — 13px, 13.5px, 14.5px, 15px
   * and 15.5px all doing the same job. Each was editable one text row, one section, one page at a
   * time. This is the same decision made once.
   *
   * Keyed by the design's ORIGINAL value, so "everything that was 13.5px is now 15px" — which is
   * how he described it: *"some of these sections share the font size."*
   */
  const sizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Set one ROW — which may be several original sizes that were collapsed together.
   *
   * ⚠️ EVERY MEMBER, NOT JUST THE ONE THE ROW IS NAMED AFTER. A row reading "13px · was 12, 12.5,
   * 13.5" is four declared values pointing at one number; writing only the first would silently
   * split the group back apart the moment somebody nudged it.
   */
  /**
   * A typeface for ONE element — the wordmark, a badge, a pull-quote.
   *
   * ⛔ WHY THIS ISN'T A "LOGO FONT" FIELD. Steven's design sets its wordmark in a serif over a
   * geometric sans everywhere else, and the brand had two slots — Headline and Body — so stripping
   * the design's own font collapsed the logo into the heading face: *"the main noticeable
   * difference is where my company name is. That font is not the same design as I purchased."*
   * A logo is simply the first element that needed a third face; the next design will want one on
   * a price or a badge. Keyed by the design's own selector, so any element the panel can name can
   * have one and nothing new has to be added for the next case.
   */
  /**
   * One of the DESIGN'S colours, changed everywhere it appears.
   *
   * ⛔ SEPARATE FROM THE THIRTEEN BRAND SWATCHES BELOW, AND IT HAS TO BE. Those set OUR variables,
   * which our blocks paint from. A bought design paints from its own literal hex — 26 distinct
   * values on this site, none of them pointing at a brand variable — so the brand swatches could
   * never touch an imported band. This list is what the design actually declares.
   */
  const dcTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pickDesignColor(original: string, next: string) {
    const map = { ...((fonts.colorMap as Record<string, string>) || {}) };
    if (!next || next.toLowerCase() === original.toLowerCase()) delete map[original];
    else map[original] = next;
    setFonts({ ...fonts, colorMap: map } as Brand);
    setFontMsg("Saving…");
    if (dcTimer.current) clearTimeout(dcTimer.current);
    dcTimer.current = setTimeout(async () => {
      try {
        const cur = await fetch(`/api/brand?site=${encodeURIComponent(s.id)}`, { credentials: "same-origin" }).then((x) => x.json());
        const put = await fetch("/api/brand", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, brand: { ...(cur?.brand || {}), colorMap: map } }),
        }).then((x) => x.json());
        if (!put.ok) throw new Error(put.error || "Couldn't save the colour.");
        const pub = await fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, action: "publish-designcolors" }),
        }).then((x) => x.json());
        if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
        setFontMsg("Live on the website.");
        router.refresh();
      } catch (e) {
        setFontMsg((e as Error).message);
      }
    }, 500);
  }

  function pickFace(selectors: string[], font: string) {
    const faceFor = { ...((fonts.faceFor as Record<string, string>) || {}) };
    for (const sel of selectors) {
      if (!font) delete faceFor[sel];
      else faceFor[sel] = font;
    }
    const next = { ...fonts, faceFor } as Brand;
    setFonts(next);
    setFontMsg("Saving…");
    void (async () => {
      try {
        const cur = await fetch(`/api/brand?site=${encodeURIComponent(s.id)}`, { credentials: "same-origin" }).then((x) => x.json());
        const merged = { ...(cur?.brand || {}), faceFor };
        const put = await fetch("/api/brand", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, brand: merged }),
        }).then((x) => x.json());
        if (!put.ok) throw new Error(put.error || "Couldn't save the font.");
        const pub = await fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, action: "publish-faces" }),
        }).then((x) => x.json());
        if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
        setFontMsg("Live on the website.");
        router.refresh();
      } catch (e) {
        setFontMsg((e as Error).message);
      }
    })();
  }

  function pickSizeGroup(members: string[], next: string) {
    const scale = { ...(fonts.typeScale || {}) };
    for (const m of members) {
      if (!next || next === m) delete scale[m];
      else scale[m] = next;
    }
    commitScale(scale);
  }

  function pickSize(original: string, next: string) {
    const scale = { ...(fonts.typeScale || {}) };
    // Back to the design's own value = REMOVE the key, never store a self-mapping. A stored
    // `{"15px":"15px"}` reads as "somebody chose this" forever and survives the design changing.
    if (!next || next === original) delete scale[original];
    else scale[original] = next;
    commitScale(scale);
  }

  function commitScale(scale: Record<string, string>) {
    const nextBrand = { ...fonts, typeScale: scale } as Brand;
    setFonts(nextBrand);
    setFontMsg("Saving…");
    if (sizeTimer.current) clearTimeout(sizeTimer.current);
    sizeTimer.current = setTimeout(async () => {
      try {
        const cur = await fetch(`/api/brand?site=${encodeURIComponent(s.id)}`, {
          credentials: "same-origin",
        }).then((x) => x.json());
        const merged = { ...(cur?.brand || {}), typeScale: scale };
        const put = await fetch("/api/brand", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, brand: merged }),
        }).then((x) => x.json());
        if (!put.ok) throw new Error(put.error || "Couldn't save the size.");
        const pub = await fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, action: "publish-sizes" }),
        }).then((x) => x.json());
        if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
        setFontMsg("Live on the website.");
        router.refresh();
      } catch (e) {
        setFontMsg((e as Error).message);
      }
    }, 600);
  }

  async function pickSet(key: string) {
    const pair = fontsForSet(key, fonts);
    await pickFont({ ...fonts, ...pair, fontSet: key });
  }

  async function pickFont(next: Brand) {
    const before = fonts;
    setFonts(next); // optimistic: the sample text below re-renders in the new face immediately
    setFontMsg("Saving…");
    try {
      // ⛔ MERGE ONTO THE DRAFT — NEVER PUT THIS SCREEN'S COPY OVER IT.
      //
      // This screen is loaded with the PUBLISHED brand, because what it shows has to be what the
      // public sees. Writing that object back as the draft would silently discard every unpublished
      // colour change made on the brand screen — a second door quietly reverting the first door's
      // work, with a green "Live on the website" on top of it.
      //
      // So: read the draft, lay ONLY the typography over it, and publish only those fields.
      const cur = await fetch(`/api/brand?site=${encodeURIComponent(s.id)}`, {
        credentials: "same-origin",
      }).then((x) => x.json());
      const draft = (cur?.brand || {}) as Brand;
      const merged: Brand = {
        ...draft,
        font: next.font,
        headingFont: next.headingFont,
        fontSet: next.fontSet,
        designFont: next.designFont,
        designHeadingFont: next.designHeadingFont,
      };
      const put = await fetch("/api/brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ site: s.id, brand: merged }),
      }).then((x) => x.json());
      if (!put.ok) throw new Error(put.error || "Couldn't save the font.");
      const pub = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ site: s.id, action: "publish-fonts" }),
      }).then((x) => x.json());
      if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
      setFontMsg("Live on the website.");
      router.refresh();
    } catch (e) {
      // ⚠️ PUT THE PICKER BACK. Leaving it on the face that failed to save is the same lie as #2.
      setFonts(before);
      setFontMsg((e as Error).message);
    }
  }

  /** Catch-up sweep: link every page of this website to the fields above. */
  async function sweep() {
    setBusy(true);
    setSweepMsg("");
    try {
      const post = (slug: string, dryRun: boolean) =>
        fetch("/api/admin/tokenize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, slug, dryRun }),
        }).then((r) => r.json());

      const looks = await Promise.all(pages.map((p) => post(p.slug, true)));
      const total = looks.reduce((n, l) => n + (l?.total || 0), 0);
      if (!total) {
        setSweepMsg("Nothing to link — these pages either match nothing here, or are already linked.");
        return;
      }
      if (!window.confirm(`Link ${total} value${total === 1 ? "" : "s"} across ${pages.length} page(s)?\n\nSaved as drafts — Publish each page when you've looked at it.`))
        return;

      const done = await Promise.all(pages.map((p) => post(p.slug, false)));
      const n = done.reduce((a, d) => a + (d?.total || 0), 0);
      setSweepMsg(`Linked ${n} value${n === 1 ? "" : "s"}. Open each page and Publish to put it live.`);
    } catch {
      setSweepMsg("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * "Make every page obey these settings" — the recompile, with a button on it.
   *
   * ⛔ THIS WAS A CURL WITH A BEARER TOKEN, AND IT IS THE FIX FOR THE BUG THAT COST A MORNING.
   *
   * An imported design's stylesheet is compiled once, at import, and stored immutably. Sections
   * imported before the compiler learned to leave typography to the brand keep their own
   * font-family forever — so a font picked here changed the pages that had been recompiled and no
   * others. Steven: *"it updated the home page… when I go to another page, it's serving up the
   * design that we imported in the first place."*
   *
   * The route existed the whole time and had no caller anywhere in the UI. A capability behind a
   * terminal is a capability the product does not have.
   *
   * ⚠️ publish: true — it repoints the PUBLISHED pages, not just the drafts. That is the whole
   * point: this is a global setting being applied, and the alternative is publishing ten pages by
   * hand and shipping whatever half-finished drafts sit in them. It changes only which stylesheet
   * each page loads — never its content.
   */
  async function applyEverywhere() {
    setBusy(true);
    setSweepMsg("");
    try {
      const call = (dryRun: boolean) =>
        fetch("/api/admin/recompile-css", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, dryRun, publish: true }),
        }).then((r) => r.json());

      const look = await call(true);
      if (!look?.ok) throw new Error(look?.error || "Couldn't check this website.");
      const n = (look.sheets || []).length;
      if (!n) {
        setSweepMsg("Every page is already following your settings — nothing to do.");
        return;
      }
      const pageNames = [...new Set((look.sheets || []).flatMap((x: { pages?: string[] }) => x.pages || []))];
      if (!window.confirm(`Bring ${pageNames.length} page(s) onto your current fonts and colours?\n\n${pageNames.join(", ")}\n\nThis changes only how they are styled, not what they say.`))
        return;
      const done = await call(false);
      if (!done?.ok) throw new Error(done?.error || "Couldn't apply it.");
      setSweepMsg(`Done — ${(done.livePages || []).length} page(s) now follow your settings.`);
      router.refresh();
    } catch (e) {
      setSweepMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /**
   * "Fix the links on this website" — the highest-severity repair in the product, and it has had no
   * button since the day it was written.
   *
   * ⛔ WHAT IT UNDOES. A generated design links between its pages BY FILENAME —
   * `href="custom-websites.html"` — because it was built as a folder you open off a disk. We serve
   * those as routes, so every one of those links 404s the moment the site is live.
   *
   * ⚠️ IT SURVIVES EVERY OBVIOUS CHECK, which is why it needs a button rather than vigilance. The
   * pages import, publish and load perfectly when you TYPE their address. The only broken thing is
   * getting there by CLICKING — which is the only way a visitor ever does it. On sjc-2026 that was
   * the entire nav and the entire footer, on all ten pages, while every page reported healthy.
   *
   * The importer normalises this now; this is for the sites imported before it did, where
   * re-importing would discard every page built out since.
   */
  async function fixLinks() {
    setBusy(true);
    setSweepMsg("");
    try {
      const call = (dryRun: boolean) =>
        fetch("/api/admin/repair-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ site: s.id, dryRun, publish: true }),
        }).then((r) => r.json());

      const look = await call(true);
      if (!look?.ok) throw new Error(look?.error || "Couldn't check the links.");
      const total = Number(look.total || 0);
      if (!total) {
        setSweepMsg("Every link on this website already points at a real page.");
        return;
      }
      const unmatched = (look.unmatched || []).length;
      if (
        !window.confirm(
          `Repoint ${total} link${total === 1 ? "" : "s"} to the pages this website actually serves?` +
            (unmatched ? `\n\n${unmatched} link(s) name a page that does not exist here and will be left alone.` : "")
        )
      )
        return;
      const done = await call(false);
      if (!done?.ok) throw new Error(done?.error || "Couldn't fix them.");
      setSweepMsg(`Fixed ${done.total || total} link${(done.total || total) === 1 ? "" : "s"}.`);
      router.refresh();
    } catch (e) {
      setSweepMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const biz = (k: keyof Site["business"], v: string) =>
    setS({ ...s, business: { ...s.business, [k]: v } });
  const seo = (k: keyof Site["seo"], v: string) => setS({ ...s, seo: { ...s.seo, [k]: v } });

  async function save() {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          id: s.id,
          name: s.name.trim(),
          description: s.description || "",
          domain: (s.domain || "").trim(),
          holdIndexing: !!s.holdIndexing,
          leadEmail: (s.leadEmail || "").trim(),
          sheetId: (s.sheetId || "").trim(),
          // ⚠️ MISSING FROM THIS PAYLOAD UNTIL 2026-08-12 — the third lead destination, and the one
          // the offer is sold on. Without it here the new field would type, look saved, and drop
          // the value on the floor: the worst version of a bug, because the screen agrees with you.
          ghlWebhookUrl: (s.ghlWebhookUrl || "").trim(),
          business: s.business,
          seo: s.seo,
          // ⚠️ IN THE PAYLOAD OR IT IS NOT SAVED. This screen has shipped a field that typed, looked
          // saved and dropped its value on the floor before — ghlWebhookUrl, 2026-08-12. The worst
          // version of a bug, because the screen agrees with you.
          accounts: s.accounts || {},
        }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't save.");
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={page}>
      {/* "← All websites" lived here until the rail took over global navigation. */}
      <h1 style={h1}>{s.name}</h1>
      <p style={sub}>
        {pageCount} page{pageCount === 1 ? "" : "s"} · set once here, used across the whole website
      </p>

      <h2 style={sec}>The business</h2>
      <p style={hint}>
        These are the facts about the company. Put a token from the list below into any text on any
        page and it fills itself in from here.
      </p>
      <Field label="Business name" v={s.business.name} on={(v) => biz("name", v)} ph="Your Business Name" />
      <Row>
        <Field label="Phone — as people read it" v={s.business.phoneDisplay} on={(v) => biz("phoneDisplay", v)} ph="(555) 123-4567" />
        <Field label="Phone — as it dials" v={s.business.phone} on={(v) => biz("phone", v)} ph="+15551234567" />
      </Row>
      <Field label="Email" v={s.business.email} on={(v) => biz("email", v)} ph="hello@yourbusiness.com" />
      <Field label="Address" v={s.business.address} on={(v) => biz("address", v)} ph="123 Main Street, Your City, ST 00000" />
      <Field label="Hours" v={s.business.hours} on={(v) => biz("hours", v)} ph="Mon – Fri: 9:00 AM – 5:00 PM" />
      {/* A DESTINATION, so it lives on the business and not on the shared review form — see
          BusinessFacts.reviewUrl. Blank simply hides the button on the thank-you screen. */}
      <Field
        label="Google review link — where a happy customer is sent"
        v={s.business.reviewUrl || ""}
        on={(v) => biz("reviewUrl", v)}
        ph="https://g.page/r/…/review — blank hides the button"
      />

      <div style={tokenBox}>
        <strong style={{ fontSize: 13 }}>Tokens you can paste into any text block</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.8 }}>
          {TOKENS.map(([t, k]) => (
            <li key={t}>
              <code style={code}>{t}</code>{" "}
              <span style={{ color: "var(--e-muted)" }}>→ {s.business[k] || <em>not set</em>}</span>
            </li>
          ))}
        </ul>
        <p style={{ ...hint, marginTop: 10 }}>
          The builder shows the token; the live page shows the value. That way editing a page can
          never bake the number in and break the link back to this screen.
        </p>

        {/* An IMPORTED website is wired to these automatically — the importer writes the tokens
            as it parses. This is the catch-up for pages built before that, or where someone typed
            a number in by hand. It lives here, beside the fields it reads, rather than in the page
            toolbar where it would be a one-off task sitting in permanent view. */}
        <div style={{ borderTop: "1px solid var(--e-line)", marginTop: 14, paddingTop: 14 }}>
          <button type="button" style={ghost} onClick={sweep} disabled={busy}>
            {busy ? "Working…" : "Apply these to existing pages"}
          </button>
          <p style={{ ...hint, margin: "8px 0 0" }}>
            Finds these values typed into the pages of this website and swaps them for the tokens
            above. New imports arrive already wired, so this is only for older pages.
          </p>
          {sweepMsg ? <p style={{ ...hint, margin: "8px 0 0", color: "var(--e-ok-ink)" }}>{sweepMsg}</p> : null}
        </div>
      </div>

      <h2 style={sec}>Web address</h2>
      <Field
        label="Custom domain (leave blank until they've bought one)"
        v={s.domain || ""}
        on={(v) => setS({ ...s, domain: v })}
        ph="theirbusiness.com"
      />
      {/* ⛔ THIS USED TO ASSUME `kind === "sjc"` MEANT "OWNS THE DOMAIN", AND IT LIED (fixed
          2026-08-12). sjc-2026 is kind `client` and serves stevenjamesconsulting.com — so this
          panel told Steven, on the site that IS the live site, that pointing the domain at it "is
          a separate step and isn't wired up yet".

          It also said a site is reachable at `/<id>`, which predates demos moving to their own
          subdomain. Both are now derived from the same helpers the server actually routes with, so
          this panel cannot disagree with what is being served. */}
      <p style={hint}>
        {(() => {
          const r = reachability(s);
          const url = publicUrlFor(s).replace(/^https:\/\//, "");
          if (r.onDomain) {
            return (
              <>
                Serving <strong>{url}</strong> right now
                {r.indexable ? "" : ", and kept out of Google by the box below"}.
              </>
            );
          }
          if (r.status === "published") {
            return (
              <>
                Published, but no domain is pointed at it yet — so it is still answering at{" "}
                <code style={code}>{url}</code>.
              </>
            );
          }
          if (r.status === "demo") {
            return (
              <>
                Served at <code style={code}>{url}</code>, and kept out of Google on purpose — it
                carries a real business&apos;s details on our address. Add their domain once they buy.
              </>
            );
          }
          if (r.status === "archived") {
            return <>Archived — its address returns 404 for everyone. Put it back to Draft to work on it.</>;
          }
          return (
            <>
              Draft — <strong>only you</strong> can open it. Its address returns 404 for everyone
              else. Set it to Demo in the Design Library when you want to send someone the link.
            </>
          );
        })()}
      </p>

      {/* ⛔ DOMAIN AND VISIBILITY ARE TWO DIFFERENT DECISIONS. Being out of Google used to be a
          side effect of having no domain, so pointing a client's real domain at a half-finished
          build made it indexable the same second — the only way to stay hidden was to keep the
          domain off, which is the opposite of what you want while you finish it. Launch day is
          unticking this box. */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 9, marginTop: 12 }}>
        <input
          type="checkbox"
          checked={!!s.holdIndexing}
          onChange={(e) => setS({ ...s, holdIndexing: e.target.checked })}
          style={{ marginTop: 3 }}
        />
        <span>
          <strong>Not indexed until launch</strong>
          <span style={{ display: "block", ...hint, marginBottom: 0, marginTop: 3 }}>
            Point the domain now, let the world in later. While this is on, the site tells search
            engines and AI crawlers to stay away and publishes no sitemap — even on its own domain.
          </span>
        </span>
      </label>

      <h2 style={sec}>Where the leads go</h2>
      <p style={hint}>
        Blank means enquiries from this website stay in your own intake — right for a demo, and for
        your own pages. Put the client&apos;s address in when they buy, and every enquiry goes
        straight to them with reply-to set to the customer, so hitting reply on their phone
        answers the person who asked.{" "}
        <strong>Your copy is kept either way</strong> — that&apos;s the record at renewal and the
        answer to &quot;I never got that lead&quot;.
      </p>
      <Field
        label="Client's inbox — where their leads land"
        v={s.leadEmail || ""}
        on={(v) => setS({ ...s, leadEmail: v })}
        ph="the client's own inbox — leave blank while it's a demo"
      />
      {/* Until now this could ONLY be set by the onboard-client route, which also CREATES a site
          if the name doesn't match an existing slug — so pointing an existing website at a
          spreadsheet meant risking a duplicate site, or an admin call with a bearer token. Every
          business ends up wanting its own sheet eventually, including Steven's own; that makes it
          a setting, not a one-shot side effect of onboarding. */}
      <Field
        label="Leads spreadsheet ID — this business's own sheet"
        v={s.sheetId || ""}
        on={(v) => setS({ ...s, sheetId: v })}
        ph="the long id out of the sheet's URL — blank means it has no sheet of its own yet"
      />
      <p style={hint}>
        From the spreadsheet&apos;s address:
        docs.google.com/spreadsheets/d/<strong>THIS-PART</strong>/edit. Every lead from this
        website also writes a row here, which is what a business looks at when it wants its own
        record rather than an inbox.
      </p>

      {/* ⛔ THIS FIELD DID NOT EXIST UNTIL 2026-08-12, AND THE VALUE HAS BEEN LOAD-BEARING ALL ALONG.
          `ghlWebhookUrl` is read by lead delivery and checked by the heartbeat board — it is the
          third leg of "where the leads go", and the one the $97 offer actually sells: every lead in
          one inbox. It could only ever be set by an admin route with a bearer token.
          
          So the card's GoHighLevel light could never come on by anything Steven could do on screen,
          and the board's warning about it named a fix that existed nowhere. A setting that only
          code can write makes the person who writes code a single point of failure. */}
      <Field
        label="GoHighLevel inbound webhook — their CRM"
        v={s.ghlWebhookUrl || ""}
        on={(v) => setS({ ...s, ghlWebhookUrl: v })}
        ph="https://services.leadconnectorhq.com/hooks/… — blank means no CRM for this one"
      />
      <p style={hint}>
        In GoHighLevel: <strong>Automation &rarr; Workflows &rarr; Inbound Webhook</strong>, then
        copy the URL it gives you. Every enquiry from this website is posted there as a contact, so
        it lands in the same inbox as their calls and texts. Blank is right for a demo and for the
        tier without a CRM &mdash; the email and the sheet still get the lead.
      </p>

      <h2 style={sec}>Fonts</h2>
      <p style={hint}>
        One choice, and the whole website follows — every page, every section. The pairings are
        already matched, so there is nothing to line up.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {FONT_SETS.map((set) => {
          const pair = fontsForSet(set.key, fonts);
          const on = (fonts.fontSet || "asDesigned") === set.key;
          return (
            <button
              key={set.key}
              type="button"
              onClick={() => pickSet(set.key)}
              style={{
                textAlign: "left",
                padding: "13px 15px",
                borderRadius: 10,
                cursor: "pointer",
                border: `1px solid ${on ? "var(--e-accent, #3b82f6)" : "var(--e-line)"}`,
                background: on ? "rgba(59,130,246,.07)" : "transparent",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{set.label}</span>
                <span style={{ fontSize: 12, color: "var(--e-muted)" }}>{set.note}</span>
                {on ? <span style={{ fontSize: 12, color: "var(--e-accent, #3b82f6)", fontWeight: 700 }}>· in use</span> : null}
              </div>
              {/* ⚠️ THE SAMPLE IS THE CONTROL. A set called "Editorial" means nothing until you see
                  it — so each row draws a real headline over real body copy in its own two faces. */}
              <div style={{ marginTop: 7 }}>
                <div style={{ fontFamily: `var(${FONT_VAR[(pair.headingFont || pair.font) as BrandFont]})`, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                  Grow your business
                </div>
                <div style={{ fontFamily: `var(${FONT_VAR[pair.font as BrandFont]})`, fontSize: 13, color: "var(--e-muted)", marginTop: 3 }}>
                  Owners hire us to run paid traffic and fix what is draining it.
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {fontMsg ? <p style={{ ...hint, margin: "10px 0 0" }}>{fontMsg}</p> : null}

      {/* ⚠️ THE ONE PAGE-TOUCHING ACTION ON THIS SCREEN, so it says what it does before it does it.
          Imported sections that predate the current compiler keep their own fonts until this runs. */}
      <div style={{ marginTop: 14 }}>
        <button type="button" onClick={applyEverywhere} disabled={busy} style={ghost}>
          {busy ? "Working…" : "Make every page follow these settings"}
        </button>
        <p style={{ ...hint, margin: "8px 0 0" }}>
          Only needed for pages built from an imported design before these controls existed. Safe to
          press any time — it changes how pages are styled, never what they say.
        </p>
        <button type="button" onClick={fixLinks} disabled={busy} style={{ ...ghost, marginLeft: 8 }}>
          {busy ? "Working…" : "Fix the links on this website"}
        </button>
        <p style={{ ...hint, margin: "8px 0 0" }}>
          Only needed for a site built from an imported design. A design links between its pages by
          filename, which 404s once the site is live — and it only breaks when somebody CLICKS,
          never when you type the address.
        </p>

        {sweepMsg ? <p style={{ ...hint, margin: "6px 0 0", color: "var(--e-ok-ink)" }}>{sweepMsg}</p> : null}
      </div>

      <h2 style={sec}>Text sizes</h2>
      <p style={hint}>
        Your header, home page and footer, in the order they are read. Set a size once here and
        every other page follows — they are built from the same elements.
      </p>
      <div style={{ display: "grid", gap: 6 }}>
        {sizes.map((z) => (
          <SizeRow
            key={z.effective}
            label={z.sample || z.role || z.effective}
            role={z.role}
            where={z.where}
            effective={z.effective}
            rules={z.rules}
            changed={z.changed}
            onSet={(v) => pickSizeGroup(z.members, v)}
            face={((fonts.faceFor as Record<string, string>) || {})[z.selectors[0]] || ""}
            onFace={(f) => pickFace(z.selectors, f)}
          />
        ))}
      </div>
      {!sizes.length ? <p style={hint}>No imported designs on this website yet.</p> : null}

      {elsewhere.length ? (
        <>
          {/* ⚠️ HIS OWN CAVEAT, GIVEN A HOME: "the only difference is when one page has more
              sections than the home page." Those sizes are real and have to be reachable, but they
              are not what the panel is for, so they sit underneath rather than diluting it. */}
          <p style={{ ...hint, marginTop: 18, fontWeight: 600, color: "var(--e-ink)" }}>
            Used only on other pages
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {elsewhere.map((z) => (
              <SizeRow
                key={z.effective}
                label={z.sample || z.selectors.slice(0, 3).join(", ") || z.effective}
                role={z.role}
                where=""
                effective={z.effective}
                rules={z.rules}
                changed={z.changed}
                onSet={(v) => pickSizeGroup(z.members, v)}
              />
            ))}
          </div>
        </>
      ) : null}
      {fontMsg ? <p style={{ ...hint, margin: "8px 0 0" }}>{fontMsg}</p> : null}


      {designColors.length ? (
        <>
          <h2 style={sec}>The design&rsquo;s colours</h2>
          <p style={hint}>
            The palette your imported design was built with. Change one and it changes everywhere it
            is used. Blank it to put the design&rsquo;s own colour back.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 8 }}>
            {designColors.map((c) => (
              <label
                key={c.value}
                title={c.selectors.slice(0, 6).join(", ")}
                style={{ display: "flex", alignItems: "center", gap: 9, border: `1px solid ${c.changed ? "var(--e-accent, #3b82f6)" : "var(--e-line)"}`, borderRadius: 9, padding: "8px 10px" }}
              >
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(c.current) ? c.current : "#000000"}
                  onChange={(e) => pickDesignColor(c.value, e.target.value)}
                  style={{ width: 30, height: 30, border: "none", background: "none", padding: 0, cursor: "pointer", flex: "0 0 auto" }}
                />
                <span style={{ fontSize: 12, lineHeight: 1.3, minWidth: 0 }}>
                  {/* ⚠️ THE PROPERTY IS THE LABEL. A hex tells nobody anything; "background, 14
                      places" is how a person finds the one they mean. */}
                  <span style={{ display: "block", fontWeight: 600 }}>{c.props.slice(0, 2).join(", ") || "colour"}</span>
                  <span style={{ color: "var(--e-muted)" }}>
                    {c.current}
                    {c.changed ? ` (was ${c.value})` : ""} · {c.rules} place{c.rules === 1 ? "" : "s"}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </>
      ) : null}

      <h2 style={sec}>Colours</h2>
      <p style={hint}>
        Set once, used everywhere — every page, every section. Each one applies as you pick it.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }}>
        {SWATCHES.map((w) => {
          const v = String((fonts as Record<string, unknown>)[w.key as string] || "");
          return (
            <label key={String(w.key)} title={w.help} style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid var(--e-line)", borderRadius: 9, padding: "8px 10px" }}>
              <input
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(v) ? v : "#000000"}
                onChange={(e) => pickColour(w.key, e.target.value)}
                style={{ width: 30, height: 30, border: "none", background: "none", padding: 0, cursor: "pointer", flex: "0 0 auto" }}
              />
              <span style={{ fontSize: 12.5, lineHeight: 1.25 }}>
                {w.label}
                {/* Blank is meaningful on Header bar — it means "follow the deeper dark band" —
                    so it is stated rather than shown as an arbitrary colour. */}
                {!v ? <span style={{ color: "var(--e-muted)" }}> · following</span> : null}
              </span>
            </label>
          );
        })}
      </div>

      <h2 style={sec}>How it looks when the link is shared</h2>
      <p style={hint}>Defaults for every page. A page can override any of these in its own panel.</p>
      <Field
        label="Browser tab icon (favicon) — a square PNG, 512×512 is plenty"
        v={s.seo.favicon || ""}
        on={(v) => seo("favicon" as keyof Site["seo"], v)}
        ph="https://…/icon.png"
      />
      <Field label="Preview text" v={s.seo.description} on={(v) => seo("description", v)} ph="What this business does, in one sentence." area />
      <Field label="Preview image URL" v={s.seo.shareImage} on={(v) => seo("shareImage", v)} ph="https://…" />
      <Field label="Title suffix" v={s.seo.titleSuffix} on={(v) => seo("titleSuffix", v)} ph="| Your Business Name" />

      <h2 style={sec}>Tracking</h2>
      <p style={hint}>
        Paste the ids and they go live on every page of this website. Leave them blank and nothing
        is added — no scripts, no cookies.
      </p>
      <Field
        label="Google Analytics — measurement id"
        v={(s.accounts || {}).gaId || ""}
        on={(v) => setS({ ...s, accounts: { ...(s.accounts || {}), gaId: v } })}
        ph="G-XXXXXXXXXX"
      />
      <Field
        label="Meta pixel id"
        v={(s.accounts || {}).metaPixelId || ""}
        on={(v) => setS({ ...s, accounts: { ...(s.accounts || {}), metaPixelId: v } })}
        ph="1234567890123456"
      />

      <h2 style={sec}>In your list</h2>
      <Field label="Website name" v={s.name} on={(v) => setS({ ...s, name: v })} ph="What you call it in your list" />
      <Field label="Note to yourself" v={s.description || ""} on={(v) => setS({ ...s, description: v })} ph="Where this one came from, or what it's waiting on" />

      {err ? <p style={errBox}>{err}</p> : null}
      {msg ? <p style={okBox}>{msg}</p> : null}

      <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
        <button type="button" style={primary} onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
        <button type="button" style={ghost} onClick={() => router.push(`/edit/${s.id}`)} disabled={busy}>
          Back to the pages
        </button>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

function Field({
  label, v, on, ph, area,
}: { label: string; v: string; on: (v: string) => void; ph?: string; area?: boolean }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={lbl}>{label}</span>
      {area ? (
        <textarea value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={{ ...input, minHeight: 70 }} />
      ) : (
        <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} style={input} />
      )}
    </label>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

/**
 * The eight faces, each drawn in ITSELF.
 *
 * ⚠️ A FONT NAME IS NOT A FONT. "Merriweather" set in the UI's own face tells you nothing about
 * what the website will look like, so every option renders in the family it names — the decision
 * is visual and the control has to be too. The families are already loaded by app/layout, so this
 * costs no extra request.
 *
 * ⛔ "Same as body text" IS THE EMPTY STRING, NEVER A COPY OF THE BODY FONT'S VALUE. Copying it in
 * freezes the headlines the first time the body face changes — pick a new body font and the
 * headlines silently stay behind. Blank means FOLLOW, which is what BrandStyle already treats it
 * as, and blank is what every brand saved before today holds.
 */

/** Copy just the named keys off a brand — so a save can touch only what its control owns. */
function pickOnly(b: Brand, keys: (keyof Brand)[]): Partial<Brand> {
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k as string] = (b as Record<string, unknown>)[k as string];
  return out as Partial<Brand>;
}


/** One editable size, drawn at its own size and named by the words it sets. */
function SizeRow({
  label,
  role,
  where,
  effective,
  rules,
  changed,
  onSet,
  face,
  onFace,
}: {
  label: string;
  role: string;
  where: string;
  effective: string;
  rules: number;
  changed: boolean;
  onSet: (v: string) => void;
  /** A typeface just for this element. "" = follow the site's headline/body face. */
  face?: string;
  onFace?: (f: string) => void;
}) {
  const px = /^-?[\d.]+px$/.test(effective);
  const border = changed ? "var(--e-accent, #3b82f6)" : "var(--e-line)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${border}`, borderRadius: 8, padding: "7px 10px" }}>
      <span style={{ flex: "1 1 auto", minWidth: 0 }}>
        <span style={{ display: "block", fontSize: `min(${effective}, 19px)`, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {label}
        </span>
        <span style={{ fontSize: 11.5, color: "var(--e-muted)" }}>
          {where ? <strong style={{ color: "var(--e-ink)" }}>{where}</strong> : null}
          {where && role ? " · " : ""}
          {role}
          {role || where ? " · " : ""}
          {effective} · {rules} place{rules === 1 ? "" : "s"}
        </span>
      </span>
      {px ? (
        <input type="number" min={6} step={0.5} value={parseFloat(effective)}
          onChange={(e) => onSet(e.target.value ? `${e.target.value}px` : "")}
          style={{ width: 74, padding: "5px 7px", fontSize: 13, borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: "inherit" }} />
      ) : clampParts(effective) ? (
        /* ⛔ A RESPONSIVE SIZE, SHOWN AS THE TWO NUMBERS IT ACTUALLY MEANS.
           `clamp(32px,5vw,42px)` is "32 on a phone, up to 42 on a laptop" — Steven, reasonably:
           *"some of these font sizes don't have a pixel, they've got like a raw code… why are some
           expressed in code and some aren't."* Showing the raw function is unreadable; collapsing
           it to ONE number would silently throw away the phone size and wrap a headline badly on
           the screen most visitors arrive on. So: two boxes, and the vw scaling rate in the middle
           is preserved untouched — it is the rate of change between them, not a third size. */
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10.5, color: "var(--e-muted)" }}>phone</span>
          <input type="number" min={6} step={1} value={clampParts(effective)!.min}
            onChange={(e) => onSet(rebuildClamp(effective, e.target.value, null))}
            style={{ width: 58, padding: "5px 6px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: "inherit" }} />
          <span style={{ fontSize: 10.5, color: "var(--e-muted)" }}>laptop</span>
          <input type="number" min={6} step={1} value={clampParts(effective)!.max}
            onChange={(e) => onSet(rebuildClamp(effective, null, e.target.value))}
            style={{ width: 58, padding: "5px 6px", fontSize: 12.5, borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: "inherit" }} />
        </span>
      ) : (
        <input type="text" value={effective} onChange={(e) => onSet(e.target.value.trim())}
          style={{ width: 170, padding: "5px 7px", fontSize: 12, borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: "inherit" }} />
      )}
      {onFace ? (
        <select
          value={face || ""}
          onChange={(e) => onFace(e.target.value)}
          title="A typeface just for this element"
          style={{ fontSize: 11.5, padding: "5px 6px", borderRadius: 6, border: `1px solid ${face ? "var(--e-accent, #3b82f6)" : "var(--e-line)"}`, background: "transparent", color: "inherit", maxWidth: 128 }}
        >
          <option value="">Site font</option>
          {FONT_SETS.length ? null : null}
          {FONT_VAR_KEYS.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      ) : null}
      {changed ? (
        <button type="button" onClick={() => onSet("")} title="Put the design's own size back"
          style={{ fontSize: 11, background: "none", border: "none", textDecoration: "underline", cursor: "pointer", color: "var(--e-muted)" }}>
          undo
        </button>
      ) : null}
    </div>
  );
}


/** `clamp(32px,5vw,42px)` -> { min: 32, rate: "5vw", max: 42 }, or null if it is not a clamp. */
function clampParts(v: string): { min: number; rate: string; max: number } | null {
  const m = /^clamp\(\s*([\d.]+)px\s*,\s*([^,]+?)\s*,\s*([\d.]+)px\s*\)$/i.exec(String(v || "").trim());
  return m ? { min: Number(m[1]), rate: m[2].trim(), max: Number(m[3]) } : null;
}

/**
 * Put a clamp back together after one end was edited.
 *
 * ⚠️ THE MIDDLE TERM IS CARRIED THROUGH UNCHANGED. It is the RATE the size grows at between the two
 * ends, not a third size — recomputing it from the new min/max would quietly re-tune how the
 * headline behaves at every width in between, which is not what somebody typing "40" asked for.
 */
function rebuildClamp(v: string, min: string | null, max: string | null): string {
  const p = clampParts(v);
  if (!p) return v;
  const lo = min === null ? p.min : Number(min);
  const hi = max === null ? p.max : Number(max);
  if (!lo || !hi) return v;
  // A phone size above the laptop size is a typo, not an instruction — swap rather than emit a
  // clamp the browser will read backwards.
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
  return `clamp(${a}px,${p.rate},${b}px)`;
}

const page: React.CSSProperties = { maxWidth: 680, margin: "0 auto", padding: "32px 24px 100px", fontFamily: font };
const back: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel)", borderRadius: 8, padding: "6px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const sec: React.CSSProperties = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--e-muted)", margin: "34px 0 6px", borderTop: "1px solid var(--e-line)", paddingTop: 20 };
const hint: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "0 0 14px" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 5 };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14, outline: "none", fontFamily: font };
const code: React.CSSProperties = { background: "var(--e-line-soft)", borderRadius: 4, padding: "1px 5px", fontFamily: "ui-monospace,monospace", fontSize: 12 };
const tokenBox: React.CSSProperties = { border: "1px solid var(--e-line)", background: "var(--e-panel-2)", borderRadius: 10, padding: 14, marginTop: 6 };
const primary: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const ghost: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const errBox: React.CSSProperties = { marginTop: 16, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
const okBox: React.CSSProperties = { marginTop: 16, background: "var(--e-ok-bg)", border: "1px solid var(--e-ok-line)", color: "var(--e-ok-ink)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };
