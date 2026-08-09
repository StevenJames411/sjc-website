// Every word on the page, as data.
//
// ⛔ NOTHING EDITABLE LIVES IN THE JSX. When this page is imported into the design studio,
// each of these becomes a field a client (or Steven) edits without touching code. Copy written
// inline in a component has to be rewritten to be ported; copy written here is just mapped.
//
// The demo kit already worked this way (config.json per vertical). This brings the SJC site
// in line with it, which is what makes the import mechanical rather than a second build.

// ⛔ THE NAV IS THE PROOF OF THE UMBRELLA. Five service words read as a freelancer with a
// price list. Three named divisions with a one-line job each read as a company with depth —
// which is the only thing the parent brand has to communicate. This is also where the
// "Steven James Designs" name survives: as a DIVISION, not a domain.
//
// ⚠️ NAMES ARE PLACEHOLDERS. "Five Star" is a stand-in — Review Harvest already owns the
// obvious one. "Chloe" is real and worth keeping; an AI employee with a name is memorable in
// a way that "AI Implementation" never will be.
export const DIVISIONS = [
  { n: "1", short: "Websites", name: "Steven James Designs", line: "Everything else points at it, so it goes first", href: "/designs" },
  { n: "2", short: "Reviews",  name: "Five Star",            line: "The entry fee — placeholder name",           href: "/reviews" },
  { n: "3", short: "Chloe",    name: "Chloe",                line: "The AI employee that answers at 6pm",        href: "/ai-implementation" },
  { n: "4", short: "Ads",      name: "Paid Ads",             line: "Only once the first three hold",             href: "/ads" },
];

export const NAV_EXTRA = [
  { short: "Podcast", name: "The Podcast", line: "Conversations with owners who build things — placeholder copy", href: "/podcast" },
  { short: "Careers", name: "Careers", line: "Setters and web builders — remote, paid on what you produce", href: "/careers" },
];

// kept so anything still importing NAV keeps working
export const NAV = [
  ...DIVISIONS.map((d) => ({ label: d.short, href: d.href })),
  ...NAV_EXTRA.map((n) => ({ label: n.short, href: n.href })),
];

export const BRAND = {
  nameTop: "Steven James",
  nameSub: "Consulting",
  href: "/",
};

export const HERO = {
  badge: "Forty years · Five businesses · One standard",
  h1: ["We run the digital side", "of your business."],
  body: [
    "Website, reputation, follow-up, advertising — built as one system instead of four purchases that don’t know about each other.",
    "Forty years of running real businesses went into this team and the way it works. You are not hiring a freelancer with a waiting list.",
  ],
  cta: { label: "Start with a walkthrough", href: "#diagnosis" },

  // ⛔ THE VISUAL IS THE CHAIN, NOT A SCREENSHOT. A single browser frame says "one product",
  // which is `/designs`' job. The parent brand's one job is to establish who he is and how far
  // the work reaches — so the hero shows the whole sequence, with the four links he builds lit
  // and the two he doesn't dimmed. Nobody else shows this; it's the intellectual property.
  chain: [
    { k: "Maps",      note: "where they start",  mine: false },
    { k: "Reviews",   note: "the entry fee",     mine: true },
    { k: "Website",   note: "it confirms",       mine: true },
    { k: "Social",    note: "rented ground",     mine: false },
    { k: "Follow-up", note: "where it leaks",    mine: true },
    { k: "Ads",       note: "only amplify",      mine: true },
  ],
  chainLabel: "How a customer actually moves",
  chainNote: "The lit ones are what we build. The other two are yours — we just make sure they point somewhere worth arriving at.",

  // kept for /designs, where showing the work IS the one job
  work: [
    { img: "/work/landscape.jpg", label: "Landscape Architecture", domain: "mwsla.com", note: "Sixteen years of awards, invisible to search" },
    { img: "/work/detail.jpg", label: "Ceramic Coating", domain: "meridiandetail.com", note: "A $1,500 service that looked like a $150 one" },
    { img: "/work/offgrid.jpg", label: "Off-Grid Architecture", domain: "haldenroe.com", note: "Four houses a year, chosen carefully" },
    { img: "/work/customcar.jpg", label: "Restoration & Restomod", domain: "ardsleycoachworks.com", note: "Nine builds a year, eighteen months each" },
  ],
};

