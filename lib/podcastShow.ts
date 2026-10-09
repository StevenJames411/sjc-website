// THE PODCAST'S OWN FEED (Steven, 2026-10-07: "Okay, we're gonna own it"). The show lives on this website; Spotify
// and Apple Podcasts read this one list and show it inside their apps. Add an episode HERE and it appears in both.
// The feed itself is app/podcast.xml. Audio files and the cover are uploaded with scripts/blob-put-podcast.mjs.
const AUDIO = "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/podcast/audio/";

export const SHOW = {
  // His name for the show (2026-10-08): the business name, so any subject fits under one umbrella. Not the
  // book's title: "the Attention To Dollars book is just one of the things that I'm known for." The name is also
  // drawn on the cover picture, with the SJC emblem.
  title: "Steven James Consulting Podcast",
  author: "Steven Barchetti",
  // Spotify and Apple send their "is this your show" email to this address.
  email: "support@stevenjamesconsulting.com",
  site: "https://stevenjamesconsulting.com/podcast",
  feed: "https://stevenjamesconsulting.com/podcast.xml",
  cover: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/podcast/steven-james-consulting-podcast-cover-3000.jpg",
  description:
    "Conversations with coaches, authors and influencers about turning what they know into a product and their attention into dollars. Long conversations with people who build things, hosted by Steven Barchetti of Steven James Consulting, a modern day talent agency. Attention + Your Product = Dollars.",
};

export type Episode = { slug: string; title: string; date: string; seconds: number; bytes: number; description: string };

// Newest first. `date` is when the episode came out. ⚠️ The five archive episodes were recorded in 2008; their
// exact days are not in the record, so they carry the first of the month, in the order the Podcast page lists them.
export const EPISODES: Episode[] = [
  {
    slug: "paul-damazo", title: "Paul Damazo, author of 80 Proven Ways to Become a Millionaire", date: "2008-05-01", seconds: 3824, bytes: 30589951,
    description: "Paul put what he knows about money into one book. He writes for newlyweds, for people who are starting late, and for people already retired who still want more than one stream of income. The thread through all of it is getting your money to work for you instead of you working for your money.",
  },
  {
    slug: "alexis-martin-neely", title: "Alexis Martin Neely, author of Wear Clean Underwear", date: "2008-04-01", seconds: 3022, bytes: 24177203,
    description: "Alexis wrote this one for parents. Most of us plan the birthday parties, the playdates and the schooling, and never plan for the one day we do not want to think about. She took a heavy subject and packaged it so a person wants to pick it up.",
  },
  {
    slug: "blair-williams", title: "Blair Williams, developer of the PrettyLinks WordPress plugin", date: "2008-03-01", seconds: 2081, bytes: 16646415,
    description: "Blair built a tool for a problem every person with a following has. You get one link in your profile, and you have a lot of things you want people to see. He knew a problem well, built the fix, and put it up for sale. A product does not have to be a book.",
  },
  {
    slug: "tamar-weinberg", title: "Tamar Weinberg, author of The New Community Rules", date: "2008-02-01", seconds: 1957, bytes: 15658777,
    description: "Tamar wrote about the social web when a lot of companies still had not worked out what to do with it. All these people are gathered in one place, and it costs nothing to stand in front of them. So how do you reach them the right way?",
  },
  {
    slug: "lewis-howes", title: "Lewis Howes, author of LinkedWorking", date: "2008-01-01", seconds: 825, bytes: 6602020,
    description: "Lewis took one platform, LinkedIn, and one skill, meeting the right people, and wrote the book on it with a co-author. He did not try to cover everything. He picked a narrow subject and owned it.",
  },
];
export const audioUrl = (e: Episode) => `${AUDIO}${e.slug}.mp3`;
