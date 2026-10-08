// Put the three study guide PDFs (Phone, Tablet, Laptop) beside the book files the buyer's download page hands out.
//   node scripts/blob-put-study-guide.mjs     (re-run after every rebuild; the addresses do not change)
// Built in ~/SJC/CEO/build-checklist/study-guide (build_study_guide.py, then make_tappable.py).
import { put } from "@vercel/blob";
import { readFileSync } from "node:fs";
const HOME = process.env.HOME;
const token = readFileSync(HOME + "/SJC/AI-Employee-Dashboard/projects/sjc-website/.env.local", "utf8")
  .split("\n").find(l => l.startsWith("BLOB_READ_WRITE_TOKEN="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
const SRC = HOME + "/SJC/CEO/build-checklist/study-guide/drafts-2026-10-08/three-sizes/";
const FOLDER = "sites/sjc-website/book/atd-f87d15eee4a6"; // same folder as the third edition of the book
for (const size of ["Phone", "Tablet", "Laptop"]) {
  const { url } = await put(`${FOLDER}/Attention-To-Dollars-Study-Guide-${size}.pdf`, readFileSync(`${SRC}Study Guide - ${size}.pdf`), {
    access: "public", token, addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/pdf", cacheControlMaxAge: 300,
  });
  console.log(url);
}
