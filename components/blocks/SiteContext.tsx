"use client";
import { createContext, useContext } from "react";
import type { BusinessFacts } from "@/lib/sitesShared";

// Which website a block is being rendered inside.
//
// Blocks get their props from saved page data, which is exactly why a lead form could not know
// who it belonged to — its destination was a text field somebody had to type correctly, on every
// page, forever. This carries the site id down from the route instead, so the answer comes from
// where the page is being served rather than from what someone remembered to fill in.
//
// ⚠️ IT ALSO CARRIES THE BUSINESS FACTS, AND THAT IS NOT DECORATION.
//
// `fillBusinessTokens` resolves {{business.*}} by walking SAVED PAGE DATA. A token written as a
// LITERAL inside a component's JSX is never in that data, so it was never resolved — it reached
// the customer raw. That is exactly what happened to the lead form's thank-you copy: a real
// visitor submitted the form and was told to "Call {{business.phone}}". The comment above it
// asserted the tokens resolved at public render; they did not, and nothing tested the claim.
//
// So any block holding token text of its own resolves it from HERE, not from the data walk.

const EMPTY: BusinessFacts = {
  name: "",
  phone: "",
  phoneDisplay: "",
  email: "",
  address: "",
  hours: "",
};

const SiteCtx = createContext<{ siteId: string; business: BusinessFacts; url: string }>({
  siteId: "",
  business: EMPTY,
  url: "",
});

export const useSiteId = () => useContext(SiteCtx).siteId;
/** The business facts for the site being rendered — for blocks whose token text is a JSX literal. */
export const useBusiness = () => useContext(SiteCtx).business;
export const useSiteUrl = () => useContext(SiteCtx).url;

export function SiteProvider({
  siteId,
  business,
  url = "",
  children,
}: {
  siteId: string;
  business?: BusinessFacts;
  url?: string;
  children: React.ReactNode;
}) {
  return (
    <SiteCtx.Provider value={{ siteId, business: business || EMPTY, url }}>
      {children}
    </SiteCtx.Provider>
  );
}
