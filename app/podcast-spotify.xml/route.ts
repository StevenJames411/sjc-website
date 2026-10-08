// One of the podcast feed's three addresses (see lib/podcastFeed.ts for why there are three).
import { podcastFeed } from "@/lib/podcastFeed";

export const dynamic = "force-static";
export const revalidate = 3600;

export const GET = () => podcastFeed("spotify");
