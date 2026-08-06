"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, ActionBar, usePuck, type Data } from "@measured/puck";
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
  page,
  title,
  pages,
  siteDomain,
}: {
  siteId: string;
  siteName: string;
  page: string;
  title: string;
  pages: PageItem[];
  /** Set once the client owns a domain — it moves the whole site off the studio address. */
  siteDomain?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
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
      const s = seedFor(page, title);
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
      const next = draft || (await read(`/api/puck?page=${key}&site=${siteId}&pub=1`)) || seedFor(page, title);
      if (alive) setData(next);
    };
    load();
    return () => {
      alive = false;
    };
  }, [page, title, siteId]);

  // Debounced auto-save on every edit.
  const onChange = (d: Data) => {
    if (timer.current) clearTimeout(timer.current);
    setSave("saving");
    timer.current = setTimeout(() => writeDraft(d), 800);
  };

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
          ← {siteName}
        </button>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Page:</span>
        <select
          value={page}
          onChange={(e) => router.push(`/edit/${siteId}/${e.target.value}`)}
          style={select}
        >
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
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
        <button
          type="button"
          onClick={onAdoptImages}
          disabled={busy}
          style={btn}
          title="Copy this page's images onto our own storage so nothing depends on whoever generated the design"
        >
          Adopt images
        </button>
        <button
          type="button"
          onClick={onSaveAsTemplate}
          disabled={busy}
          style={btn}
          title="Strip the business details and save this layout as a reusable template"
        >
          Save as template
        </button>
        <button type="button" onClick={onRenamePage} disabled={busy} style={btn}>
          Rename
        </button>
        {canDelete ? (
          <button type="button" onClick={onDeletePage} disabled={busy} style={btnDanger}>
            Delete Page
          </button>
        ) : null}
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
            <span
              title={live ? "Published" : "Not published yet"}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: live === null ? "#d1d5db" : live ? "#16a34a" : "#f59e0b",
              }}
            />
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
              title={live === false ? "Nothing published here yet — hit Publish first" : "Open the live page"}
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
        <Puck
          key={page}
          config={config}
          data={data}
          iframe={{ enabled: false }}
          overrides={{ actionBar: SectionActionBar }}
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
              window.alert(`Published — live on ${publicPath || "this site"}`);
            }
          }}
        />
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
