// THE WEBSITE'S HALF OF THE OWNER'S KPI SCREEN (Steven, 2026-10-07). Two of the six numbers in the
// book's Stage 13 live here and nowhere else: names added (every form entry, already written down
// by lib/leadStore before delivery) and clients who bought the book (the order log kept by
// app/api/book-checkout). The dashboard asks for them with the machine token.
//
// ⛔ COUNTS ONLY. No name, email, phone or answer leaves this route; the dashboard needs "how many
// and from which form", and a number cannot leak a person.
// Owner-only: middleware gates every /api route not listed public.
import { readLeads } from "@/lib/leadStore";
import { createKvStore } from "@/lib/kvStateStore";
import { getClient } from "@/lib/store";
import { SJC } from "@/lib/siteKeys";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
type Tally = { d7: number; d30: number; all: number };
const blank = (): Tally => ({ d7: 0, d30: 0, all: 0 });
function add(t: Tally, at: string, now: number) {
  const ms = Date.parse(at);
  t.all += 1;
  if (!Number.isFinite(ms)) return;
  if (now - ms <= 7 * DAY) t.d7 += 1;
  if (now - ms <= 30 * DAY) t.d30 += 1;
}

export async function GET() {
  const now = Date.now();
  try {
    const names = blank();
    const bySource: Record<string, Tally> = {};
    for (const lead of await readLeads(SJC)) {
      add(names, lead.submittedAt, now);
      const source = String(lead.answers.find((a) => a.key === "source")?.value || "website form").slice(0, 60);
      add((bySource[source] ||= blank()), lead.submittedAt, now);
    }

    const log = (await createKvStore(getClient(), "sjc-book-orders").read<{ orders?: { at: string; cents: number }[] }>()) || {};
    const sales = blank();
    const cents = blank();
    for (const o of Array.isArray(log.orders) ? log.orders : []) {
      add(sales, o.at, now);
      const ms = Date.parse(o.at);
      const c = Number(o.cents) || 0;
      cents.all += c;
      if (Number.isFinite(ms) && now - ms <= 7 * DAY) cents.d7 += c;
      if (Number.isFinite(ms) && now - ms <= 30 * DAY) cents.d30 += c;
    }

    return Response.json({
      ok: true,
      names,
      bySource: Object.entries(bySource).map(([source, t]) => ({ source, ...t })).sort((a, b) => b.all - a.all),
      bookSales: sales,
      bookCents: cents,
    });
  } catch {
    return Response.json({ ok: false, error: "Could not read the numbers" }, { status: 500 });
  }
}
