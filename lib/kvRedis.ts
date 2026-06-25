// One Redis client for ALL website content state (page text overrides + section order).
// Talks to the SAME Upstash drawer the cockpit uses, over the TCP URL the Vercel
// integration injected — KV_REDIS_URL (rediss://…). One module-level connection,
// reused across warm serverless invocations so we don't open a socket per request.
// Returns the same { get, set } shape the store expects (JSON in/out). Null when
// unprovisioned => pages fall back to their committed default copy, never crash.
import Redis from "ioredis";

type KvClient = {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
};

let _redis: Redis | null = null;
let _client: KvClient | null = null;

export function getClient(): KvClient | null {
  // Accept whatever the Upstash/Vercel integration injects as the rediss:// TCP URL —
  // KV_REDIS_URL (cockpit's name) or the integration defaults (KV_URL / REDIS_URL) — so
  // connecting the store to this project "just works" without renaming a variable.
  const url =
    process.env.KV_REDIS_URL ||
    process.env.KV_URL ||
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL;
  if (!url) return null;
  if (!_client) {
    _redis = new Redis(url, { maxRetriesPerRequest: 3, enableReadyCheck: false });
    _client = {
      async get(key: string) {
        const v = await _redis!.get(key);
        return v ? JSON.parse(v) : null;
      },
      async set(key: string, value: unknown) {
        await _redis!.set(key, JSON.stringify(value));
      },
    };
  }
  return _client;
}
