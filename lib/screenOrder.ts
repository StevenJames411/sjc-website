// THE ORDER HE PUT A STUDIO SCREEN'S SECTIONS IN (Steven, 2026-10-04): "I'm able to move sections up and down.
// Our Design Studio should be the same way... We build the same thing for me and everybody else."
// One small store for ANY studio screen, per website: which order its sections sit in, and which sections
// have no divider line above them. Same rule as lib/boardOrder.ts: a stored order wins completely, and a
// section it has never seen (a new heading) is appended at the end, never hidden.
import { getClient } from "./store";

export type ScreenOrder = { order: string[]; noLine: string[] };
const key = (siteId: string, screen: string) => `${siteId}-screen-order-${screen}`;
const clean = (v: unknown) => (Array.isArray(v) ? v.filter((k): k is string => typeof k === "string" && k.length > 0).slice(0, 200) : []);

export async function readScreenOrder(siteId: string, screen: string): Promise<ScreenOrder> {
  try {
    const kv = getClient();
    const raw = kv ? await kv.get(key(siteId, screen)) : null;
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return { order: clean(p?.order), noLine: clean(p?.noLine) };
  } catch {
    return { order: [], noLine: [] }; // an unreadable order must never take the screen down
  }
}

export async function writeScreenOrder(siteId: string, screen: string, v: ScreenOrder): Promise<boolean> {
  const kv = getClient();
  if (!kv) return false;
  await kv.set(key(siteId, screen), JSON.stringify({ order: clean(v.order), noLine: clean(v.noLine), updatedAt: new Date().toISOString() }));
  return true;
}
