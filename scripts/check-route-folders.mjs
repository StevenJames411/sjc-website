// Fail the build if a hand-written page can steal its name from every site on the platform.
//
// ── WHY THIS IS A BUILD CHECK AND NOT A NOTE ──────────────────────────────────────────────────
// This deployment serves every site. Next.js picks a static route folder over the dynamic
// app/[slug] BEFORE any host logic runs, so app/<name>/page.tsx answers for /<name> on EVERY
// hostname — SJC's, the studio's, every demo, every customer domain.
//
// Measured on 2026-08-11: every client demo served SJC's own About page at its own /about. Nothing
// errored. The page worked perfectly, for the wrong people, on somebody else's domain.
//
// The guard that was supposed to prevent this (ROUTE_FOLDERS in lib/pageRegistry.ts) is a
// hand-maintained LIST OF WORDS, and it had already failed once: `careers` was missing from it, so
// that page got created and then could never be reached. A list someone has to remember to update
// is not a guard. This is:
//
//   every folder under app/ is either
//     (a) control plane — /api, /edit — never content, or
//     (b) wired to lib/sjcRoute so it answers for SJC's host only, or
//     (c) a build failure.
//
// Adding a page is still one file. Adding a page that quietly takes a name away from every
// customer is now impossible.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";

const APP = path.join(process.cwd(), "app");

// The control plane. Not content, never resolved per-tenant, and safe to own globally.
// `[slug]` IS the dynamic route itself.
const CONTROL_PLANE = new Set(["api", "edit", "[slug]", "i", "share"]);

const problems = [];

for (const entry of readdirSync(APP, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const name = entry.name;
  if (CONTROL_PLANE.has(name)) continue;
  // Route groups `(x)` and private folders `_x` are not URL segments.
  if (name.startsWith("(") || name.startsWith("_")) continue;

  const page = ["page.tsx", "page.ts", "page.jsx", "page.js"]
    .map((f) => path.join(APP, name, f))
    .find((f) => existsSync(f));
  if (!page) continue;

  const src = readFileSync(page, "utf8");
  if (!src.includes("@/lib/sjcRoute")) {
    problems.push(name);
  }
}

if (problems.length) {
  console.error(
    "\n✖ ROUTE FOLDER CHECK FAILED\n\n" +
      problems.map((n) => `  app/${n}/  takes "/${n}" from EVERY site`).join("\n") +
      "\n\n  This deployment serves every customer's site. A static route folder beats the\n" +
      "  dynamic app/[slug] on every hostname, so this page would answer at /" +
      problems[0] +
      " on a\n  customer's own domain — showing them SJC's page instead of theirs.\n\n" +
      "  Fix it one of these ways:\n" +
      "    1. DELETE it if app/[slug] already serves the same thing (about, faqs and podcast\n" +
      "       were all pure duplicates and were deleted on 2026-08-11).\n" +
      "    2. WIRE IT to lib/sjcRoute so it answers for SJC's host only:\n\n" +
      "         import { tenantPage, tenantPageMetadata } from \"@/lib/sjcRoute\";\n" +
      "         export const dynamic = \"force-dynamic\";   // it must look at the host\n" +
      "         const tenant = await tenantPage(\"<name>\");\n" +
      "         if (tenant) return tenant;\n\n" +
      "    3. If it is genuinely control plane (never content), add it to CONTROL_PLANE in\n" +
      "       scripts/check-route-folders.mjs — and be sure, because that name is then gone\n" +
      "       for every site forever.\n"
  );
  process.exit(1);
}

console.log(`✓ route folders: ${problems.length === 0 ? "all wired or control plane" : ""}`);
