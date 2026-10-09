// Put the two finished e-book files where the buyer's download page can reach them.
//   node scripts/blob-put-book.mjs        (re-run after every rebuild; the address does not change)
// The folder name is long and random on purpose: the page is noindex and the address is only shown after payment.
import { put } from "@vercel/blob";
import { readFileSync } from "node:fs";
const HOME = process.env.HOME;
const token = readFileSync(HOME + "/SJC/AI-Employee-Dashboard/projects/sjc-website/.env.local", "utf8")
  .split("\n").find(l => l.startsWith("BLOB_READ_WRITE_TOKEN="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
const SRC = HOME + "/SJC-Active-Work/ebooks/coaches-social-map/output/";
const FOLDER = "sites/sjc-website/book/vault-2921e475e79657ae46332ea6c14fc917e0e6d4d9"; // the locked folder: its address never reaches a browser (see app/api/book-checkout)
for (const [file, name] of [["Apple-ATD.epub", "Attention-To-Dollars-Apple-Books.epub"], ["Kindle-ATD.epub", "Attention-To-Dollars-Kindle.epub"]]) {
  const { url } = await put(`${FOLDER}/${name}`, readFileSync(SRC + file), {
    access: "public", token, addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/epub+zip", cacheControlMaxAge: 300,
  });
  console.log(url);
}
