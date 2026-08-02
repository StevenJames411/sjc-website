// Every owner-only page hangs off this. The shell decides what gets chrome and what renders bare
// (the page builder and a customer's invoice print view) — see components/edit/EditShell.tsx.
//
// ⚠️ This wraps EVERYTHING under /edit, including routes added later. That is the point: a new
// section can no longer be built and then linked from nowhere, which is how /edit/brand and
// /edit/import ended up reachable only by typing the URL.
//
// The menu is read here, on the server, so the rail arrives with Steven's own names already on it
// — no flash of the code defaults before a fetch lands.
import "./edit-shell.css";
import EditShell from "@/components/edit/EditShell";
import { readNav } from "@/lib/editNav";

export const dynamic = "force-dynamic";

export default async function EditLayout({ children }: { children: React.ReactNode }) {
  return <EditShell nav={await readNav()}>{children}</EditShell>;
}
