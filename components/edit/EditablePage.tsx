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

  const loadDraft = useCallback(async () => {
    try {
      const r = await fetch(`/api/site-content?page=${encodeURIComponent(pageKey)}`);
      const j = await r.json();
      const st = (j && j.state) || {};
      setTexts(st.texts || {});
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
        body: JSON.stringify({ page: pageKey, state: { texts } }),
      });
      const j = await r.json();
      if (j && j.ok) setDirty(false);
      return Boolean(j && j.ok);
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  }, [pageKey, texts]);

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

  const ctx = useMemo(() => ({ editing, getText, setText }), [editing, getText, setText]);

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
          onEnter={enterEdit}
          onExit={exitEdit}
          onSave={save}
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
