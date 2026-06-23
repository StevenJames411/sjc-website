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
      if (!client) return false;
      try {
        await client.set(key, state);
        return true;
      } catch {
        return false;
      }
    },
  };
}
