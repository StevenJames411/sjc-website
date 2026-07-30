"use client";
import { createContext, useContext } from "react";

// Which website a block is being rendered inside.
//
// Blocks get their props from saved page data, which is exactly why a lead form could not know
// who it belonged to — its destination was a text field somebody had to type correctly, on every
// page, forever. This carries the site id down from the route instead, so the answer comes from
// where the page is being served rather than from what someone remembered to fill in.

const SiteCtx = createContext<{ siteId: string }>({ siteId: "" });

export const useSiteId = () => useContext(SiteCtx).siteId;

export function SiteProvider({ siteId, children }: { siteId: string; children: React.ReactNode }) {
  return <SiteCtx.Provider value={{ siteId }}>{children}</SiteCtx.Provider>;
}
