"use client";
import React, { useMemo } from "react";
import { EditTextContext } from "./editContext";
import type { SiteDoc } from "@/lib/contentShared";

// Pure renderer for a hardcoded page's content. The OLD inline editor (bottom toolbar) has been
// retired — editing now happens entirely in the Puck builder at /edit/<page>. This just supplies
// the published text/size/align/hidden overrides to the <Editable> nodes (editing always off),
// so any page not yet published in Puck still renders its committed + last-published content.
export default function EditablePage({
  published,
  children,
}: {
  pageKey: string;
  published: SiteDoc;
  children: React.ReactNode;
}) {
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

  return <EditTextContext.Provider value={ctx}>{children}</EditTextContext.Provider>;
}
