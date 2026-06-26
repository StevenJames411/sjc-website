import { notFound } from "next/navigation";
import PuckEditor from "@/components/puck/PuckEditor";
import { findPage } from "@/lib/puckPages";

// The unified builder route: /edit/<page>. Gated by middleware (owner-only). Server validates
// the slug against the page registry, then hands off to the client editor.
export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const entry = findPage(page);
  if (!entry) notFound();
  return <PuckEditor page={entry.slug} title={entry.title} />;
}