export const STORY = {
  eyebrow: "How It Usually Goes",
  h2: "You didn’t plan any of this. It just accumulated.",
  paragraphs: [
    "You built the business on word of mouth, and it worked. For years it was the only thing that worked.",
    "Then it got quieter. So you had a website made — by a cousin, an agency, a guy off Facebook. It was fine.",
    "Then somebody sold you ads. Then somebody called about SEO. Then you set up the Google listing yourself one evening, and a review or two showed up on their own.",
    "Every one of those was a separate purchase from a separate vendor. Not one of them asked what the others were doing.",
  ],
  closer: "That is not a marketing problem. That is four things in a row that don’t know the others exist.",
};

export const DIAGNOSIS = {
  eyebrow: "The Diagnosis",
  h2: "Your marketing doesn’t talk to itself.",
  lede: "There is an order to this, and almost nobody gets sold it. A customer moves through your business in a sequence, and every piece hands off to the next one. Break a link and everything downstream of it is paid for and wasted.",
  chain: [
    { k: "Maps", d: "is the storefront. It is where a homeowner actually starts, and it is the one you did not build." },
    { k: "Reviews", d: "are the entry fee. Below a certain count you are not compared, you are skipped." },
    { k: "The site", d: "confirms. Nobody is sold by it — but plenty are lost by it." },
    { k: "Social", d: "is rented ground. It builds an audience you do not own on land you cannot keep." },
    { k: "Referrals", d: "are feast or famine. Wonderful, and impossible to schedule around." },
    { k: "Ads", d: "only amplify. They do not fix any of the above. They send more people to see it." },
  ],
  closer: "Ads don’t fix any of this. They just send more people to see it.",
};

export const BUCKETS = {
  eyebrow: "Four Questions",
  h2: "Answer these honestly. Nobody sees it but you.",
  lede: "No email, no form. This is the same walkthrough we would do with you on a call.",
  questions: [
    {
      id: "site",
      q: "How old is your website?",
      options: [
        { label: "Under 2 years", bad: false },
        { label: "3–5 years", bad: true },
        { label: "Longer than that", bad: true },
        { label: "I'd have to look", bad: true },   // the prospect's voice — stays first person
      ],
      verdict: "A site more than three years old was built before most of your customers started searching on a phone. It is not that it looks dated — it is that it was designed for a different device.",
    },
    {
      id: "reviews",
      q: "How many Google reviews do you have?",
      options: [
        { label: "50 or more", bad: false },
        { label: "10–50", bad: true },
        { label: "Under 10", bad: true },
        { label: "No idea", bad: true },
      ],
      verdict: "Under about fifty, you are not being compared to your competitors — you are being skipped before the comparison starts. It is rarely a quality problem. It is that nobody ever asks.",
    },
    {
      id: "afterhours",
      q: "What happens to a call at six o'clock on a Friday?",
      options: [
        { label: "Answered or returned same day", bad: false },
        { label: "Voicemail, called back Monday", bad: true },
        { label: "Honestly, it depends", bad: true },
        { label: "It's missed", bad: true },
      ],
      verdict: "Most enquiries arrive outside the hours you work. The homeowner who called at six called two other people at six as well, and one of them answered.",
    },
    {
      id: "scale",
      q: "What breaks if you double your leads tomorrow?",
      options: [
        { label: "Nothing — we'd handle it", bad: false },
        { label: "The follow-up", bad: true },
        { label: "The scheduling", bad: true },
        { label: "Me", bad: true },
      ],
      verdict: "This is the one that decides whether advertising is worth doing at all. Paid traffic poured into a business that cannot absorb it just makes the leak bigger and more expensive.",
    },
  ],
  results: {
    none: "Then you are in better shape than most — and you probably don't need us yet.",
    one: "One weak link. That is the cheapest possible place to be, and the fastest to fix.",
    all: "All four. That is normal, and it is why advertising has never worked the way you were told it would.",
    some: (n: number) => `${n} of the four. That is normal, and it is why advertising has not worked the way you were told it would.`,
    followUp: "They get fixed in order, not all at once. Keep scrolling.",
  },
};

