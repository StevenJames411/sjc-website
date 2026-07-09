import { notFound } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { readPages, findPageMeta } from "@/lib/pageRegistry";

// The unified builder route: /edit/<page>. Gated by middleware (owner-only). The server loads
// the DYNAMIC page registry (Redis-backed), validates the slug against it, and hands the full
// page list to the client editor so its switcher + create/delete controls stay in sync.
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const entry = await findPageMeta(page);
  if (!entry) notFound();
  const pages = await readPages();
  return <PuckEditor page={entry.slug} title={entry.title} pages={pages} />;
}
