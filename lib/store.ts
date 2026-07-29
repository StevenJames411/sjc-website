// THE storage seam for the website. Everything above this line is unchanged; this decides
// where the bytes actually live.
//
// Postgres when DATABASE_URL is present (durable, append-only history, write guard),
// otherwise the old Upstash cache so the site never goes dark if the database is unreachable.
// Same { get, set } contract either way — createKvStore() and every route above it are
// untouched by the swap.
import { getClient as getPg } from "./pgClient";
import { getClient as getRedis } from "./kvRedis";

export function getClient() {
  return getPg() || getRedis();
}

// Which engine actually answered — so a page or a check can SAY it's on the fallback rather
// than quietly pretending everything is fine.
export function backend(): "postgres" | "redis-cache" | "none" {
  if (getPg()) return "postgres";
  if (getRedis()) return "redis-cache";
  return "none";
}
