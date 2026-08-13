// THE CLIENT'S FRONT DOOR — /account. Where a magic link lands them.
//
// ── WHY THIS IS SEPARATE FROM /edit ───────────────────────────────────────────────────────────
// Steven, on what a client should be able to do: *"if they want to log into their website and
// update simple shit like that, I want them to be able to."* And on what they buy: relief — a
// craftsman who is buried in the work and never touches the machine.
//
// Both of those are true at once, and the second one is what shapes this page. The studio at /edit
// is a workbench: a page builder, a section library, imports, sweeps, a heartbeat board. A
// contractor does not want a workbench. He wants his phone number to be right and to see who
// called. So this is not a cut-down /edit — it is a different thing with three items on it.
import { redirect } from "next/navigation";
import { readSites } from "@/lib/sites";
import { currentIdentity } from "@/lib/siteAccess";

export const dynamic = "force-dynamic";

export default async function ClientHome() {
  const me = await currentIdentity();

  // The owner has a better door. Middleware sends clients here from /edit; this sends Steven back,
  // so neither of them ends up on a page built for the other.
  if (me?.sites === "*") redirect("/edit");
  if (!me?.email) redirect("/edit"); // no session -> middleware's login page

  const mine = (await readSites()).filter((s) =>
    (s.ownerEmails || []).some((o) => (o || "").trim().toLowerCase() === me.email)
  );

  // ⛔ ONE WEBSITE IS THE NORMAL CASE, so do not make him choose from a list of one. A picker with
  // a single option is a screen that exists only to be clicked through.
  if (mine.length === 1) redirect(`/account/${mine[0].id}`);

  return (
    <main
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111827",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your websites</h1>
      <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 28 }}>Signed in as {me.email}</p>

      {mine.length === 0 ? (
        // Not an error page. An address can be on file before a site is handed over, and "nothing
        // here" with no explanation reads as something broken.
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "20px 22px",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          <strong>Nothing here yet.</strong>
          <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
            Your website isn&apos;t connected to this email address yet. If you were expecting to
            see it, reply to any email from us and we&apos;ll sort it out.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {mine.map((s) => (
            <a
              key={s.id}
              href={`/account/${s.id}`}
              style={{
                display: "block",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "18px 20px",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 17 }}>{s.business?.name || s.name}</div>
              {s.domain ? (
                <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>{s.domain}</div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
