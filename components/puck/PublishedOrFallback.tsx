import type { ReactNode } from "react";
import { Render } from "@measured/puck";
import { readPuckPublished } from "@/lib/puckContent";
import { config } from "@/components/puck/config";

// Server helper for a public page: if a Puck version of this page has been published, render
// that; otherwise fall back to the page's committed hand-coded content (children). Lets us put
// any page on the builder one at a time with zero regression — until it's published in Puck,
// the old page shows exactly as before. Drop it inside <main>, wrapping the existing content.
export default async function PublishedOrFallback({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  const puck = await readPuckPublished(page);
  if (puck) return <Render config={config} data={puck} />;
  return <>{children}</>;
}
