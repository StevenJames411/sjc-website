"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RETENTION_DAYS, daysLeft, type Site } from "@/lib/sitesShared";
import type { IntakeSummary } from "@/lib/intakeShared";
import { publicUrlFor, onboardUrlFor } from "@/lib/hostShared";
import IntakeAnswers from "./IntakeAnswers";

// The way into the builder: a wall of website cards, not a dropdown.
//
// A dropdown was fine for one site. At a hundred it is a four-hundred-entry list holding every
// client's pages in one drawer — which is also how one client's work ends up visible while editing
// another's. Every builder that does this at scale (GoHighLevel, Landingsite, SiteDrop) opens on a
// gallery with search and a New-website button, and the page switcher lives INSIDE a site.

type Props = { sites: Site[]; intake: Record<string, IntakeSummary>; title: string };
type Mode = "blank" | "template" | "import";

export default function SiteGallery({ sites, intake, title }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Which card's onboarding button is mid-flight, so it can't be double-clicked.
  const [flip, setFlip] = useState("");
  const [copied, setCopied] = useState("");
  // Which business's answers are on screen. Fetched when opened, not shipped with the gallery.
  const [reading, setReading] = useState<{ id: string; name: string } | null>(null);
  // Which card is asking "are you sure", what's been typed to confirm it, and what's mid-delete.
  const [confirmDel, setConfirmDel] = useState("");
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState("");
  const [delErr, setDelErr] = useState("");

  /**
   * Delete a website and everything under it.
   *
   * ⚠️ THERE IS NO UNDO. lib/sites.ts deleteSite() purges the page registry, every page's draft
   * and published content, its imported design stylesheet and its brand before removing the
   * registry row. That is the correct order — a failed registry write must not strand live pages
   * at a URL — but it also means a mis-click costs a client's entire website.
   *
   * So the confirmation scales with what's at stake: a demo needs one deliberate second click; a
   * site with a domain on it is a real business's live address, and needs its name typed.
   */
  async function removeSite(s: Site) {
    setDeleting(s.id);
    setDelErr("");
    try {
      const r = await fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: s.id }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't delete it.");
      setConfirmDel("");
      setTyped("");
      router.refresh();
    } catch (e) {
      setDelErr((e as Error).message);
    } finally {
      setDeleting("");
    }
  }

  // Open or close a business's onboarding form. The state IS the guard — the URL is her business
  // name and deliberately guessable, so this switch is the only thing standing between a stranger
  // and her record. See lib/intakeLinks.ts.
  async function setIntake(siteId: string, action: "open" | "close") {
    setFlip(siteId);
    try {
      await fetch(`/api/admin/intake?site=${encodeURIComponent(siteId)}&action=${action}`, {
        method: "POST",
        credentials: "same-origin",
      });
      router.refresh();
    } finally {
      setFlip("");
    }
  }

  async function copyLink(site: Site) {
    // The onboarding link has to look like her website's address, because that's what makes it
    // legitimate in a text message — so it follows the same host rules, not the editor's origin.
    await navigator.clipboard?.writeText(onboardUrlFor(site));
    setCopied(site.id);
    setTimeout(() => setCopied(""), 1800);
  }

  // The bin. Kept out of every other list — a deleted site must not appear as a template, in
  // search, or anywhere it could be mistaken for live.
  const binned = useMemo(() => sites.filter((s) => s.deletedAt), [sites]);
  const templates = useMemo(
    () => sites.filter((s) => s.kind === "template" && !s.deletedAt),
    [sites]
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const live = sites.filter((s) => s.kind !== "template" && !s.deletedAt);
    if (!needle) return live;
    return live.filter((s) =>
      [s.name, s.description, s.domain, s.business?.name].filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [sites, q]);

  async function restore(s: Site) {
    setDeleting(s.id);
    try {
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "restore", id: s.id }),
      });
      const body = await r.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't put it back.");
      router.refresh();
    } catch (e) {
      setDelErr((e as Error).message);
    } finally {
      setDeleting("");
    }
  }

  async function eraseNow(s: Site) {
    setDeleting(s.id);
    try {
      const r = await fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id: s.id, forever: true }),
      });
      const body = await r.json();
      if (!body?.ok) throw new Error(body?.error || "Couldn't erase it.");
      setConfirmDel("");
      router.refresh();
    } catch (e) {
      setDelErr((e as Error).message);
    } finally {
      setDeleting("");
    }
  }

  return (
    <div style={page}>
      {reading ? (
        <IntakeAnswers
          siteId={reading.id}
          businessName={reading.name}
          onClose={() => setReading(null)}
        />
      ) : null}
      <div style={head}>
        <div>
          <h1 style={h1}>{title}</h1>
          <p style={sub}>Create and manage your websites</p>
        </div>
        {/* NAVIGATION LIVES IN THE RAIL NOW — components/edit/EditShell.tsx.
            The old rule here was "anything new gets a button or it doesn't exist", written because
            /edit/brand and /edit/import were built and then linked from nowhere, reachable only by
            typing the URL. The rule still holds; it now points at the rail's NAV array, which
            appears on every page instead of only this one.
            + New website stays — it's an action on this screen, not navigation. */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" style={primaryBtn} onClick={() => setOpen(true)}>
            + New website
          </button>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search websites…"
        style={search}
      />

      <div style={grid}>
        {shown.map((s) => (
          <div key={s.id} style={card}>
            <div style={cardTop}>
              {/* The badge says what the SITE is, not what a field is missing. "No domain yet"
                  described the record; "Demo" describes the thing you actually need to know when
                  scanning a hundred of these — is this out with a prospect, or is it a paying
                  client pointed at their own domain? */}
              <div style={badgeRow}>
                {s.kind === "sjc" ? <span style={chip}>Yours</span> : null}
                {s.domain ? (
                  <span style={chipLive}>{s.domain}</span>
                ) : (
                  <span style={chipDemo} title="No domain yet — served from our address and kept out of Google">
                    Demo
                  </span>
                )}
              </div>
              <h2 style={cardName}>{s.name}</h2>
              {s.description ? <p style={cardDesc}>{s.description}</p> : null}
              {/* The live address, so you can look at a site without opening the builder. Once a
                  domain is attached that becomes the real address; until then it's our path. */}
              {/* Built by the same function the server uses to decide what to serve, so this
                  link and the live page can never disagree. A demo points at the studio domain;
                  once a client owns a domain it points there instead. */}
              <a
                href={publicUrlFor(s)}
                target="_blank"
                rel="noreferrer"
                style={cardLink}
                onClick={(e) => e.stopPropagation()}
              >
                {publicUrlFor(s).replace(/^https:\/\//, "")} ↗
              </a>
            </div>

            {/* ONBOARDING — the chase list.
                One control whose label follows the state, because there is only ever one sensible
                next move: switch it on, send her the link, or open it again when you need more.
                The count is the point — "open · 1 of 9" for four days is a client who needs a
                nudge, visible without opening anything.
                Not shown for SJC's own site, which has nobody to onboard. */}
            {s.kind !== "sjc" ? (
              <div style={intakeRow}>
                <span style={intakeLabel}>
                  {(() => {
                    const it = intake[s.id];
                    if (!it || it.status === "never opened") return "Onboarding: not started";
                    if (it.submitted) return `Onboarding: done · ${it.photos} photos`;
                    if (it.status === "closed") return "Onboarding: closed";
                    return `Onboarding: open · ${it.answered} of ${it.asked}`;
                  })()}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {(intake[s.id]?.answered || 0) > 0 || intake[s.id]?.submitted ? (
                    <button
                      type="button"
                      style={linkBtn}
                      title="Read what she's told us so far"
                      onClick={() => setReading({ id: s.id, name: s.name })}
                    >
                      View answers
                    </button>
                  ) : null}
                  {intake[s.id]?.status === "open" ? (
                    <>
                      <button
                        type="button"
                        style={linkBtn}
                        title="Copy her link, ready to text or email"
                        onClick={() => copyLink(s)}
                      >
                        {copied === s.id ? "Copied" : "Copy link"}
                      </button>
                      <button
                        type="button"
                        style={linkBtn}
                        disabled={flip === s.id}
                        onClick={() => setIntake(s.id, "close")}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={openBtn}
                      disabled={flip === s.id}
                      title="Switch her form on so she can fill it in"
                      onClick={() => setIntake(s.id, "open")}
                    >
                      {flip === s.id
                        ? "…"
                        : intake[s.id]?.submitted
                          ? "Reopen"
                          : "Open it"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {confirmDel === s.id ? (
              /* The confirm REPLACES the row rather than opening a dialog, so the thing being
                 deleted stays on screen underneath the question. */
              <div style={delPanel}>
                {/* Deleting is REVERSIBLE now, and the copy has to say so — the old wording
                    ("can't be undone") is why Steven hesitated over this button. */}
                <p style={delWarn}>
                  Delete <strong>{s.name}</strong>? It stops being live straight away and moves to
                  Deleted, where you can put it back for <strong>{RETENTION_DAYS} days</strong>.
                  After that it&rsquo;s erased for good.
                </p>
                {s.domain ? (
                  <>
                    <p style={delTypeHint}>
                      This one is live at <strong>{s.domain}</strong>. Type its name to confirm.
                    </p>
                    <input
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder={s.name}
                      style={delInput}
                      autoFocus
                    />
                  </>
                ) : null}
                {delErr ? <p style={delErrText}>{delErr}</p> : null}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    style={{ ...ghostBtn, flex: 1 }}
                    onClick={() => {
                      setConfirmDel("");
                      setTyped("");
                      setDelErr("");
                    }}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    style={{ ...dangerBtn, flex: 1 }}
                    disabled={deleting === s.id || (!!s.domain && typed.trim() !== s.name)}
                    onClick={() => removeSite(s)}
                  >
                    {deleting === s.id ? "Deleting…" : "Delete it"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={{ ...editBtn, flex: 1 }}
                  onClick={() => router.push(`/edit/${s.id}/home`)}
                >
                  Edit
                </button>
                {/* The card carries the company name; everything else about the business lives one
                    click in — same as Landingsite and GHL. */}
                <button
                  type="button"
                  style={gearBtn}
                  title="Website settings — name, phone, address, domain"
                  onClick={() => router.push(`/edit/${s.id}/settings`)}
                >
                  ⚙
                </button>
                {/* Not offered for SJC's own site — deleteSite() refuses it anyway, and a button
                    that always fails is worse than no button. */}
                {s.kind !== "sjc" ? (
                  <button
                    type="button"
                    style={trashBtn}
                    title={`Delete ${s.name}`}
                    aria-label={`Delete ${s.name}`}
                    onClick={() => {
                      setConfirmDel(s.id);
                      setTyped("");
                      setDelErr("");
                    }}
                  >
                    🗑
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
        {!shown.length ? (
          <p style={{ color: "var(--e-muted)", fontSize: 14 }}>
            {q ? "No websites match that." : "No websites yet."}
          </p>
        ) : null}
      </div>

      {templates.length ? (
        <>
          <h3 style={sectionH}>Templates</h3>
          <div style={grid}>
            {templates.map((t) => (
              <div key={t.id} style={{ ...card, borderStyle: "dashed" }}>
                <div style={cardTop}>
                  <span style={chip}>Template</span>
                  <h2 style={cardName}>{t.name}</h2>
                  {t.description ? <p style={cardDesc}>{t.description}</p> : null}
                </div>
                <button type="button" style={editBtn} onClick={() => router.push(`/edit/${t.id}/home`)}>
                  Edit template
                </button>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* THE BIN. Deleted websites live here for RETENTION_DAYS and can be put back with one
          click. Shown last and muted — it's a safety net, not part of the daily view. */}
      {binned.length ? (
        <>
          <h3 style={sectionH}>Deleted</h3>
          <p style={binNote}>
            Not live any more. Kept for {RETENTION_DAYS} days in case you want them back, then
            erased for good — pages, content and the owner&rsquo;s onboarding answers.
          </p>
          <div style={grid}>
            {binned.map((s) => {
              const left = daysLeft(s) ?? 0;
              return (
                <div key={s.id} style={{ ...card, opacity: 0.72 }}>
                  <div style={cardTop}>
                    <span style={{ ...chip, background: "var(--e-bad-bg)", color: "var(--e-danger)" }}>
                      {left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : "erasing today"}
                    </span>
                    <h2 style={cardName}>{s.name}</h2>
                    {s.domain ? <p style={cardDesc}>{s.domain}</p> : null}
                  </div>
                  {confirmDel === s.id ? (
                    <div style={delPanel}>
                      <p style={delWarn}>
                        Erase <strong>{s.name}</strong> now — every page, its design, and the
                        owner&rsquo;s onboarding answers, including the saved history. This one
                        really can&rsquo;t be undone.
                      </p>
                      {delErr ? <p style={delErrText}>{delErr}</p> : null}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" style={{ ...ghostBtn, flex: 1 }} onClick={() => setConfirmDel("")}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          style={{ ...dangerBtn, flex: 1 }}
                          disabled={deleting === s.id}
                          onClick={() => eraseNow(s)}
                        >
                          {deleting === s.id ? "Erasing…" : "Erase for good"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        style={{ ...editBtn, flex: 1 }}
                        disabled={deleting === s.id}
                        onClick={() => restore(s)}
                      >
                        {deleting === s.id ? "Putting it back…" : "Put it back"}
                      </button>
                      <button type="button" style={trashBtn} title="Erase now" onClick={() => setConfirmDel(s.id)}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {open ? (
        <NewWebsite
          templates={templates}
          busy={busy}
          setBusy={setBusy}
          onClose={() => setOpen(false)}
          onDone={(id) => router.push(`/edit/${id}/home`)}
        />
      ) : null}
    </div>
  );
}

// Three ways to start, the same three these platforms offer. Import is first because it is the
// one that saves the most time: the design already exists somewhere else.
function NewWebsite({
  templates,
  busy,
  setBusy,
  onClose,
  onDone,
}: {
  templates: Site[];
  busy: boolean;
  setBusy: (b: boolean) => void;
  onClose: () => void;
  onDone: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("import");
  const [name, setName] = useState("");
  const [from, setFrom] = useState(templates[0]?.id || "");
  const [source, setSource] = useState("");
  // How a bought design comes in. "editable" maps it onto real blocks — drag, drop, restructure,
  // at roughly 95% of the original. "design" keeps the markup sealed: pixel-exact, but only the
  // words and photos can be changed. Neither is right for every design, so it's a choice.
  const [importAs, setImportAs] = useState<"editable" | "design">("design");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  const looksLikeHtml = /<\s*(html|head|body|section|header|div)/i.test(source);

  async function go() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "import") {
        if (!source.trim()) throw new Error("Paste the website's address, or its HTML.");
        setNote("Fetching and parsing… this can take up to a minute.");
        const r = await fetch("/api/import-html", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(
            looksLikeHtml
              ? { html: source, businessName: name.trim(), mode: importAs }
              : { url: source.trim(), businessName: name.trim(), mode: importAs }
          ),
        }).then((x) => x.json());
        if (!r.ok) throw new Error(r.error || "Import failed.");
        return onDone(r.siteId);
      }

      if (!name.trim()) throw new Error("A website name is required.");
      const r = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: name.trim(), ...(mode === "template" ? { from } : {}) }),
      }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "Couldn't create it.");
      onDone(r.id);
    } catch (e) {
      setErr((e as Error).message);
      setNote("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={scrim} onClick={busy ? undefined : onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Create new website</h2>
        <p style={{ ...sub, marginBottom: 18 }}>Start from an existing design, a template, or nothing.</p>

        <div style={tabs}>
          {(
            [
              ["import", "From import", "Pull in a design from SiteDrop or anywhere else"],
              ["template", "From template", "Start with a prebuilt layout"],
              ["blank", "From blank", "An empty website"],
            ] as [Mode, string, string][]
          ).map(([m, label, hint]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={m === "template" && !templates.length}
              style={{
                ...tab,
                ...(mode === m ? tabOn : {}),
                ...(m === "template" && !templates.length ? { opacity: 0.45, cursor: "not-allowed" } : {}),
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 12, color: "var(--e-muted)" }}>
                {m === "template" && !templates.length ? "No templates yet" : hint}
              </span>
            </button>
          ))}
        </div>

        {mode === "import" ? (
          <>
            <label style={lbl}>Website address, or paste its HTML</label>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="best-in-show-grooming.sitedrop.ai"
              style={{ ...input, minHeight: 78, fontFamily: "ui-monospace,monospace", fontSize: 12 }}
            />
            <label style={lbl}>How should it come in?</label>
            <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
              {([
                ["design", "Exactly as designed (recommended)", "Pixel-perfect. Edit every word, photo, link and colour, resize things, and your real contact form goes in. You just can't move elements around."],
                ["editable", "Rebuilt as blocks", "Full drag-and-drop, but about 95% of the original look — some detail is lost in translation."],
              ] as const).map(([v, title, why]) => (
                <label
                  key={v}
                  style={{
                    ...pickBox,
                    borderColor: importAs === v ? "var(--e-ink)" : "var(--e-line)",
                    background: importAs === v ? "var(--e-panel-2)" : "var(--e-panel)",
                  }}
                >
                  <input
                    type="radio"
                    name="importAs"
                    checked={importAs === v}
                    onChange={() => setImportAs(v)}
                    style={{ marginTop: 3 }}
                  />
                  <span>
                    <strong style={{ display: "block", fontSize: 14 }}>{title}</strong>
                    <span style={{ fontSize: 12, color: "var(--e-muted)" }}>{why}</span>
                  </span>
                </label>
              ))}
            </div>
            <label style={lbl}>Business name (optional — taken from the address if blank)</label>
          </>
        ) : (
          <label style={lbl}>Website name</label>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lucky Dog Wash House"
          style={input}
        />

        {mode === "template" ? (
          <>
            <label style={lbl}>Template</label>
            <select value={from} onChange={(e) => setFrom(e.target.value)} style={input}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        ) : null}

        {err ? <p style={errBox}>{err}</p> : null}
        {busy && note ? <p style={{ ...sub, marginTop: 10 }}>{note}</p> : null}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
          <button type="button" style={ghostBtn} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" style={primaryBtn} onClick={go} disabled={busy}>
            {busy ? "Working…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const page: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px", fontFamily: font };
const head: React.CSSProperties = { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 };
const h1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" };
const sub: React.CSSProperties = { color: "var(--e-muted)", fontSize: 14, marginTop: 4 };
const sectionH: React.CSSProperties = { fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--e-muted)", margin: "36px 0 12px" };
const search: React.CSSProperties = { width: "100%", maxWidth: 340, margin: "24px 0", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 };
const card: React.CSSProperties = { border: "1px solid var(--e-line)", borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, minHeight: 190, background: "var(--e-panel)" };
const cardTop: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };
const badgeRow: React.CSSProperties = { display: "flex", gap: 6, flexWrap: "wrap" };
const chip: React.CSSProperties = { fontSize: 11, fontWeight: 700, background: "var(--e-info-bg)", color: "var(--e-info-ink)", borderRadius: 999, padding: "3px 9px" };
const chipMuted: React.CSSProperties = { ...chip, background: "var(--e-line-soft)", color: "var(--e-muted)" };
const chipLive: React.CSSProperties = { ...chip, background: "var(--e-ok-bg)", color: "var(--e-ok-ink)" };
const chipDemo: React.CSSProperties = { ...chip, background: "var(--e-warn-bg)", color: "var(--e-warn-ink)" };
const cardName: React.CSSProperties = { fontSize: 17, fontWeight: 700, lineHeight: 1.25 };
const cardDesc: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.45 };
const cardLink: React.CSSProperties = { fontSize: 12, color: "var(--e-accent)", textDecoration: "none", fontWeight: 600 };
const primaryBtn: React.CSSProperties = { background: "var(--e-ink)", color: "var(--e-panel)", border: "none", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const navBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", textDecoration: "none", display: "inline-block", whiteSpace: "nowrap" };
const ghostBtn: React.CSSProperties = { background: "var(--e-panel)", color: "var(--e-ink)", border: "1px solid var(--e-line)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const editBtn: React.CSSProperties = { ...primaryBtn, width: "100%", textAlign: "center" };
const pickBox: React.CSSProperties = { display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid var(--e-line)", borderRadius: 10, padding: "10px 12px", cursor: "pointer" };
const gearBtn: React.CSSProperties = { ...ghostBtn, padding: "10px 13px", fontSize: 15, lineHeight: 1 };
// Quiet by default and red only once you've committed to it — a destructive control shouldn't
// compete with Edit for attention on a card you open twenty times a day.
const trashBtn: React.CSSProperties = { ...gearBtn, color: "var(--e-danger)", borderColor: "var(--e-line)" };
const dangerBtn: React.CSSProperties = { background: "var(--e-danger)", color: "var(--e-panel)", border: "1px solid var(--e-danger)", borderRadius: 8, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const binNote: React.CSSProperties = { fontSize: 13, color: "var(--e-muted)", lineHeight: 1.55, margin: "0 0 14px", maxWidth: 640 };
const delPanel: React.CSSProperties = { border: "1px solid var(--e-bad-line)", background: "var(--e-bad-bg)", borderRadius: 10, padding: 12, display: "grid", gap: 10 };
const delWarn: React.CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.45, color: "var(--e-bad-ink)" };
const delTypeHint: React.CSSProperties = { margin: 0, fontSize: 12, color: "var(--e-bad-ink)" };
const delErrText: React.CSSProperties = { margin: 0, fontSize: 13, fontWeight: 600, color: "var(--e-danger)" };
const delInput: React.CSSProperties = { width: "100%", border: "1px solid var(--e-bad-line)", borderRadius: 8, padding: "9px 11px", fontSize: 14 };
const scrim: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(17,24,39,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 };
const modal: React.CSSProperties = { background: "var(--e-panel)", borderRadius: 14, padding: 26, width: "100%", maxWidth: 520, fontFamily: font, maxHeight: "90vh", overflowY: "auto" };
const tabs: React.CSSProperties = { display: "grid", gap: 8, marginBottom: 18 };
const tab: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, textAlign: "left", border: "1px solid var(--e-line)", borderRadius: 10, padding: "10px 12px", background: "var(--e-panel)", cursor: "pointer" };
const tabOn: React.CSSProperties = { borderColor: "var(--e-ink)", boxShadow: "inset 0 0 0 1px var(--e-ink)" };
const lbl: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, marginTop: 12 };
const input: React.CSSProperties = { width: "100%", border: "1px solid var(--e-line)", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" };
const errBox: React.CSSProperties = { marginTop: 12, background: "var(--e-bad-bg)", border: "1px solid var(--e-bad-line)", color: "var(--e-danger)", borderRadius: 8, padding: "9px 12px", fontSize: 13 };

// Onboarding row. Sits between the card body and the Edit button because it's status you SCAN,
// not an action you go looking for — the eye should hit it on the way past.
const intakeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 0 10px",
  borderTop: "1px solid var(--e-line-soft)",
  marginTop: 10,
};

const intakeLabel: React.CSSProperties = {
  fontSize: 12,
  color: "var(--e-muted)",
  fontWeight: 600,
};

const linkBtn: React.CSSProperties = {
  padding: "5px 9px",
  borderRadius: 6,
  border: "1px solid var(--e-line)",
  background: "var(--e-panel)",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--e-ink)",
  cursor: "pointer",
};

const openBtn: React.CSSProperties = {
  ...linkBtn,
  borderColor: "var(--e-accent)",
  color: "var(--e-accent)",
};
