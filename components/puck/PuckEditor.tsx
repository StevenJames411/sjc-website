"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, ActionBar, usePuck, type Data } from "@measured/puck";
import { SizeScaleContext, type SizeIndex, type SizeScale } from "./SizeScaleContext";
import { requestTextFocus } from "@/lib/designFocus";
import "@measured/puck/puck.css";
import { config } from "@/components/puck/config";
import { seedFor } from "@/components/puck/seeds";
import { SJC as SJC_ID } from "@/lib/siteKeys";
import { publicUrlFor } from "@/lib/hostShared";

// The page list is passed in from the server route (it's Redis-backed now, so the client can't
// read it directly). Shape mirrors lib/pageRegistry's PageEntry.
type PageItem = { slug: string; title: string; custom?: boolean };

/**
 * MOVE UP / MOVE DOWN on the selected section's toolbar.
 *
 * ⚠️ BUTTONS, NOT DRAG, AND THAT WAS A DECISION. Puck ships drag-and-drop and it is the wrong tool
 * here: an imported section is often taller than the viewport, so there is nothing on screen to
 * aim at — you grab a section and drag into a void, guessing where it lands. Buttons move one
 * position per press and the result is visible immediately. The cockpit already proved ▲▼ works.
 *
 * Puck's own actionBar gives duplicate and delete; this adds the two it doesn't, so reordering,
 * copying and removing a section all live in the same place — on the section, in the canvas,
 * where you are already looking. The alternative was a sidebar list, which means moving a LABEL
 * rather than the thing you can see.
 *
 * Disabled rather than hidden at the ends. A control that vanishes reads as a bug; a greyed one
 * says "this is already the top".
 */

/**
 * Delete and duplicate, in the RIGHT PANEL, for whatever is selected.
 *
 * ⛔ THE ACTION BAR IS NOT REACHABLE ON EVERY BLOCK, AND COLUMNS IS THE PROOF.
 *
 * Puck's action bar — which carries duplicate and delete — appears when you HOVER the block. An
 * empty `Columns` is almost entirely made of drop zones, so the pointer is over a SLOT rather than
 * the block itself, and the bar never surfaces. Steven, having dropped one on the canvas: *"it
 * doesn't surface a delete button that used to work."* The block was selected the whole time — the
 * right panel said so — there was simply nowhere left to hover it.
 *
 * The selection is the thing that never has this problem: if the panel is showing a block's fields,
 * that block is selected, full stop. So the two destructive-but-essential actions live here too.
 * The action bar stays exactly as it was; this is a second door to the same place, not a move.
 *
 * ⚠️ NOT SHOWN FOR THE PAGE ITSELF. With nothing selected the panel shows the page's own settings,
 * and "Delete" there would read as deleting the page — which is a different, guarded action in the
 * ⋯ More menu.
 */
