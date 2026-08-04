"use client";
import { createContext, useContext, useEffect } from "react";
// ⚠️ editNavShared, NOT editNav — the latter imports lib/store → ioredis → node:dns and would
// break the browser build outright. See the warning at the top of editNavShared.ts.
import { ENTRIES, type NavDoc } from "@/lib/editNavShared";

// HOW A CLIENT-RENDERED SCREEN LEARNS ITS OWN NAME.
//
// Server pages just await navLabel(). But /edit/brand and /edit/import are "use client" pages —
// they cannot await anything on the server, and turning each into a server wrapper around a client
// child is a lot of moving parts to buy one string.
//
// The shell already holds the whole menu, and both of those pages render inside it, so it hands the
// document down instead. Same source of truth, same key, no second copy of the name.
export const NavContext = createContext<NavDoc | null>(null);

/**
 * The name Steven gave this screen, and the browser tab to match.
 *
 * ⛔ The KEY is the argument, never the label. `useNavTitle("brand")` keeps working after the rail
 * has been renamed to "Global-Brand-Settings" and again after he changes his mind — the same law
 * that stops a renamed link from moving. See lib/editNav.ts.
 */
export function useNavTitle(key: string): string {
  const doc = useContext(NavContext);
  const fallback = ENTRIES.find((e) => e.type === "item" && e.key === key)?.label || key;
  const found = doc?.entries.find((e) => e.type === "item" && e.key === key);
  const label = found?.label?.trim() || fallback;

  // Server pages set this through generateMetadata; a client page has to do it itself, and it must
  // be in an effect — document doesn't exist while React is rendering on the server.
  useEffect(() => {
    document.title = label;
  }, [label]);

  return label;
}
