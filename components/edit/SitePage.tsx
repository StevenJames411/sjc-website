"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EditTextContext } from "./editContext";
import EditToolbar from "./EditToolbar";
import SectionsPanel from "./SectionsPanel";
import LoginModal from "./LoginModal";
import { resolveOrder, type SiteDoc } from "@/lib/contentShared";
import { REGISTRY } from "@/components/sections/registry";

// The client orchestrator for one page. Renders the page's sections in the saved order,
// supplies the edit context (text overrides + setters), and — only for the signed-in
// editor — the floating toolbar + Sections panel. Server passes the PUBLISHED snapshot
// as `published`; entering edit mode swaps in the working DRAFT.
export default function SitePage({ pageKey, published }: { pageKey: string; published: SiteDoc }) {
  const sections = useMemo(() => REGISTRY[pageKey] || [], [pageKey]);
  const known = useMemo(() => sections.map((s) => s.key), [sections]);
  const labels = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.key, s.label])),
    [sections]
  );
  const byKey = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.key, s.Component])),
    [sections]
  );

  const [texts, setTexts] = useState<Record<string, string>>(published.texts || {});
  const [order, setOrder] = useState<string[]>(resolveOrder(known, published.order));
  const [editing, setEditing] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
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
    setTexts((prev) => {
      if (prev[tid] === value) return prev;
      return { ...prev, [tid]: value };
    });
    setDirty(true);
  }, []);

  const loadDraft = useCallback(async () => {
    try {
      const r = await fetch(`/api/site-content?page=${encodeURIComponent(pageKey)}`);
      const j = await r.json();
      const st = (j && j.state) || {};
      setTexts(st.texts || {});
      setOrder(resolveOrder(known, st.order));
    } catch {
      /* keep current */
    }
  }, [pageKey, known]);

  const enterEdit = useCallback(async () => {
    await loadDraft();
    setEditing(true);
    setDirty(false);
  }, [loadDraft]);

  const exitEdit = useCallback(() => {
    setEditing(false);
    setPanelOpen(false);
    setDirty(false);
    // The signed-in owner keeps seeing their saved DRAFT after Done (not the published
    // snapshot), so Save -> Done no longer reverts to the old copy. Public visitors never
    // reach edit mode — they always render the published snapshot from the server.
    loadDraft();
  }, [loadDraft]);

  const reorder = useCallback((next: string[]) => {
    setOrder(next);
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ page: pageKey, state: { order, texts } }),
      });
      const j = await r.json();
      if (j && j.ok) setDirty(false);
      return Boolean(j && j.ok);
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [pageKey, order, texts]);

  // On mount: am I the editor? Honor ?edit=1 (open editor, prompting login if needed).
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
          // Owner (signed in) sees their working DRAFT on the normal page view, so saved
          // edits persist across Done and reloads without being published to the public.
          loadDraft();
        }
      })
      .catch(() => {});
  }, [enterEdit, loadDraft]);

  const ctx = useMemo(() => ({ editing, getText, setText }), [editing, getText, setText]);

  return (
    <EditTextContext.Provider value={ctx}>
      {order.map((k) => {
        const C = byKey[k];
        if (!C) return null;
        return <C key={k} />;
      })}

      {authed && (
        <EditToolbar
          editing={editing}
          dirty={dirty}
          saving={saving}
          pageKey={pageKey}
          panelOpen={panelOpen}
          onEnter={enterEdit}
          onExit={exitEdit}
          onSave={save}
          onTogglePanel={() => setPanelOpen((v) => !v)}
        />
      )}

      {editing && panelOpen && (
        <SectionsPanel
          order={order}
          labels={labels}
          onReorder={reorder}
          onClose={() => setPanelOpen(false)}
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
