// ONE CLIENT, ONE WEBSITE — their details and their enquiries.
//
// Everything on this page is one of the two things a contractor actually wants from a website he
// pays somebody else to run: is my information right, and who called. Anything else that could be
// here — publishing, domains, the page builder, where leads are delivered — is deliberately absent.
// It is not hidden for safety; it is absent because he is paying precisely so those are not his
// problem.
import { notFound } from "next/navigation";
import { assertSiteAccess } from "@/lib/siteAccess";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { siteKeys } from "@/lib/siteKeys";
import ClientSite from "@/components/account/ClientSite";

export const dynamic = "force-dynamic";

type StoredLead = { submittedAt?: string; at?: string; answers?: { label?: string; value?: string }[] };

export default async function ClientSitePage({ params }: { params: Promise<{ site: string }> }) {
  const { site: siteId } = await params;

  // The same check every API route uses. A site that is not theirs 404s here exactly as it does
  // there — one answer to "may you touch this", not one per surface.
  const access = await assertSiteAccess(siteId);
  if (!access.ok) notFound();
  const site = access.site;

  const raw =
    (await createKvStore(getClient(), siteKeys(site.id).leads).read<{ leads?: StoredLead[] }>()) || {};
  const leads = (raw.leads || [])
    .map((l) => ({
      at: l.submittedAt || l.at || "",
      answers: (l.answers || [])
        .filter((a) => (a?.value || "").trim())
        .map((a) => ({ label: a.label || "", value: a.value || "" })),
    }))
    .sort((a, b) => (b.at || "").localeCompare(a.at || ""));

  return (
    <ClientSite
      siteId={site.id}
      name={site.business?.name || site.name}
      domain={site.domain || ""}
      business={{
        name: site.business?.name || "",
        phone: site.business?.phone || "",
        phoneDisplay: site.business?.phoneDisplay || "",
        email: site.business?.email || "",
        address: site.business?.address || "",
        hours: site.business?.hours || "",
        reviewUrl: site.business?.reviewUrl || "",
      }}
      leads={leads}
    />
  );
}