export const SOLUTION = {
  eyebrow: "The Order It Gets Built In",
  h2: "Four divisions, in sequence.",
  lede: "A customer moves through your business in one order; it gets built in another. The website comes first because everything else points at it, and the ads come last because they only amplify whatever is already there. That sequence is the part nobody else sold you.",
  cards: [
    { n: "01", t: "The website", href: "/designs", p: "Everything else points at it, so it goes first. Built to look like the work you actually do — not a template with your logo dropped in the corner." },
    { n: "02", t: "The reviews", href: "/reviews", p: "A system that asks every customer at the right moment, instead of you remembering to. Three reviews after ten years is not a reputation problem, it is a process problem." },
    { n: "03", t: "The back end", href: "/ai-implementation", p: "What happens to the call at 6pm, the form at midnight, the lead you meant to ring back on Thursday. This is where the money already in your pipeline leaks out." },
    { n: "04", t: "Then the ads", href: "/ads", p: "Only once the first three hold. Paid traffic is the fastest way to find out what is broken — and the most expensive." },
  ],
};

export const PROOF = {
  eyebrow: "The Work",
  h2: "Built, not mocked up.",
  lede: "Every site below is a real build. The photography is placeholder on the demonstration builds and the businesses are invented — the design, the motion and the engineering are not.",
  items: [
    { img: "/work/landscape.jpg", t: "Landscape Architecture", s: "Sixteen years of awards, invisible to search" },
    { img: "/work/detail.jpg", t: "Ceramic Coating", s: "A $1,500 service that looked like a $150 one" },
    { img: "/work/offgrid.jpg", t: "Off-Grid Architecture", s: "Four houses a year, chosen carefully" },
    { img: "/work/customcar.jpg", t: "Restoration & Restomod", s: "Nine builds a year, eighteen months each" },
  ],
  caseStudy: {
    eyebrow: "Case Study · Live Client",
    h3: "A clinic that was losing every call after five o’clock.",
    stats: [
      { n: "28", l: "appointments booked in month one" },
      { n: "$9.69", l: "cost per lead" },
      { n: "Week 5", l: "and still converting" },
    ],
    link: { label: "How it was built →", href: "/ai-implementation" },
  },
};

export const WHO = {
  eyebrow: "Where This Came From",
  h2: "Forty years of running businesses, built into a team.",
  paragraphs: [
    "A restaurant in 1986. Then mortgage. Then roofing. Then trucking. Then this. Steven ran all five and built the systems inside every one of them.",
    "So when we tell you the pieces don't talk to each other, it isn't a theory out of a book. It is the specific problem he spent four decades solving inside his own businesses, with his own money, while the phone was ringing.",
    "That experience is what the team is built on and trained to. You are not buying one person's attention — you are buying a way of working that does not depend on any one person being available.",
  ],
  signature: { name: "Steven Barchetti", role: "Founder · Steven James Consulting" },
};

export const ASK = {
  eyebrow: "One Conversation",
  h2: "We’ll show you your own business first.",
  lede: "Before you decide anything, we will walk you through what a customer sees when they look you up — your listing, your reviews, your site, on the phone they are actually holding. That part costs nothing and it is useful whether you hire us or not.",
  cta: { label: "Book the walkthrough", href: "/apply" },
};

export const FOOTER = {
  columns: [
    // ⛔ THREE DIVISIONS, AND THE FOOTER MUST AGREE WITH THE HEADER. Paid ads was listed here
    // as a fourth and it is not one: no brand of its own, and it is only sold once the other
    // three are in place. It is the last link in the chain, reachable from the solution card.
    // The divisions carry their descriptor here too — a footer has the room a nav bar doesn't.
    // ⛔ THE FOOTER MUST AGREE WITH THE HEADER — same four divisions, same order, same words.
    // The order IS the argument, so it cannot differ between two places on one page.
    { title: "The Divisions", links: [
      { label: "1 · Steven James Designs", href: "/designs", line: "Everything else points at it, so it goes first" },
      { label: "2 · Five Star", href: "/reviews", line: "The entry fee" },
      { label: "3 · Chloe", href: "/ai-implementation", line: "The AI employee that answers at 6pm" },
      { label: "4 · Paid Ads", href: "/ads", line: "Only once the first three hold" },
    ]},
    { title: "The Company", links: [
      { label: "The Work", href: "#work" },
      { label: "Podcast", href: "/podcast" },
      { label: "Careers", href: "/careers" },
      { label: "Book a Walkthrough", href: "/apply" },
    ]},
  ],
  closing: "Websites, reviews and follow-up for high-end trades. Built as one system, by one team.",
  legalLeft: "Steven James Consulting",
  legalRight: "San Antonio, Texas · Working nationwide",
};
