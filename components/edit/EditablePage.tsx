"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EditTextContext } from "./editContext";
import EditToolbar from "./EditToolbar";
import LoginModal from "./LoginModal";
import type { SiteDoc } from "@/lib/contentShared";

// The editing chrome for a HARDCODED page (field pages, pillar pages, the Industries hub).
// Same inline-text editing + Save/Publish/Done as the homepage's SitePage, but WITHOUT the
// section-reorder registry — the page lays out its own <Editable> content as children, and
// this wrapper supplies the edit context, toolbar, draft load/save, and publish.
// Signed-in owner sees their saved DRAFT; the public sees the published snapshot from the server.
export default function EditablePage({
  pageKey,
  published,
  children,
}: {
  pageKey: string;
  published: SiteDoc;
  children: React.ReactNode;
}) {
  const [texts, setTexts] = useState<Record<string, string>>(published.texts || {});
  const [sizes, setSizes] = useState<Record<string, number>>(published.sizes || {});
  const [aligns, setAligns] = useState<Record<string, "left" | "center" | "right">>(
    published.aligns || {}
  );
  const [hidden, setHidden] = useState<Record<string, boolean>>(published.hidden || {});
  const [activeTid, setActiveTidState] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const getText = useCallback(
    (tid: string, fallback: string) => {
      const v = texts[tid];
      return v === undefined || v === null ? fallback : v;
    },
    [texts]
  );

  const setText = useCallback((tid: string, value: string) => {
    setTexts((prev) => (prev[tid] === value ? prev : { ...prev, [tid]: value }));
    setDirty(true);
  }, []);

  const getSize = useCallback((tid: string) => sizes[tid], [sizes]);

  const setActiveTid = useCallback((tid: string | null) => setActiveTidState(tid), []);

  const adjustSize = useCallback(
    (delta: number) => {
      if (!activeTid) return;
      const el = document.querySelector<HTMLElement>(`[data-tid="${activeTid}"]`);
      const current = sizes[activeTid] ?? (el ? parseFloat(getComputedStyle(el).fontSize) : 16);
      const next = Math.min(120, Math.max(10, Math.round(current + delta)));
      setSizes((prev) => ({ ...prev, [activeTid]: next }));
      setDirty(true);
    },
    [activeTid, sizes]
  );

  const getAlign = useCallback((tid: string) => aligns[tid], [aligns]);

  const setAlign = useCallback(
    (value: "left" | "center" | "right") => {
      if (!activeTid) return;
      setAligns((prev) => ({ ...prev, [activeTid]: value }));
      setDirty(true);
    },
    [activeTid]
  );

  const getHidden = useCallback((tid: string) => Boolean(hidden[tid]), [hidden]);

  // Flip the selected element between hidden (deleted) and visible. Hides, never destroys.
  const toggleHidden = useCallback(() => {
    if (!activeTid) return;
    setHidden((prev) => ({ ...prev, [activeTid]: !prev[activeTid] }));
    setDirty(true);
  }, [activeTid]);

  const loadDraft = useCallback(async () => {
    try {
      const r = await fetch(`/api/site-content?page=${encodeURIComponent(pageKey)}`);
      const j = await r.json();
      const st = (j && j.state) || {};
      setTexts(st.texts || {});
      setSizes(st.sizes || {});
      setAligns(st.aligns || {});
      setHidden(st.hidden || {});
    } catch {
      /* keep current */
    }
  }, [pageKey]);

  const enterEdit = useCallback(async () => {
    await loadDraft();
    setEditing(true);
    setDirty(false);
  }, [loadDraft]);

  const exitEdit = useCallback(() => {
    setEditing(false);
    setDirty(false);
    // Owner keeps seeing their saved draft after Done (matches SitePage behavior).
    loadDraft();
  }, [loadDraft]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ page: pageKey, state: { texts, sizes, aligns, hidden } }),
      });
      const j = await r.json();
      if (j && j.ok) setDirty(false);
      return Boolean(j && j.ok);
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [pageKey, texts, sizes, aligns, hidden]);

  useEffect(() => {
    let editParam = false;
    try {
      editParam = new URLSearchParams(window.location.search).get("edit") === "1";
    } catch {
      /* ignore */
    }
    fetch("/api/auth-status")
      .then((r) => r.json())
      .then((j) => {
        const ok = Boolean(j && j.authed);
        setAuthed(ok);
        if (editParam) {
          if (ok) enterEdit();
          else setShowLogin(true);
        } else if (ok) {
          loadDraft();
        }
      })
      .catch(() => {});
  }, [enterEdit, loadDraft]);

  const ctx = useMemo(
    () => ({ editing, getText, setText, getSize, getAlign, setActiveTid, getHidden, toggleHidden }),
    [editing, getText, setText, getSize, getAlign, setActiveTid, getHidden, toggleHidden]
  );

  return (
    <EditTextContext.Provider value={ctx}>
      {children}

      {authed && (
        <EditToolbar
          editing={editing}
          dirty={dirty}
          saving={saving}
          pageKey={pageKey}
          panelOpen={false}
          showSections={false}
          hasActive={Boolean(activeTid)}
          activeHidden={activeTid ? Boolean(hidden[activeTid]) : false}
          onEnter={enterEdit}
          onExit={exitEdit}
          onSave={save}
          onSize={adjustSize}
          onAlign={setAlign}
          onDelete={toggleHidden}
          onTogglePanel={() => {}}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setAuthed(true);
            setShowLogin(false);
            enterEdit();
          }}
        />
      )}
    </EditTextContext.Provider>
  );
}
