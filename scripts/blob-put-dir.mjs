import { put } from "@vercel/blob";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const DIR = process.argv[2];
const PREFIX = process.argv[3];               // e.g. sites/phenomenon-demo/video
const token = readFileSync(process.env.HOME + "/SJC/AI-Employee-Dashboard/projects/sjc-website/.env.local", "utf8")
  .split("\n").find(l => l.startsWith("BLOB_READ_WRITE_TOKEN="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g,"");
if (!token) { console.error("no BLOB_READ_WRITE_TOKEN"); process.exit(1); }

const files = readdirSync(DIR).filter(f => /\.(mp4|jpg)$/i.test(f)).sort();
const out = {};
for (const f of files) {
  const body = readFileSync(path.join(DIR, f));
  const { url } = await put(`${PREFIX}/${f}`, body, {
    access: "public",
    token,
    addRandomSuffix: false,
    // ⚠️ Re-running on a fixed path is the NORMAL case — a poster gets re-picked, a clip gets
    // re-encoded. Without this the SDK refuses the second run outright instead of replacing.
    allowOverwrite: true,
    contentType: f.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
    cacheControlMaxAge: 31536000,
  });
  out[f] = url;
  console.log(`${f.padEnd(14)} ${(body.length/1048576).toFixed(1).padStart(5)} MB  ${url}`);
}
console.log("\n" + JSON.stringify(out, null, 1));