function FieldsPanel({ children }: { children: React.ReactNode }) {
  const { appState, dispatch, selectedItem } = usePuck();
  const sel = appState.ui.itemSelector;
  const zone = sel?.zone ?? "default-zone";
  const index = sel?.index ?? -1;

  const act = (type: "remove" | "duplicate") => {
    if (index < 0) return;
    if (type === "remove") {
      // Deselect FIRST. Removing the block the panel is rendering leaves the selector pointing at
      // an index that no longer holds it, and the panel then renders the block that slid into its
      // place — which reads as "delete removed the wrong one".
      dispatch({ type: "setUi", ui: { itemSelector: null } });
      dispatch({ type: "remove", index, zone });
      return;
    }
    // ⚠️ Duplicate names its arguments differently from remove — sourceIndex/sourceZone, not
    // index/zone. Typechecking is the only thing that says so.
    dispatch({ type: "duplicate", sourceIndex: index, sourceZone: zone });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>{children}</div>
      {selectedItem && index >= 0 ? (
        <div style={{ flex: "0 0 auto", borderTop: "1px solid var(--puck-color-grey-09, #e6e6e6)", padding: 12, display: "flex", gap: 8 }}>
          <button type="button" onClick={() => act("duplicate")} style={panelBtn}>
            Duplicate
          </button>
          <button type="button" onClick={() => act("remove")} style={{ ...panelBtn, color: "#b91c1c" }}>
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

const panelBtn: React.CSSProperties = {
  flex: 1,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 7,
  border: "1px solid var(--puck-color-grey-09, #e6e6e6)",
  background: "transparent",
  cursor: "pointer",
};

function SectionActionBar({
  label,
  children,
  parentAction,
}: {
  label?: string;
  children?: React.ReactNode;
  parentAction?: React.ReactNode;
}) {
  const { appState, dispatch, selectedItem } = usePuck();

  const sel = appState.ui.itemSelector;
  const index = sel?.index ?? -1;
  const content = appState.data.content ?? [];
  const count = content.length;

  // ⚠️ DO NOT TEST THE ZONE BY NAME. The first version checked `zone === "default-zone"` and the
  // arrows never appeared: Puck namespaces the root zone (root:default-zone), so the comparison
  // was quietly false and there was no error to notice — the buttons simply weren't there.
  //
  // This asks the only question that actually matters: is the selected block the one sitting at
  // that index in the PAGE's own content array? If yes it is a whole-page section and safe to
  // reorder. If it is a card nested inside a column, the ids won't match and the arrows stay
  // hidden rather than silently moving the wrong thing.
  const atIndex = index >= 0 ? content[index] : undefined;
  const isRoot =
    !!selectedItem &&
    !!atIndex &&
    (atIndex.props as { id?: string })?.id === (selectedItem.props as { id?: string })?.id;

  const move = (to: number) => {
    if (!isRoot || to < 0 || to >= count) return;
    const zone = sel?.zone ?? "default-zone";
    dispatch({ type: "reorder", sourceIndex: index, destinationIndex: to, destinationZone: zone });
    // Keep the moved section selected, so a second press keeps moving the SAME section rather
    // than whatever slid into its old slot.
    dispatch({ type: "setUi", ui: { itemSelector: { index: to, zone } } });
  };

  return (
    <ActionBar label={label}>
      {parentAction}
      {isRoot && count > 1 && (
        <>
          <ActionBar.Action label="Move up" onClick={() => move(index - 1)}>
            <span aria-hidden style={{ opacity: index <= 0 ? 0.35 : 1, fontSize: 15, lineHeight: 1 }}>▲</span>
          </ActionBar.Action>
          <ActionBar.Action label="Move down" onClick={() => move(index + 1)}>
            <span aria-hidden style={{ opacity: index >= count - 1 ? 0.35 : 1, fontSize: 15, lineHeight: 1 }}>▼</span>
          </ActionBar.Action>
        </>
      )}
      {/* KEEP THIS BAND. "Save as template" copies a whole PAGE, which is the wrong grain for the
          thing that actually repeats — the reviews strip, the guarantee, the contact section with
          the form already wired. Saved here, it can be dropped onto any other site's page.
          On the section, in the canvas, beside move and delete. */}
      {isRoot && atIndex && (
        <ActionBar.Action
          label="Save this section to the library"
          onClick={async () => {
            const name = window.prompt("Name this section (e.g. Reviews strip):");
            if (!name || !name.trim()) return;
            const r = await fetch("/api/sections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              // The site this band came FROM, so the server can take that business out of it —
              // its phone number, its address, and any tel:/mailto: link that would otherwise ring
              // the wrong company from somebody else's page. Read from the URL because this action
              // bar is rendered by Puck, not by us. See lib/transferScrub.ts.
              body: JSON.stringify({
                name: name.trim(),
                block: atIndex,
                site: window.location.pathname.match(/^\/edit\/([a-z0-9-]+)\//i)?.[1] || "",
              }),
            })
              .then((x) => x.json())
              .catch(() => ({ ok: false, error: "Couldn't reach the server." }));
            window.alert(r.ok ? `Saved "${name.trim()}" to the section library.` : r.error || "Couldn't save it.");
          }}
        >
          <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>★</span>
        </ActionBar.Action>
      )}
      {children}
    </ActionBar>
  );
}

// The unified visual builder for ANY page. A thin bar on top adds the two things Puck doesn't
// give us: a page-switcher dropdown (jump between all our pages) and auto-save (every change
// quietly written to the cloud, with a Saving…/Saved indicator). Puck's own header keeps the
// Publish button (draft stays private until Publish pushes it live). The whole site is
// password-gated by middleware, so only the owner reaches this.
//
// To reset a page to its seed: navigate to /edit/<page>?reset=1 — the URL param triggers the
// reset on load and is then stripped, so no fumble-able button sits on the toolbar.
//
// THE TOOLBAR HOLDS RECURRING WORK ONLY. A one-off task sitting in a permanent toolbar is clutter
// you re-read every single day. Three have been removed for that reason:
//   "Duplicate for a client"    — "New website" does it properly now
//   "Move to its own website"   — a one-time migration, done
//   "Link business info"        — the importer writes the tokens itself now, so this was only ever
//                                 needed for pages built before that existed; the sweep moved to
//                                 the settings screen, beside the fields it uses
// Each survives as an API route with no button — maintenance, not a feature.
type SaveState = "idle" | "saving" | "saved" | "failed";

export default function PuckEditor({
  siteId,
  siteName,
  businessName,
  reach,
  page,
  title,
  pages,
  siteDomain,
  fallbackData,
  sizeIndex = [],
  typeScale = {},
}: {
  siteId: string;
  /** Every text size the site's stylesheets declare — see components/puck/SizeScaleContext. */
  sizeIndex?: SizeIndex;
  /** The site's current size overrides, keyed by the design's original declared value. */
  typeScale?: Record<string, string>;
  siteName: string;
  /** The BUSINESS's name from Website settings — what the header shows. See below. */
  businessName?: string;
  /**
   * Who can reach the SITE — separate from whether this PAGE has been published.
   *
   * ⚠️ TWO PUBLISH CONCEPTS EXIST AND THEY USED TO DISAGREE SILENTLY. A page's `_pub` marker says
   * its content was published; the site's state says whether anybody can open the address. On a
   * Draft site the dot went green, the bar said "Published — live on <url>", and the Copy button
   * handed over a link that 404s. That is this codebase's own named failure — the receipt said
   * done, the page said otherwise.
   */
  reach?: { status: string; onDomain: boolean; onDemo: boolean; indexable: boolean };
  page: string;
  title: string;
  pages: PageItem[];
  /** Set once the client owns a domain — it moves the whole site off the studio address. */
  siteDomain?: string;
  /**
   * What to open when a page has neither a draft nor a published version.
   *
   * ⛔ EXISTS BECAUSE `seedFor` IS SJC-ONLY. Its nav seed is built from NAV_DEFAULTS, which
   * hardcodes brandName "Steven James Consulting", SJC's phone and SJC's logo — so a CLIENT's
   * empty header opened in the builder wearing Steven's brand, while the live page correctly
   * showed theirs. The builder and the visitor seeing different sites is worse than either being
   * wrong on its own.
   *
   * Computed on the server (app/edit/[site]/[page]/page.tsx), which is the only place with the
   * site record, and generated by the SAME lib/siteChrome the public render uses — so "default"
   * cannot mean two different things.
   */
  fallbackData?: Data | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [versions, setVersions] = useState<{ id: number; at: string; bytes: number }[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [library, setLibrary] = useState<{ id: string; name: string; type: string; savedAt: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // WHERE THIS PAGE ACTUALLY LIVES. Every other builder shows the address under the toolbar; not
  // having it meant the only way to see a finished site was to ask someone what the URL was.
  //
  // Three shapes now, and the URL is built by lib/hostShared — the SAME function the server uses
  // to decide what to serve — so the link here can't drift from the page a prospect opens:
  //   SJC's own pages     at the domain root (its home IS "/")
  //   a demo              on the studio domain, under the site's id
  //   a customer who paid at the root of their own domain
  // nav/footer are fragments shared across pages and have no address of their own.
  const isFirstPage = pages[0]?.slug === page;
  const publicUrl =
    ["nav", "footer", "websites-nav", "websites-footer"].includes(page)
      ? null
      : siteId === SJC_ID
        ? page === "home"
          ? "/"
          : `/${page}`
        : publicUrlFor({ id: siteId, domain: siteDomain }, page, isFirstPage);
  // What to show in the toolbar: a bare path for SJC, the full address for anything with a home
  // of its own — because "which domain is this on" is the question that matters there.
  const publicPath = publicUrl;

  // Create a brand-new page: name it, the server slugifies + saves it to the registry, then we
  // jump straight into editing the blank page. It won't be public until you hit Publish.
  const onNewPage = async () => {
    const name = window.prompt("Name your new page (e.g. Pricing):");
    if (!name || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title: name.trim(), site: siteId }),
      });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't create the page.");
      router.push(`/edit/${siteId}/${j.slug}`);
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // Pull this page's images off whoever generated them and onto our own storage. An imported
  // design's photos still point at the tool that made them — a live dependency on a third party
  // inside a site a client pays for. Their project goes away, every photo on the client's site
  // breaks, and we hear about it from the client.
  const onAdoptImages = async () => {
    setBusy(true);
    try {
      const look = await fetch("/api/adopt-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug: page, siteId, dryRun: true }),
      }).then((r) => r.json());

      const foreign = (look.urls || []).length;
      if (!foreign) return window.alert("Every image on this page is already on our own storage.");
      if (!window.confirm(`${foreign} image${foreign === 1 ? "" : "s"} are still hosted by whoever generated this design.\n\nCopy them onto our storage and repoint the page?`)) return;

      const r = await fetch("/api/adopt-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug: page, siteId }),
      }).then((x) => x.json());

      if (r.failures?.length) {
        window.alert(`Copied ${r.adopted}, but ${r.failures.length} failed:\n` +
          r.failures.map((f: { url: string; why: string }) => `• ${f.why}`).join("\n") +
          `\n\nThe ones that failed still point at the old host.`);
      } else {
        window.alert(`Done — ${r.adopted} image${r.adopted === 1 ? "" : "s"} copied to our storage.` +
          (r.remainingForeign ? `\n\n⚠️ ${r.remainingForeign} still foreign.` : "\n\nNothing on this page depends on anyone else now."));
      }

      // ⚠️ A FULL RELOAD, NOT router.refresh(). This rewrote the page on the SERVER, but Puck is
      // still holding the copy it loaded on open — the one with the old URLs in it. router.refresh()
      // re-renders server components and leaves that untouched, so the next auto-save wrote the
      // stale copy straight back and Publish pushed it live. The adopt looked like it worked, said
      // so, and was undone by the click that came after it. Reloading is the only thing that puts
      // the editor back in sync before it can save again.
      window.location.reload();
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // Turn this page into a reusable TEMPLATE.
  //
  // Not a copy. The scrub on the server strips the business facts (phone, address, email, the
  // name) and converts every literal hex to the brand role it was playing, then refuses to create
  // anything if something identifiable survived. That refusal is the point: a template still
  // carrying a real business's phone number is worse than no template, because it looks finished.
  const onSaveAsTemplate = async () => {
    const name = window.prompt(
      "Save this page as a template.\n\nWhat should the template be called? (e.g. \"Service business — starter\")",
      "Service business — starter"
    );
    if (!name || !name.trim()) return;
    setBusy(true);
    try {
      const body = JSON.stringify({ from: page, fromSite: siteId, name: name.trim() });
      const opts = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin" as const,
      };

      // Look before creating — the scrub either comes out clean or it doesn't.
      const check = await fetch("/api/admin/make-template", {
        ...opts,
        body: JSON.stringify({ from: page, fromSite: siteId, dryRun: true }),
      }).then((r) => r.json());
      if (!check.ok) {
        return window.alert(
          `Can't make a template from this page yet.\n\n${check.error}\n\n` +
            `Fix those on the page first — a template must carry no real business details.`
        );
      }

      const c = check.counts || {};
      if (
        !window.confirm(
          `Ready to save as a template.\n\n` +
            `• ${c.facts || 0} business details replaced with placeholders\n` +
            `• ${(c.colours || 0) + (c.strayColours || 0)} colours converted to brand roles\n\n` +
            `This creates a new template. Nothing on this page changes.`
        )
      )
        return;

      const r = await fetch("/api/admin/make-template", { ...opts, body }).then((x) => x.json());
      if (!r.ok) return window.alert(r.error || "Couldn't save the template.");
      window.alert(`Template saved. It's now an option under "New website".`);
      router.push("/edit");
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // ── SECTION LIBRARY (insert side) ───────────────────────────────────────────────────────────
  // Appends to the end of the page rather than guessing where you wanted it: the ▲▼ buttons on
  // the section move it from there in one press each, and a band that lands in an unpredictable
  // spot is worse than one that always lands somewhere known.
  const insertSection = async (id: string, name: string) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/sections?id=${encodeURIComponent(id)}&full=1`, {
        credentials: "same-origin",
      });
      const j = await r.json();
      if (!j.ok || !j.block) return window.alert(j.error || "Couldn't load that section.");

      // ⚠️ A FRESH ID, ALWAYS. Puck treats two blocks sharing an id as ONE node and renders the
      // last one's content in every slot — the failure that made an imported design come back as
      // its footer, seven times over. The library deliberately strips the id on save so this
      // can't be forgotten here.
      const block = {
        ...j.block,
        props: { ...(j.block.props || {}), id: `lib-${id}-${Date.now()}` },
      };

      setData((d) => {
        const next = d
          ? { ...d, content: [...(d.content || []), block] }
          : d;
        if (next) void writeDraft(next as Data);
        return next;
      });
      window.alert(`"${name}" added to the bottom of this page. Use ▲ on the section to move it.`);
      setShowLibrary(false);
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const openLibrary = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/sections", { credentials: "same-origin" });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't load the section library.");
      setLibrary(j.sections || []);
      setShowLibrary(true);
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // ── VERSIONS ────────────────────────────────────────────────────────────────────────────────
  // A panel rather than a prompt(): the whole value is READING the list — which day, how big —
  // and a native dialog can't show one. It also blocks the page for anything driving the browser.
  //
  // ⚠️ Restoring reloads the editor. The draft has changed underneath Puck, and Puck holds its
  // own copy in memory; without the reload the canvas keeps showing the old version and the next
  // autosave writes it straight back over the one just restored.
  /**
   * Keep this whole page in the shared library.
   *
   * The section library's ★ saves one band; this saves the page. Both are shared across every
   * website on purpose — a page proven on one build is available on the next.
   */
  const onSaveToLibrary = async () => {
    const name = window.prompt("Name this page (e.g. Outdoor-living home page):");
    if (!name || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/page-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), site: siteId, page }),
      }).then((x) => x.json());
      // A refusal here is the scrub doing its job — it names what it found rather than saving
      // something that would carry one business's phone number onto another's site.
      window.alert(r.ok ? `Saved "${name.trim()}" to the page library.` : r.error || "Couldn't save it.");
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  /** The insert half: pick a saved page and drop it onto THIS website as a new page. */
  const onAddFromLibrary = async () => {
    setBusy(true);
    try {
      const list = await fetch("/api/page-library", { credentials: "same-origin" }).then((x) => x.json());
      const rows: { id: string; name: string; from: string }[] = list?.pages || [];
      if (!rows.length) {
        window.alert("Nothing in the page library yet. Save a page first — it's under ⋯ More.");
        return;
      }
      const pick = window.prompt(
        "Which page?\n\n" +
          rows.map((r, i) => `${i + 1}. ${r.name}  (${r.from})`).join("\n") +
          "\n\nType a number:"
      );
      const chosen = rows[Number(pick) - 1];
      if (!chosen) return;

      const asName = window.prompt("Call it what on this website?", chosen.name);
      if (!asName || !asName.trim()) return;
      const slug = asName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

      const r = await fetch("/api/page-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: chosen.id, toSite: siteId, toPage: slug }),
      }).then((x) => x.json());
      if (!r.ok) return window.alert(r.error || "Couldn't add it.");
      // It lands as a DRAFT. Going straight to it is the point — you asked for the page, so you
      // get the page, not a message about it.
      router.push(`/edit/${siteId}/${r.slug}`);
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const openVersions = async () => {
    setBusy(true);
    try {
      const r = await fetch(
        `/api/versions?page=${encodeURIComponent(page)}&site=${encodeURIComponent(siteId)}`,
        { credentials: "same-origin" }
      );
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't load this page's versions.");
      if (j.unavailable) return window.alert(j.unavailable);
      setVersions(j.versions || []);
      setShowVersions(true);
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const restoreVersion = async (id: number) => {
    setBusy(true);
    try {
      const r = await fetch("/api/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ page, site: siteId, id }),
      });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't restore that version.");
      // Straight reload — see the warning above.
      window.location.reload();
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // Rename the current page. LABEL ONLY — the slug, the URL, and everything saved on the page
  // stay exactly as they are, so renaming can never break a link or lose content.
  const onRenamePage = async () => {
    const name = window.prompt("Rename this page (this changes the name in the list only — the web address and the page itself don't change):", title);
    if (name === null) return;
    if (!name.trim()) return window.alert("A page name is required.");
    if (name.trim() === title) return;
    setBusy(true);
    try {
      const r = await fetch("/api/pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug: page, title: name.trim(), site: siteId }),
      });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't rename the page.");
      router.refresh();
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // Delete the current page: pulls it from the builder and takes its page down. Home / nav /
  // footer are site-wide and can't be deleted.
  const canDelete = !["home", "nav", "footer"].includes(page);
  const onDeletePage = async () => {
    if (!canDelete) return;
    if (!window.confirm(`Delete "${title}"? This removes it from the builder and takes its page down. This can't be undone.`))
      return;
    setBusy(true);
    try {
      const r = await fetch("/api/pages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ slug: page, site: siteId }),
      });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't delete the page.");
      router.push("/edit");
    } catch {
      window.alert("Couldn't reach the server. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  // Can a visitor open this site's address at all? Separate question from whether the PAGE has
  // been published — see the `reach` prop. Defaults to true so any caller that hasn't been given
  // the prop behaves exactly as before rather than reporting everything unreachable.
  const reachable = reach ? reach.onDomain || reach.onDemo : true;

  // Is there actually a published version behind that address? A link that 404s is worse than no
  // link, so the bar says which it is rather than letting you find out by clicking.
  useEffect(() => {
    let alive = true;
    setLive(null);
    if (!publicPath) return;
    fetch(`/api/puck?page=${encodeURIComponent(page)}&site=${encodeURIComponent(siteId)}&pub=1`)
      .then((r) => r.json())
      .then((j) => alive && setLive(Boolean(j?.data?._pub)))
      .catch(() => alive && setLive(null));
    return () => {
      alive = false;
    };
  }, [page, siteId, publicPath]);

  // A SAVE THAT DIDN'T SAVE MUST NOT SAY "Saved" (2026-07-30).
  //
  // This used to be `.then(() => setSave("saved"))` — the response was never read. The write
  // guard in pgClient refuses saves that look like data loss, the API returned ok:false, and
  // this still went green. Steven edited, saw "Saved", and watched the page stay unchanged with
  // no error anywhere on screen or in the console.
  //
  // Now: only ok:true goes green. Anything else goes red, keeps the reason on screen, and logs
  // it. saveError holds the guard's own words ("top-level keys disappeared: zones").
  const writeDraft = (d: Data) => {
    setSave("saving");
    return fetch("/api/puck", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ page, site: siteId, data: d }),
    })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.ok && body?.ok) {
          setSaveError(null);
          setSave("saved");
          return;
        }
        const reason = body?.reason || `HTTP ${r.status}`;
        console.error("[PuckEditor] draft save REFUSED:", reason);
        setSaveError(reason);
        setSave("failed");
      })
      .catch((e) => {
        const reason = e instanceof Error ? e.message : "network error";
        console.error("[PuckEditor] draft save failed:", reason);
        setSaveError(reason);
        setSave("failed");
      });
  };

  // Load this page's saved draft, or fall back to its seed. If ?reset=1 is in the URL,
  // load the seed directly (and strip the param) — deliberate recovery, not a fumble-able button.
  useEffect(() => {
    let alive = true;
    setData(null);

    const params = new URLSearchParams(window.location.search);
    if (params.get("reset") === "1") {
      const url = new URL(window.location.href);
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.toString());
      // fallbackData first — a client site's reset must restore THEIR default chrome, not SJC's.
      const s = fallbackData || seedFor(page, title);
      setData(s);
      fetch("/api/puck", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ page, site: siteId, data: s }),
      });
      return () => { alive = false; };
    }

    // Load order: saved DRAFT -> the PUBLISHED version -> the seed.
    // The published check is the safety net. Without it, opening a page that's live but has no
    // draft would hand you the seed — a stale copy written at a different time — and hitting
    // Publish would overwrite the real live page with it. Falling back to what's actually live
    // means the editor always opens to what a visitor sees.
    const load = async () => {
      const read = async (url: string) => {
        try {
          const j = await fetch(url).then((r) => r.json());
          return j && j.data && Array.isArray(j.data.content) && j.data.content.length ? j.data : null;
        } catch {
          return null;
        }
      };
      const key = encodeURIComponent(page);
      const draft = await read(`/api/puck?page=${key}&site=${siteId}`);
      const next =
        draft ||
        (await read(`/api/puck?page=${key}&site=${siteId}&pub=1`)) ||
        fallbackData ||
        seedFor(page, title);
      if (alive) setData(next);
    };
    load();
    return () => {
      alive = false;
    };
  }, [page, title, siteId, fallbackData]);

  // Debounced auto-save on every edit.
  const onChange = (d: Data) => {
    if (timer.current) clearTimeout(timer.current);
    setSave("saving");
    timer.current = setTimeout(() => writeDraft(d), 800);
  };

  // ⛔ ABOVE THE `if (!data)` GUARD BELOW, AND THAT IS NOT A STYLE CHOICE.
  //
  // These three hooks were inserted after it and took the builder down with "Rendered more hooks
  // than during the previous render": the first pass returns the loading state before reaching
  // them, the second pass — once the draft arrives — runs them, and React counts a different
  // number of hooks between renders. The page did not error visibly, it simply failed to load.
  //
  // Every hook in this component has to sit above every early return. There is no version of this
  // that is fine "because the guard almost never fires".
  /**
   * ONE SIZE, CHANGED EVERYWHERE IT IS USED — from the panel, without leaving the page.
   *
   * ⛔ THE MODEL THIS SERVES IS STEVEN'S, and it is simpler than the one I built first: *"the home
   * page always gets built first. I set the home page from top to bottom, the rest of the pages
   * should follow… instead of drilling into individual pages, you have one edit canvas that lives
   * on top of the entire website."*
   *
   * The per-line Size stepper writes `row.size`, an inline style on ONE line, in ONE section, on
   * ONE page — with no idea the same size governs nine other pages. That disconnect is why a
   * global list of thirty-six numbers existed at all, and why it was unreadable: he was being
   * asked to identify text by its font size instead of by pointing at it.
   *
   * ⚠️ OPTIMISTIC, THEN CORRECTED. The canvas restyles from the returned sheet on refresh, so the
   * local map moves first and the refresh confirms it. A failure puts the old value back rather
   * than leaving the panel claiming a change the website never took.
   */
  const [scale, setScale] = useState<Record<string, string>>(typeScale);
  const [scaleMsg, setScaleMsg] = useState("");
  useEffect(() => setScale(typeScale), [typeScale]);

  const sizeScale: SizeScale = useMemo(
    () => ({
      index: sizeIndex,
      scale,
      places: (declared: string) =>
        sizeIndex.find((z) => z.value === declared)?.selectors.length || 0,
      status: scaleMsg,
      setGlobal: async (declared: string, next: string) => {
        const before = scale;
        const nextScale = { ...scale };
        // Back to the design's own value = REMOVE the key. A stored self-mapping reads as a
        // deliberate choice forever and survives the design changing underneath it.
        if (!next || next === declared) delete nextScale[declared];
        else nextScale[declared] = next;
        setScale(nextScale);
        setScaleMsg("Saving…");
        try {
          const cur = await fetch(`/api/brand?site=${encodeURIComponent(siteId)}`, {
            credentials: "same-origin",
          }).then((x) => x.json());
          const merged = { ...(cur?.brand || {}), typeScale: nextScale };
          const put = await fetch("/api/brand", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ site: siteId, brand: merged }),
          }).then((x) => x.json());
          if (!put.ok) throw new Error(put.error || "Couldn't save the size.");
          const pub = await fetch("/api/brand", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ site: siteId, action: "publish-sizes" }),
          }).then((x) => x.json());
          if (!pub.ok) throw new Error("Saved, but couldn't put it live.");
          setScaleMsg("Changed everywhere.");
          router.refresh();
        } catch (e) {
          setScale(before);
          setScaleMsg((e as Error).message);
        }
      },
    }),
    [sizeIndex, scale, scaleMsg, siteId, router]
  );

  if (!data) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading editor…</div>;
  }


  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={bar}>
        {/* Which WEBSITE you're in, and the way back out. Without this the only clue you were
            editing a client's site rather than SJC's was the page names in the dropdown. */}
        <button
          type="button"
          onClick={() => router.push("/edit")}
          style={{ ...btn, fontWeight: 700 }}
          title="Back to all websites"
        >
          ← {businessName?.trim() || siteName}
        </button>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Page:</span>
        {/* The page list, and at its foot the way to bring one IN from another website. It sits
            here rather than on the band because "which page am I on" and "add another page" are the
            same question asked half a second apart — and the band is full. */}
        <select
          value={page}
          onChange={(e) => {
            if (e.target.value === "__library__") {
              onAddFromLibrary();
              return;
            }
            router.push(`/edit/${siteId}/${e.target.value}`);
          }}
          style={select}
        >
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="__library__">＋ Add a page from the library…</option>
        </select>
        {/* Everything global to this website — the business's name, phone, address, its domain,
            its SEO defaults. Lives one level up from a page, because it belongs to all of them. */}
        <button
          type="button"
          onClick={() => router.push(`/edit/${siteId}/settings`)}
          disabled={busy}
          style={btn}
          title="Business name, phone, address, domain — used across the whole website"
        >
          ⚙ Website settings
        </button>
        <button type="button" onClick={onNewPage} disabled={busy} style={btn}>
          + New Page
        </button>
        {/* ── EVERYTHING ELSE ────────────────────────────────────────────────────────────────
            One menu, because the band is for what you touch on a normal editing pass and these
            are not. Adopt images and Save as template are once per SITE; Rename is once per page;
            Versions is once in a while and only when something went wrong.

            Steven, looking at eleven controls: *"it was getting crowded."* A bar you scan is worse
            than a menu you read — eleven things at equal weight means hunting every time, and the
            two the page library is about to add would have landed on top of that. */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            disabled={busy}
            style={btn}
            aria-expanded={moreOpen}
            title="Adopt images, Save as template, Rename, Versions, saved sections"
          >
            ⋯ More
          </button>
          {moreOpen ? (
            <>
              {/* Click-away. A menu that only closes on its own button is a menu left open. */}
              <div
                onClick={() => setMoreOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 40 }}
              />
              <div style={moreMenu}>
                {[
                  { label: "Add saved section", onClick: openLibrary, title: "Drop in a band you saved from any website" },
                  { label: "Adopt images", onClick: onAdoptImages, title: "Copy this page's images onto our own storage so nothing depends on whoever generated the design" },
                  { label: "Save as template", onClick: onSaveAsTemplate, title: "Strip the business details and save this layout as a reusable template" },
                  { label: "Save page to library", onClick: onSaveToLibrary, title: "Keep this whole page so you can drop it onto another website" },
                  { label: "Rename page", onClick: onRenamePage, title: "Changes the name in the list only — the web address and the page are untouched" },
                  { label: "Versions", onClick: openVersions, title: "Every time you pressed Publish — restore an earlier one" },
                ].map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    title={m.title}
                    disabled={busy}
                    onClick={() => {
                      setMoreOpen(false);
                      m.onClick();
                    }}
                    style={moreItem}
                  >
                    {m.label}
                  </button>
                ))}
                {canDelete ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMoreOpen(false);
                      onDeletePage();
                    }}
                    style={{ ...moreItem, color: "var(--e-danger, #b91c1c)", borderTop: "1px solid #eee" }}
                  >
                    Delete page
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
        <span
          title={saveError || undefined}
          style={{
            fontSize: 12,
            fontWeight: save === "failed" ? 700 : 400,
            color: save === "failed" ? "#dc2626" : save === "saved" ? "#16a34a" : "#6b7280",
          }}
        >
          {save === "saving"
            ? "Saving…"
            : save === "saved"
              ? "Saved"
              : save === "failed"
                ? `NOT SAVED — ${saveError || "unknown error"}`
                : ""}
        </span>
        {/* The live address, the way every other builder shows it. A dot for whether anything is
            actually published there, so a link that would 404 says so before you click it. */}
        {publicPath ? (
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {/* THREE states, not two. Green means a visitor can open this page RIGHT NOW: the
                content is published AND the site is reachable. Amber is "published, but nobody
                can get to it" — the case that used to render green and lie. */}
            <span
              title={
                !reachable
                  ? `This site is ${reach?.status ?? "draft"} — nobody can open this address yet`
                  : live
                    ? "Published and reachable"
                    : "Not published yet"
              }
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background:
                  live === null ? "#d1d5db" : live && reachable ? "#16a34a" : "#f59e0b",
              }}
            />
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
              title={
                !reachable
                  ? `The site is ${reach?.status ?? "draft"} — this address returns 404 until you set it to Demo or Published`
                  : live === false
                    ? "Nothing published here yet — hit Publish first"
                    : "Open the live page"
              }
            >
              {publicPath} ↗
            </a>
            <button
              type="button"
              style={{ ...btn, padding: "4px 8px", fontSize: 12 }}
              title="Copy the link"
              // An absolute URL is already absolute — only SJC's bare paths need the origin
              // prefixed, and prefixing a client's own domain with the editor's would produce a
              // link to nowhere.
              onClick={() =>
                navigator.clipboard?.writeText(
                  publicPath?.startsWith("http")
                    ? publicPath
                    : `${window.location.origin}${publicPath}`
                )
              }
            >
              Copy
            </button>
          </span>
        ) : (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
            Site-wide piece — appears on every page, no address of its own
          </span>
        )}
      </div>
      {showLibrary && (
        <div
          onClick={() => setShowLibrary(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 80,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 10,
              width: 460,
              maxWidth: "92vw",
              maxHeight: "70vh",
              overflow: "auto",
              padding: 18,
              boxShadow: "0 20px 50px rgba(0,0,0,.25)",
            }}
          >
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Saved sections</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#4b5563" }}>
              Bands you kept from any site. They land at the bottom of this page — use ▲ on the
              section to move it up.
            </p>

            {!library.length ? (
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                Nothing saved yet. Select a section on any page and press ★ on its toolbar.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {library.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid var(--color-sjc-line)",
                      borderRadius: 7,
                      padding: "8px 10px",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => insertSection(s.id, s.name)}
                      style={btn}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLibrary(false)}
              style={{ ...btn, marginTop: 14 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showVersions && (
        <div
          onClick={() => setShowVersions(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 80,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 10,
              width: 460,
              maxWidth: "92vw",
              maxHeight: "70vh",
              overflow: "auto",
              padding: 18,
              boxShadow: "0 20px 50px rgba(0,0,0,.25)",
            }}
          >
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700 }}>Earlier versions</h2>
            {/* The wording carries the two facts that stop this being frightening: it lists
                PUBLISHES, and restoring does not touch the live site. */}
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#4b5563" }}>
              Every time you pressed Publish. Restoring loads that version back into the builder so
              you can look at it — <strong>your live site doesn&apos;t change</strong> until you
              press Publish again.
            </p>

            {!versions.length ? (
              <p style={{ fontSize: 13, color: "#6b7280" }}>
                This page hasn&apos;t been published yet, so there&apos;s nothing to go back to.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {versions.map((v, i) => (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: "1px solid var(--color-sjc-line)",
                      borderRadius: 7,
                      padding: "8px 10px",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: 13 }}>
                      {new Date(v.at).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {i === 0 && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280" }}>
                          current
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      {Math.round(v.bytes / 1024)} KB
                    </span>
                    <button
                      type="button"
                      disabled={busy || i === 0}
                      onClick={() => restoreVersion(v.id)}
                      style={{ ...btn, opacity: i === 0 ? 0.4 : 1 }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowVersions(false)}
              style={{ ...btn, marginTop: 14 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* CLICK A WORD ON THE PAGE, GET THAT WORD'S ROW.
          A bought design lands as forty-odd text rows in one section, so finding the line you are
          looking straight at meant scrolling the whole list. Every filled word carries a
          data-sjc-text marker while editing (DesignSection's `mark`), so a click can name it.

          Capture phase, and it never calls preventDefault: Puck still receives the same click and
          still does the selecting. This only answers WHICH row. Keeping the two independent is
          the point — a Puck upgrade can't quietly disable it.

          The row is LATCHED rather than shouted, because when the section wasn't already selected
          the field doesn't exist yet at click time. See lib/designFocus.ts. */}
      <div
        style={{ flex: 1, minHeight: 0, position: "relative" }}
        onClickCapture={(e) => {
          const hit = (e.target as HTMLElement | null)?.closest?.("[data-sjc-text]");
          const key = hit?.getAttribute("data-sjc-text");
          if (key) requestTextFocus(key);
        }}
      >
        <SizeScaleContext.Provider value={sizeScale}>
        <Puck
          key={page}
          config={config}
          data={data}
          iframe={{ enabled: false }}
          // ⛔ THE HEADER SAID `{{business.name}}` (fixed 2026-08-12). Puck's default header shows
          // `root.props.title` — the page's SEO title — which on a tokenised page is the literal
          // characters `{{business.name}}`. Steven, looking at it: *"that whole custom value
          // bullshit is for code, not humans… the only way I know I'm in the right website is I
          // have to read the URL."*
          //
          // A token is a STORAGE format. It must never be what a person reads. And the useful thing
          // to put in the one always-visible spot is not the SEO title at all — it is WHERE YOU
          // ARE: which website, which page. That is the question the header should answer.
          // ⛔ THE BUSINESS NAME, NOT THE SITE LABEL, AND NO URL. Steven: *"I don't need to see the
          // URL there for the second time. What I want to see there is Steven James Consulting or
          // Alamo Slim Clinic — I want to see the business name."*
          //
          // The address is already in the browser bar and again in the toolbar's live link, so a
          // third copy in the one always-visible line was spending the most valuable space in the
          // editor on something already answered twice. `site.name` is the LABEL in the gallery
          // ("SJC 2026"); the business name is who the website is FOR, which is the thing you need
          // when you have several open.
          //
          // Falls back to the label only when Website settings has no business name yet.
          headerTitle={`${businessName?.trim() || siteName} › ${title}`}
          overrides={{ actionBar: SectionActionBar, fields: FieldsPanel }}
          onChange={onChange}
          onPublish={async (d) => {
            await writeDraft(d);
            await fetch(`/api/puck?page=${encodeURIComponent(page)}&site=${encodeURIComponent(siteId)}&action=publish`, {
              method: "POST",
              credentials: "same-origin",
            });
            setLive(true);
            if (typeof window !== "undefined") {
              // The real address, not a guess — /<page> was wrong for every client website.
              // ⚠️ SAY WHICH OF THE TWO THINGS HAPPENED. Publish ships the CONTENT; the site's
              // state decides whether anyone can reach it. Reporting "live on <url>" for a Draft
              // site is the receipt lying about the page.
              window.alert(
                reachable
                  ? `Published — live on ${publicPath || "this site"}`
                  : `Published. This site is still ${reach?.status ?? "draft"}, so nobody can reach it yet — set it to Demo or Published in the Design Library.`
              );
            }
          }}
        />
        </SizeScaleContext.Provider>
      </div>
    </div>
  );
}

const bar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 14px",
  borderBottom: "1px solid #e5e7eb",
  background: "#fff",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};
const moreMenu: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  zIndex: 41,
  minWidth: 210,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  boxShadow: "0 10px 30px rgba(0,0,0,.12)",
  padding: 4,
  display: "flex",
  flexDirection: "column",
};
const moreItem: React.CSSProperties = {
  textAlign: "left",
  background: "none",
  border: "none",
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 600,
  color: "#111827",
  cursor: "pointer",
  borderRadius: 6,
};
const select: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 13,
  fontWeight: 600,
  background: "#fff",
  cursor: "pointer",
};
const btn: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 6,
  padding: "5px 10px",
  fontSize: 13,
  fontWeight: 600,
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
};
const btnDanger: React.CSSProperties = {
  ...btn,
  border: "1px solid #fecaca",
  color: "#b91c1c",
};
