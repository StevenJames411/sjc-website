import { readPuckPublished } from "@/lib/puckContent";
import { FOOTER_DEFAULTS } from "@/components/puck/config";
import FooterView from "@/components/FooterView";
import { SJC } from "@/lib/siteKeys";

// The live site footer. Reads the ONE published "footer" block (edited at /edit/footer) so the
// whole site shares it — edit once, applies everywhere. Falls back to FOOTER_DEFAULTS until
// published, so it never renders blank.
export default async function Footer() {
  let props = FOOTER_DEFAULTS;
  try {
    const data = await readPuckPublished("footer", SJC);
    const block = (data?.content || []).find((b) => b?.type === "SiteFooter");
    if (block?.props) props = { ...FOOTER_DEFAULTS, ...(block.props as typeof FOOTER_DEFAULTS) };
  } catch {
    // store unavailable -> keep defaults
  }
  return <FooterView {...props} />;
}
