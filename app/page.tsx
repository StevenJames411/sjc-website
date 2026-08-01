import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Render } from "@measured/puck";
import { config } from "@/components/puck/config";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";
import { pageMetadata } from "@/lib/pageMeta";
import { resolveHost, publicUrlFor } from "@/lib/host";
import { StudioBody } from "@/lib/studioPage";
import { resolvePage, metadataFor, SitePageBody } from "@/lib/publicSitePage";

export const dynamic = "force-dynamic";

// THE ROOT OF WHICHEVER DOMAIN WAS ASKED FOR.
//
//   stevenjamesconsulting.com/   SJC's home page          (unchanged)
//   stevenjamesdesigns.com/      the web studio's sales page
//   bellasgrooming.com/          that customer's own home page
//
// Anything unrecognised — a preview URL, localhost, a made-up Host header — resolves to SJC, so a
// new domain can only ever add behaviour and never take the selling site away. See lib/host.ts.

export async function generateMetadata() {
  const h = await resolveHost();

  if (h.kind === "studio") {
    return pageMetadata("websites", {
      path: "/",
      title: "A real website for your business — live in three days",
      description:
        "Built and live in three days. Your work, your reviews, your phone number — and a contact form that reaches you the second someone fills it out. You never touch any of it.",
      ogTitle: "A real website for your business — live in three days",
      ogDescription:
        "Your work, your reviews, your phone number — and a contact form that reaches you the second someone fills it out. You never touch any of it.",
    });
  }

  if (h.kind === "client") {
    const r = await resolvePage(h.site.id, "home", true);
    return r ? metadataFor(r, "/", publicUrlFor(h.site)) : {};
  }

  // Title / preview text / preview image are edited at /edit/home with no block selected — the
  // Page Settings panel. Nothing is passed here, so a blank panel keeps the site-wide defaults.
  return pageMetadata("home", { path: "/" });
}

export default async function Home() {
  const h = await resolveHost();

  if (h.kind === "studio") return <StudioBody />;

  if (h.kind === "client") {
    // A customer's site is served at the root of their own domain — no /<site> prefix, because
    // from here on it is simply their website. homeFallback: whatever their FIRST page is called.
    const r = await resolvePage(h.site.id, "home", true);
    if (!r) notFound();
    return <SitePageBody data={r.data} siteId={r.site.id} page={r.slug} />;
  }

  // SJC's home renders through the builder exactly like every other page: the published snapshot
  // if one exists, otherwise the committed seed. Edit at /edit/home and hit Publish.
  const puck = await readPuckPublished("home");
  const data = puck || seedFor("home", "Home");
  return (
    <>
      <Nav />
      <main>
        <Render config={config} data={data} />
      </main>
      <Footer />
    </>
  );
}
