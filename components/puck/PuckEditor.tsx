"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Puck, type Data } from "@measured/puck";
import "@measured/puck/puck.css";
import { config } from "@/components/puck/config";
import { seedFor } from "@/components/puck/seeds";

// The page list is passed in from the server route (it's Redis-backed now, so the client can't
// read it directly). Shape mirrors lib/pageRegistry's PageEntry.
type PageItem = { slug: string; title: string; custom?: boolean };

// The unified visual builder for ANY page. A thin bar on top adds the two things Puck doesn't
// give us: a page-switcher dropdown (jump between all our pages) and auto-save (every change
// quietly written to the cloud, with a Saving…/Saved indicator). Puck's own header keeps the
// Publish button (draft stays private until Publish pushes it live). The whole site is
// password-gated by middleware, so only the owner reaches this.
//
// To reset a page to its seed: navigate to /edit/<page>?reset=1 — the URL param triggers the
// reset on load and is then stripped, so no fumble-able button sits on the toolbar.
type SaveState = "idle" | "saving" | "saved";

export default function PuckEditor({
  siteId,
  siteName,
  page,
  title,
  pages,
}: {
  siteId: string;
  siteName: string;
  page: string;
  title: string;
  pages: PageItem[];
}) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Copy THIS page — design and all — to a new business's name and URL. The whole point of
  // building a demo once: the second one should be a rename, not a rebuild. The copy lands
  // UNPUBLISHED, so a half-edited page carrying the previous business's phone number can never
  // be live at a URL before it's been looked at.
  const onDuplicatePage = async () => {
    const name = window.prompt(
      `Copy "${title}" for which business?\n\nThe name becomes the web address — "Lucky Dog Wash House" gives you /lucky-dog-wash-house.`
    );
    if (!name || !name.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title: name.trim(), from: page, site: siteId }),
      });
      const j = await r.json();
      if (!j.ok) return window.alert(j.error || "Couldn't copy the page.");
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

  // Move this page out into a website of its own.
  //
  // Making "website" a real object didn't separate what was already tangled: a client's whole site
  // was still sitting in SJC's page list, one row under "About". This is the cleanup, and it keeps
  // the public URL identical — the new site's id is the page's slug.
  const onSplitOut = async () => {
    setBusy(true);
    try {
      const opts = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin" as const,
      };
      const look = await fetch("/api/admin/split-page", {
        ...opts,
        body: JSON.stringify({ fromSite: siteId, slug: page, dryRun: true }),
      }).then((r) => r.json());
      if (!look.ok) return window.alert(look.error || "Couldn't check that page.");

      const b = look.business || {};
      if (
        !window.confirm(
          `Move "${title}" out of ${siteName} into its own website?\n\n` +
            `Name: ${look.name}\n` +
            `Phone: ${b.phoneDisplay || b.phone || "—"}\n` +
            `Email: ${b.email || "—"}\n\n` +
            `Its address stays ${look.urlAfter}. It leaves this site's page list.`
        )
      )
        return;

      const r = await fetch("/api/admin/split-page", {
        ...opts,
        body: JSON.stringify({ fromSite: siteId, slug: page }),
      }).then((x) => x.json());
      if (!r.ok) return window.alert(r.error || "Couldn't move it.");
      window.alert(`Moved. It's now its own website with ${r.blocks} blocks, still at ${r.url}.`);
      router.push(`/edit/${r.id}/${r.page}`);
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

  const writeDraft = (d: Data) => {
    setSave("saving");
    return fetch("/api/puck", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ page, site: siteId, data: d }),
    })
      .then(() => setSave("saved"))
      .catch(() => setSave("idle"));
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
        <button type="button" onClick={onNewPage} disabled={busy} style={btn}>
          + New Page
        </button>
        {/* The demo workflow's whole shortcut — build one, copy it per prospect. */}
        <button
          type="button"
          onClick={onDuplicatePage}
          disabled={busy}
          style={btn}
          title="Copy this page's design to a new business name and URL"
        >
          Duplicate for a client
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
        {/* Only offered on a page that carries its OWN SiteHeader — that is the existing rule for
            "this belongs to another business", and it stops the button appearing on /about. */}
        {(data?.content || []).some((b) => (b as { type?: string })?.type === "SiteHeader") ? (
          <button
            type="button"
            onClick={onSplitOut}
            disabled={busy}
            style={btn}
            title="This page is a whole business's site — move it out of here into its own website"
          >
            Move to its own website
          </button>
        ) : null}
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
        <span style={{ fontSize: 12, color: save === "saved" ? "#16a34a" : "#6b7280" }}>
          {save === "saving" ? "Saving…" : save === "saved" ? "Saved" : ""}
        </span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280" }}>
          Edits auto-save as a draft · use Publish to go live · reset via /edit/{page}?reset=1
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        <Puck
          key={page}
          config={config}
          data={data}
          iframe={{ enabled: false }}
          onChange={onChange}
          onPublish={async (d) => {
            await writeDraft(d);
            await fetch(`/api/puck?page=${encodeURIComponent(page)}&site=${encodeURIComponent(siteId)}&action=publish`, {
              method: "POST",
              credentials: "same-origin",
            });
            if (typeof window !== "undefined") {
              const path = page === "home" ? "/" : `/${page}`;
              window.alert(`Published — live on ${path}`);
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
