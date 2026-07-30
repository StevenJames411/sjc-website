// Generic cloud-storage adapter for any website content key on the shared Upstash
// drawer. Same shape the cockpit uses (createKvStore). A null client (KV not
// provisioned) degrades gracefully: read() -> null, write() -> false. Never crashes
// a page — the public site always falls back to its committed default copy.

type KvClient = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

export function createKvStore(client: KvClient | null, key: string) {
  return {
    configured: Boolean(client),
    async read<T = unknown>(): Promise<T | null> {
      if (!client) return null;
      try {
        const v = await client.get(key);
        return (v ?? null) as T | null;
      } catch {
        return null; // an unreachable store must never crash the view
      }
    },
    async write(state: unknown): Promise<boolean> {
      return (await this.writeResult(state)).ok;
    },

    /**
     * Same write, but it tells you WHY it failed (2026-07-30).
     *
     * The bare boolean above threw away the one piece of information that mattered. The write
     * guard in pgClient refuses saves that look like data loss and throws a GuardRefusal
     * carrying the reason — "top-level keys disappeared: zones", "content shrank 6 -> 2" — and
     * this catch block swallowed it. Upstream, the editor then reported "saved" anyway, so a
     * refused save was indistinguishable from a successful one. Steven hit save repeatedly and
     * watched nothing change, with no error anywhere.
     *
     * write() keeps the boolean shape for existing callers; anything that shows a human a save
     * indicator should use this and surface `reason`.
     */
    async writeResult(state: unknown): Promise<{ ok: boolean; reason?: string }> {
      if (!client) return { ok: false, reason: "no storage client configured" };
      try {
        await client.set(key, state);
        return { ok: true };
      } catch (e) {
        const reason = e instanceof Error ? e.message : String(e);
        console.error(`[kvStateStore] write to '${key}' failed: ${reason}`);
        return { ok: false, reason };
      }
    },
  };
}
