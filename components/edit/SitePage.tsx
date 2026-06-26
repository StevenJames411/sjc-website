"use client";
import React, { useMemo } from "react";
import { EditTextContext } from "./editContext";
import { resolveOrder, type SiteDoc } from "@/lib/contentShared";
import { REGISTRY } from "@/components/sections/registry";

// Pure renderer for the homepage's registry sections. The OLD inline editor + Sections reorder
// panel have been retired — editing/reordering now happens in the Puck builder at /edit/home.
// This renders the sections in the published order with the published text overrides applied.
export default function SitePage({ pageKey, published }: { pageKey: string; published: SiteDoc }) {
  const sections = useMemo(() => REGISTRY[pageKey] || [], [pageKey]);
  const byKey = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.key, s.Component])),
    [sections]
  );
  const order = useMemo(
    () => resolveOrder(sections.map((s) => s.key), published.order),
    [sections, published.order]
  );

  const ctx = useMemo(
    () => ({
      editing: false,
      getText: (tid: string, fallback: string) => {
        const v = published.texts?.[tid];
        return v === undefined || v === null ? fallback : v;
      },
      setText: () => {},
      getSize: (tid: string) => published.sizes?.[tid],
      getAlign: (tid: string) => published.aligns?.[tid],
      setActiveTid: () => {},
      getHidden: (tid: string) => Boolean(published.hidden?.[tid]),
      toggleHidden: () => {},
    }),
    [published]
  );

  return (
    <EditTextContext.Provider value={ctx}>
      {order.map((k) => {
        const C = byKey[k];
        return C ? <C key={k} /> : null;
      })}
    </EditTextContext.Provider>
  );
}
