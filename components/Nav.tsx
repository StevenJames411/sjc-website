import { readPuckPublished } from "@/lib/puckContent";
import { NAV_DEFAULTS } from "@/components/puck/config";
import NavView from "@/components/NavView";

// The live site nav. Reads the ONE published "nav" block (edited at /edit/nav) so the whole
// site shares it — edit once, applies everywhere. Falls back to NAV_DEFAULTS until published,
// so it never renders blank. Async server component (the read happens on the server); the
// interactive header itself is NavView (client).
export default async function Nav() {
  let props = NAV_DEFAULTS;
  try {
    const data = await readPuckPublished("nav");
    const block = (data?.content || []).find((b) => b?.type === "SiteHeader");
    if (block?.props) props = { ...NAV_DEFAULTS, ...(block.props as typeof NAV_DEFAULTS) };
  } catch {
    // store unavailable -> keep defaults
  }
  return <NavView {...props} />;
}
