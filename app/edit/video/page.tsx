// Video views — how many times the welcome video was loaded, played and watched. Static segment
// under /edit (like /edit/links); middleware already makes it owner-only.
import { navLabel } from "@/lib/editNav";
import VideoViews from "@/components/edit/VideoViews";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: await navLabel("video") };
}

export default async function VideoPage() {
  return <VideoViews title={await navLabel("video")} />;
}
