// The dial board — one prospect at a time, off a Google Sheet, dialled through his own iPhone.
//
// A static segment under /edit, so it wins precedence over app/edit/[site] the same way
// /edit/forms and /edit/invoices do. "dial" is in RESERVED_SITE_IDS for that reason — without it a
// website with that id would be created happily and then be permanently unopenable.
//
// Owner-only for free: middleware.ts protects everything under /edit/. The API it talks to is NOT
// free — /api/dial had to be added to the gated list by hand.
//
// The heading and the browser tab both read the name Steven gave this screen in the rail.
import { readLists } from "@/lib/dial";
import { sheetsConfigured } from "@/lib/sheets";
import { navLabel } from "@/lib/editNav";
import DialBoard from "@/components/edit/DialBoard";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("dial") };
}

export default async function DialPage() {
  const [lists, title] = await Promise.all([readLists(), navLabel("dial")]);
  // ⚠️ The prospects are NOT fetched here. The board loads them client-side per list, because a
  // call sheet is read live on every switch and a server render would cache a snapshot of a list
  // he is actively writing to. See the note at the top of lib/dial.ts.
  return <DialBoard lists={lists} title={title} configured={sheetsConfigured()} />;
}
