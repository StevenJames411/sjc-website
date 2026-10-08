// Put the podcast's audio files and its square cover where the show's feed (app/podcast.xml) points.
//   node scripts/blob-put-podcast.mjs <folder holding the .mp3 files and cover-3000.jpg>
// The audio is the sound track of the videos already on the Podcast page (blob podcast/<guest>.mp4), made with
//   ffmpeg -i <guest>.mp4 -vn -ac 1 -ar 44100 -b:a 64k <guest>.mp3
// Spotify and Apple read audio from a feed; the video version of the same show goes to YouTube.
import { put } from "@vercel/blob";
import { readFileSync, readdirSync } from "node:fs";
const HOME = process.env.HOME;
const token = readFileSync(HOME + "/SJC/AI-Employee-Dashboard/projects/sjc-website/.env.local", "utf8")
  .split("\n").find(l => l.startsWith("BLOB_READ_WRITE_TOKEN="))?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
const dir = process.argv[2].replace(/\/$/, "") + "/";
for (const f of readdirSync(dir).filter(f => f.endsWith(".mp3") || f === "cover-3000.jpg")) {
  const { url } = await put(`podcast/${f.endsWith(".mp3") ? "audio/" + f : "attention-to-dollars-podcast-cover-3000.jpg"}`, readFileSync(dir + f), {
    access: "public", token, addRandomSuffix: false, allowOverwrite: true, contentType: f.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg",
  });
  console.log(url);
}
