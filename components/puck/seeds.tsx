import type { Data } from "@measured/puck";
import { SEED } from "@/components/puck/config";

// What the builder opens to when a page has no saved Puck draft yet. /about ships with its
// full current content (SEED); every other page opens to a simple starter the user can build
// on. Phase B replaces each starter with that page's real converted content.
function starter(slug: string, title: string): Data {
  return {
    root: {},
    content: [
      {
        type: "Section",
        props: {
          id: `${slug}-sec`,
          background: "#ffffff",
          content: [
            { type: "Heading", props: { id: `${slug}-h`, text: title, level: "h1", align: "left" } },
            {
              type: "Text",
              props: {
                id: `${slug}-t`,
                text: "This page isn't on the new builder yet. Drag blocks from the left to build it, then Publish.",
                align: "left",
              },
            },
          ],
        },
      },
    ],
  };
}

// FAQs page expressed as Puck blocks (hero · 5 Q&A · CTA).
const FAQS_SEED: Data = {
  root: {},
  content: [
    {
      type: "Section",
      props: {
        id: "faqs-hero",
        background: "#f3f4f6",
        content: [
          { type: "Text", props: { id: "faqs-eyebrow", text: "FAQS", align: "left" } },
          { type: "Heading", props: { id: "faqs-h1", text: "Questions before you book.", level: "h1", align: "left" } },
          {
            type: "Text",
            props: {
              id: "faqs-lead",
              text: "The short version: you become the AI-first company, the machine does the work, and you keep your hand on every lead and every dollar.",
              align: "left",
            },
          },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "faqs-list",
        background: "#ffffff",
        content: [
          { type: "Heading", props: { id: "faqs-q1", text: "1. Do I keep control of my leads, my data, and my accounts?", level: "h3", align: "left" } },
          { type: "Text", props: { id: "faqs-a1", text: "Yes. You keep the keys to everything. It's your CRM, your calendar, your phone number, your leads, your money. I install the AI employees on top of what you already have and operate the plumbing in the background — the same way you rent your CRM or your email. I'm the infrastructure you rent, not the boss. Your hand stays on every lead and every dollar.", align: "left" } },
          { type: "Heading", props: { id: "faqs-q2", text: "2. How is this different from the chatbot or CRM I already have?", level: "h3", align: "left" } },
          { type: "Text", props: { id: "faqs-a2", text: "What you have now is step one: a script that waits. It fires off a few canned messages and stops. It can't hold a real conversation, answer a real question, or get anyone onto your calendar. What I install is step two: a dynamic AI employee that goes to work. It answers every lead the instant it comes in, follows up, handles objections in your own words, books the appointment, and even reaches back out to your cold leads. One waits. The other works.", align: "left" } },
          { type: "Heading", props: { id: "faqs-q3", text: "3. What are the two things you actually install?", level: "h3", align: "left" } },
          { type: "Text", props: { id: "faqs-a3", text: "First, Speed to Lead — every single lead gets answered the second it comes in, day or night, so nothing slips through the cracks while you sleep. Second, a dynamic AI employee infrastructure that doesn't just sit there: it follows up, it reactivates the leads who went quiet, and it books consults on its own. Both run on top of the business you already have.", align: "left" } },
          { type: "Heading", props: { id: "faqs-q4", text: "4. What does it cost — a build fee or a monthly?", level: "h3", align: "left" } },
          { type: "Text", props: { id: "faqs-a4", text: "Both. There's a one-time build fee to install and train the system on your business, and a monthly to operate and maintain the plumbing so you never have to touch it. That's the standard model, the same as renting any other piece of infrastructure your business runs on. We go over the exact numbers for your setup on the call.", align: "left" } },
          { type: "Heading", props: { id: "faqs-q5", text: "5. What do you need from me to get started?", level: "h3", align: "left" } },
          { type: "Text", props: { id: "faqs-a5", text: "A quick intake call. You tell me how you run today — how leads come in, what you use, how you sell — and I'll show you exactly where the AI employees plug in. From there I do the building. You stay in control the whole way; I just handle the wiring.", align: "left" } },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "faqs-cta",
        background: "#f3f4f6",
        content: [
          { type: "Heading", props: { id: "faqs-cta-h", text: "Still have a question?", level: "h2", align: "center" } },
          { type: "Text", props: { id: "faqs-cta-p", text: "Book a quick call and ask me directly. You'll leave knowing exactly where AI employees plug into your business — with you holding the keys.", align: "center" } },
          { type: "Button", props: { id: "faqs-cta-btn", title: "Book the Call", subtitle: "A quick call to see where AI employees plug into your business.", href: "/#contact" } },
          { type: "PhoneLink", props: { id: "faqs-cta-phone", label: "Or call me directly: (210) 298-2343", tel: "+12102982343" } },
        ],
      },
    },
  ],
};

// Case Study (hero · before · what we installed · what she did · the point · CTA).
const CASE_STUDY_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "casestudy-s1", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "casestudy-s1-eyebrow", text: "The proof", level: "h3", align: "left" } },
      { type: "Heading", props: { id: "casestudy-h1", text: "The machine is the receipt.", level: "h1", align: "left" } },
      { type: "Text", props: { id: "casestudy-s1-lead", text: "You don't have to take my word for what a dynamic AI employee does. Here's one already doing it — in a real business, with real leads, on a Sunday night.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "casestudy-s2", background: "#ffffff", content: [
      { type: "Heading", props: { id: "casestudy-s2-h2", text: "The setup: good leads, slow follow-up.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "casestudy-s2-p1", text: "A med spa was running paid ads and getting plenty of leads. The problem was the same one almost every owner has. Leads filled out the form, landed in the CRM, and sat there. By the time someone got around to calling, the lead had gone cold — or already booked somewhere else.", align: "left" } },
      { type: "Text", props: { id: "casestudy-s2-p2", text: "They'd already tried the usual fix: an automated email-and-text follow-up that fired off a few canned messages and stopped. That's step one — a script that waits. It helps a little, then runs out of road. It can't hold a real conversation, can't answer a question, and can't get anyone onto the calendar. It just waits.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "casestudy-s3", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "casestudy-s3-h2", text: "What we installed: a dynamic AI employee.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "casestudy-s3-p1", text: "We took the owner's own sales conversations — how he answers questions, how he handles the price objection, how he talks to people — and trained an AI employee on all of it. We named her Chloe.", align: "left" } },
      { type: "Text", props: { id: "casestudy-s3-p2", text: "This is step two. Not a script that waits for someone to reply. An employee that goes to work: she answers the lead, holds a real back-and-forth, handles objections in the owner's own words, and books the appointment herself. She sounds like the owner trained her — because he did, through his own recordings.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "casestudy-s4", background: "#ffffff", content: [
      { type: "Heading", props: { id: "casestudy-s4-h2", text: "What she actually did.", level: "h2", align: "left" } },
      { type: "Heading", props: { id: "casestudy-did0-title", text: "Answered every lead the instant it landed", level: "h3", align: "left" } },
      { type: "Text", props: { id: "casestudy-did0-body", text: "A lead fills out the form at 9:47 on a Sunday night. Before, it sat in the CRM until Monday morning — cold, or gone to a competitor. Now it gets a real reply in seconds, every time, day or night.", align: "left" } },
      { type: "Heading", props: { id: "casestudy-did1-title", text: "Booked the consult on its own", level: "h3", align: "left" } },
      { type: "Text", props: { id: "casestudy-did1-body", text: "It doesn't just say hello and wait. It asks the right questions, handles the price objection the way the owner handles it, answers what it can, and walks the lead onto the calendar. Four of them in the first hour and a half.", align: "left" } },
      { type: "Heading", props: { id: "casestudy-did2-title", text: "Went back and woke up the cold leads", level: "h3", align: "left" } },
      { type: "Text", props: { id: "casestudy-did2-body", text: "Every business is sitting on a list of leads that went quiet. Instead of letting them rot, the AI employee reaches back out, restarts the conversation, and pulls the ones who are ready back into the pipeline.", align: "left" } },
      { type: "Heading", props: { id: "casestudy-receipt0-value", text: "Instant", level: "h3", align: "center" } },
      { type: "Text", props: { id: "casestudy-receipt0-label", text: "Every lead answered the second it comes in", align: "center" } },
      { type: "Heading", props: { id: "casestudy-receipt1-value", text: "4", level: "h3", align: "center" } },
      { type: "Text", props: { id: "casestudy-receipt1-label", text: "Consults booked in the first 90 minutes live", align: "center" } },
      { type: "Heading", props: { id: "casestudy-receipt2-value", text: "Sunday night", level: "h3", align: "center" } },
      { type: "Text", props: { id: "casestudy-receipt2-label", text: "When a human would've been asleep", align: "center" } },
    ] } },
    { type: "Section", props: { id: "casestudy-s5", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "casestudy-s5-h2", text: "And the owner kept the keys the whole time.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "casestudy-s5-p1", text: "Chloe runs on top of the business the owner already had. His CRM. His calendar. His leads. His pricing. Nothing got ripped out and nothing got taken away. I operate the plumbing in the background so he doesn't have to — and he can watch every conversation and every booking as it happens.", align: "left" } },
      { type: "Text", props: { id: "casestudy-s5-p2", text: "That's the whole idea. You become the AI-first company, the machine does the work, and your hand stays on every lead and every dollar.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "casestudy-s6", background: "#ffffff", content: [
      { type: "Heading", props: { id: "casestudy-s6-h2", text: "Want one of these answering your leads?", level: "h2", align: "center" } },
      { type: "Text", props: { id: "casestudy-s6-p", text: "Book a quick call. I'll show you exactly where a dynamic AI employee plugs into the business you already run.", align: "center" } },
      { type: "Button", props: { id: "casestudy-s6-btn", title: "Book the Call", subtitle: "See where a dynamic AI employee plugs into your business.", href: "/#contact" } },
      { type: "PhoneLink", props: { id: "casestudy-s6-phone", label: "Or call me directly: (210) 298-2343", tel: "+12102982343" } },
    ] } },
  ],
};

// The four "table" pages share the PillarTemplate shape: dark navy hero (white text) ·
// intro · "Who's at this table" · CTA.
const TECH_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "tech-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "tech-eyebrow", text: "The build", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "tech-h1", text: "Tech", level: "h1", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "tech-tagline", text: "The technology partners who plug into the build behind the playbook.", align: "center", color: "#ffffff" } },
    ] } },
    { type: "Section", props: { id: "tech-intro", background: "#ffffff", content: [
      { type: "Text", props: { id: "tech-body", text: "The AI employees are built, not bought off a shelf — installed on top of the business an operator already runs, then handed back so he stays in command. I'm a non-coder who's been the tech lead in all five of my businesses, so I build it the way an operator needs it to run, not the way a vendor wants to sell it. This is the table for the technology partners pushing the same frontier from the other side. The first one already runs live: Chloe, an AI employee answering and booking inside a working med spa.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "tech-universe", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "tech-universe-h2", text: "Who's at this table", level: "h2", align: "left" } },
      { type: "Text", props: { id: "tech-u-0", text: "AI builders and model partners on the frontier of what an AI employee can do.", align: "left" } },
      { type: "Text", props: { id: "tech-u-1", text: "Tooling and infrastructure partners — the rails the employees run on.", align: "left" } },
      { type: "Text", props: { id: "tech-u-2", text: "Integration partners across the operator's existing stack.", align: "left" } },
      { type: "Text", props: { id: "tech-u-3", text: "The people who keep the engine a step ahead of the field.", align: "left" } },
      { type: "Text", props: { id: "tech-universe-footnote", text: "Episodes / details — coming", align: "left", color: "#4b5563" } },
    ] } },
    { type: "Section", props: { id: "tech-cta", background: "#ffffff", content: [
      { type: "Button", props: { id: "tech-cta-btn", title: "Partner with us", subtitle: "Builder to builder, on the tech side of the table.", href: "/#contact" } },
    ] } },
  ],
};

const BOARD_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "board-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "board-eyebrow", text: "The top tier", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "board-h1", text: "Board of Directors", level: "h1", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "board-tagline", text: "Company leaders who've already run the mergers-and-acquisitions playbook — at the highest level, across industries.", align: "center", color: "#ffffff" } },
    ] } },
    { type: "Section", props: { id: "board-intro", background: "#ffffff", content: [
      { type: "Text", props: { id: "board-body", text: "This is the top tier of the table: the leaders who've been all the way through it — built, rolled up, and exited — more than once. These are the deepest conversations on the M&A playbook, the exact playbook I lived from the inside five times, with the people who've run it at scale. Same doctrine as the show: I never pitch on the mic. It's how the most seasoned operators and I get to know each other — principal to principal, on the record.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "board-universe", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "board-universe-h2", text: "Who's at this table", level: "h2", align: "left" } },
      { type: "Text", props: { id: "board-u-0", text: "Founders who took a single shop to a platform exit.", align: "left" } },
      { type: "Text", props: { id: "board-u-1", text: "Roll-up operators who consolidated a fragmented field into one company.", align: "left" } },
      { type: "Text", props: { id: "board-u-2", text: "Leaders who've sat on both sides of the acquisition table.", align: "left" } },
      { type: "Text", props: { id: "board-u-3", text: "The people who de-risk the next deal because they've already closed the last one.", align: "left" } },
      { type: "Text", props: { id: "board-universe-note", text: "Episodes / details — coming", align: "left", color: "#4b5563" } },
    ] } },
    { type: "Section", props: { id: "board-cta", background: "#ffffff", content: [
      { type: "Button", props: { id: "board-cta-btn", title: "Get in touch", subtitle: "Leaders who've done the deal — no pitch on the mic.", href: "/#contact" } },
    ] } },
  ],
};

const RAISING_CAPITAL_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "capital-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "capital-eyebrow", text: "The money", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "capital-h1", text: "Raising Capital", level: "h1", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "capital-tagline", text: "The capital partners behind the re-rate.", align: "center", color: "#ffffff" } },
    ] } },
    { type: "Section", props: { id: "capital-intro", background: "#ffffff", content: [
      { type: "Text", props: { id: "capital-body", text: "A services roll-up trades at a services multiple. But when you own the AI layer the businesses run on — not a tool you license, the layer you built — that same roll-up starts to re-rate toward a technology multiple. That's the capital story underneath the operating one: buy in fragmented fields, install the AI employees, and the whole platform gets repriced. This is the table for the money partners who fund the playbook and share the upside.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "capital-universe", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "capital-universe-title", text: "Who's at this table", level: "h2", align: "left" } },
      { type: "Text", props: { id: "capital-u-0", text: "Venture and growth capital backing the AI layer itself.", align: "left" } },
      { type: "Text", props: { id: "capital-u-1", text: "Search funds and independent sponsors rolling up a fragmented field.", align: "left" } },
      { type: "Text", props: { id: "capital-u-2", text: "Private-equity sponsors who want a technology re-rate on a services book.", align: "left" } },
      { type: "Text", props: { id: "capital-u-3", text: "The capital that turns one shop into a platform.", align: "left" } },
      { type: "Text", props: { id: "capital-universe-footnote", text: "Episodes / details — coming", align: "left", color: "#4b5563" } },
    ] } },
    { type: "Section", props: { id: "capital-cta", background: "#ffffff", content: [
      { type: "Button", props: { id: "capital-cta-btn", title: "Let's talk", subtitle: "Principal to principal, on the capital side of the table.", href: "/#contact" } },
    ] } },
  ],
};

const PODCAST_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "podcast-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "podcast-eyebrow", text: "The content engine", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "podcast-h1", text: "The Podcast", level: "h1", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "podcast-tagline", text: "Operators at every stage of the journey — still solo, mid-roll-up, already exited — across every field.", align: "center", color: "#ffffff" } },
    ] } },
    { type: "Section", props: { id: "podcast-intro", background: "#ffffff", content: [
      { type: "Text", props: { id: "podcast-body", text: "Five businesses, forty years, one playbook. This is where I hear it in other people's words. I sit down with operators from every industry, at every stage of the run, and the money and tech partners who build the room around them — and I never pitch on the mic. The show is the conversation, not a sales channel; the clips in the hero reel are cut from these rooms, and the table never runs dry.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "podcast-universe", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "podcast-universe-title", text: "Who's at this table", level: "h2", align: "left" } },
      { type: "Text", props: { id: "podcast-universe-0", text: "Operators still running solo — in the thick of it, doing 90% of it themselves.", align: "left" } },
      { type: "Text", props: { id: "podcast-universe-1", text: "Operators mid-roll-up — buying, integrating, scaling a fragmented field.", align: "left" } },
      { type: "Text", props: { id: "podcast-universe-2", text: "Operators who've already exited — and what they'd run back the same, or differently.", align: "left" } },
      { type: "Text", props: { id: "podcast-universe-3", text: "The money partners and tech partners who make the whole thing go.", align: "left" } },
      { type: "Text", props: { id: "podcast-universe-coming", text: "Episodes / details — coming", align: "left", color: "#4b5563" } },
    ] } },
    { type: "Section", props: { id: "podcast-cta", background: "#ffffff", content: [
      { type: "Button", props: { id: "podcast-cta-btn", title: "Come on the show", subtitle: "One operator to another — no pitch on the mic.", href: "/#contact" } },
    ] } },
  ],
};

// Home = the current journey spine (8 live sections, in the registry's order). The hero carries
// its text as props (editable in the builder); the rest are wrapped blocks until converted.
const HOME_SEED: Data = {
  root: {},
  content: [
    { type: "HeroReel", props: {
      id: "home-hero",
      eyebrow: "From solo entrepreneur to exit",
      h1: "Four businesses. Forty years. I was the technology in every one.",
      sub: "Restaurant, mortgage, roofing, trucking — four businesses I ran, and in every one I was the architect who built the systems that made it work, because we were too small to afford anyone else. That became my fifth business: I do it for other operators now. I walk in and install the technology itself — a workforce of AI employees — into a business like the ones I built. The trade has a name: the AI Employee Operating System.",
      fieldsLine: "It works in any owner-run business — the trades, clinics, services — anywhere the same playbook runs.",
      ctaTitle: "Apply to work with me",
      ctaSubtitle: "One operator to another.",
    } },
    { type: "Playbook", props: { id: "home-playbook" } },
    { type: "TheCeiling", props: { id: "home-ceiling" } },
    { type: "Weapon", props: { id: "home-weapon" } },
    { type: "Proof", props: { id: "home-proof" } },
    { type: "Platform", props: { id: "home-platform" } },
    { type: "Moat", props: { id: "home-moat" } },
    { type: "NextMove", props: { id: "home-next" } },
  ],
};

// Med-Spa: text hero · 3 wrapped custom sections · buyer CTA.
const MEDSPA_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "medspa-hero", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "medspa-hero-eyebrow", text: "Med Spa AI Employees", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "medspa-hero-h1", text: "AI employees for med spas — the leads you already paid for, answered and booked the second they land.", level: "h1", align: "center" } },
      { type: "Text", props: { id: "medspa-hero-sub1", text: "You've tried to hire help, more than once, in every corner of the business. It never sticks — you end up with a handful of average people and all the real work still on you. And it's quietly worn you down.", align: "center", color: "#2563eb" } },
      { type: "Text", props: { id: "medspa-hero-sub2", text: "The game just changed. As your growth partner, the first thing I install is your first AI employee — a salesperson better than any you could hire, aimed straight at your growth. We start there.", align: "center", color: "#4b5563" } },
      { type: "Button", props: { id: "medspa-hero-cta", title: "Book the Call", subtitle: "See exactly what we'd install — and what you'd control.", href: "/#contact" } },
    ] } },
    { type: "MedSpaWound", props: { id: "medspa-wound" } },
    { type: "MedSpaStep", props: { id: "medspa-step" } },
    { type: "MedSpaPricing", props: { id: "medspa-pricing" } },
    { type: "Section", props: { id: "medspa-cta", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "medspa-cta-eyebrow", text: "Your Next Move", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "medspa-cta-h2", text: "You always knew you needed this. The employee you could never find or keep now exists.", level: "h2", align: "center" } },
      { type: "Text", props: { id: "medspa-cta-p1", text: "Get on a quick call. Tell me how you run today, and I'll show you exactly where your first AI employee plugs in — starting with speed to lead.", align: "center" } },
      { type: "Text", props: { id: "medspa-cta-p2", text: "I install it. You turn it on. You stay in command.", align: "center" } },
      { type: "Button", props: { id: "medspa-cta-btn", title: "Book the Call", subtitle: "A quick call. No pitch deck — just where AI fits on your business.", href: "/#contact" } },
    ] } },
  ],
};

// Industries hub: text hero · the cards strip · CTA.
const INDUSTRIES_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "ind-hero", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "ind-eyebrow", text: "Industries", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "ind-h1", text: "The fields — and the playbook inside each one.", level: "h1", align: "center" } },
      { type: "Text", props: { id: "ind-intro", text: "Every owner-run business runs the same playbook. Find your field and go deep — the list keeps growing.", align: "center" } },
    ] } },
    { type: "FindYourIndustry", props: { id: "ind-cards" } },
    { type: "Section", props: { id: "ind-cta", background: "#ffffff", content: [
      { type: "Text", props: { id: "ind-cta-p", text: "Don't see your field yet? It's probably next. Let's talk.", align: "center" } },
      { type: "Button", props: { id: "ind-cta-btn", title: "Book the Call", subtitle: "One operator to another.", href: "/#contact" } },
    ] } },
  ],
};

// Industry deep pages — each is a single FieldDeep block carrying that field's copy.
const HVAC_SEED: Data = {
  root: {},
  content: [{ type: "FieldDeep", props: {
    id: "hvac",
    name: "HVAC",
    eyebrow: "HVAC — same shape, I've seen it five times",
    intro: "I haven't run an HVAC shop, but I've run five businesses that move exactly like one — and the pattern is the same every time. Your season is a wall: the first 100-degree week hits and every phone in town rings at once, and the unit that goes down in July is an emergency that pays today. You're dispatching techs, chasing parts, and quoting installs while the calls stack up faster than anyone can answer them. You built it one truck at a time, on your own back. What's been capping you was never the wrench work — it's everything happening on the phone while your crew is in the field.",
    leaksLede: "I've watched this exact leak in every service business I've run. Here's where the money runs out of an HVAC shop, every day:",
    leaks: [
      { item: "The no-AC emergency that calls at 9 p.m. in July — and goes to the competitor who answered while yours rang out." },
      { item: "The $9,000 system-replacement quote that needed a follow-up, and never got one. Big tickets close on the follow-through." },
      { item: "Every call that hits voicemail during the heat wave — the exact week one missed call is a whole install gone." },
      { item: "The maintenance-plan customers who lapse because nobody reminded them their tune-up was due." },
      { item: "The 'let me talk to my spouse' install quote that needed three touches and got none." },
      { item: "Years of past service customers with aging units, due for a replacement, sitting in your system untouched." },
    ],
    fix: "An AI employee closes every one of those leaks at once. It picks up the instant a lead lands — peak-season midnight, weekend, doesn't matter — and reads what the person actually said instead of blasting the same canned text at everybody. It chases the big install quote until it gets a yes or a no, reminds the maintenance-plan customers their tune-up is due, nudges the 'let me check with my spouse' on its own clock, and works your old service list for the units that are ready to be replaced. It books the call straight onto the dispatch calendar — same way every time, every job logged — while your techs stay on the tools.",
    rollup: "This is the same playbook underneath all five of my businesses — you just point it at HVAC. First you stop the bleed on the shop you've already got: the emergency calls and install quotes you were losing turn into booked revenue, straight to the bottom line. Then you bolt on the next location, the next service area — and the AI layer answers the phones the same way across all of them, no new call center per branch. Own that layer and you stop getting priced like a service company and start getting priced like a platform — a technology multiple, not a trade multiple. That's the path a mergers-and-acquisitions operator runs to build something worth buying. Same playbook, maximized — and AI is the newest weapon in it.",
  } }],
};

const ROOFING_SEED: Data = {
  root: {},
  content: [{ type: "FieldDeep", props: {
    id: "roofing",
    name: "Roofing",
    eyebrow: "Roofing — I ran one of these",
    intro: "I ran a roofing company. So I'm not guessing here — I know how this one moves. The phone runs your week: a storm rolls through, the leads pile up all at once, and whoever calls back first gets the job. You're up on a roof or running a crew while the next ten callers go to the next guy in the truck. You built it on your own back, every hat your own, and the thing that's been holding you back was never the work — it's everything that happens off the ladder while your hands are full.",
    leaksLede: "I've stood in this exact spot. Here's where the money runs out of a roofing shop, every single day:",
    leaks: [
      { item: "The storm-chase lead that hits at 8 p.m. — you call back at noon the next day and they already signed with whoever picked up first." },
      { item: "The estimate you drove out and gave, then never followed up on. Half of those close on the third nudge you never sent." },
      { item: "The calls that roll to voicemail while you're up top or under a deadline — and a roofing voicemail almost never gets a callback." },
      { item: "The insurance-claim job that stalls because nobody chased the adjuster's paperwork on time." },
      { item: "The 'we'll think about it' that needed three touches over two weeks — and got zero, because you were on the next roof." },
      { item: "Two years of past customers sitting in your phone, due for a re-roof or a referral, that nobody has time to work." },
    ],
    fix: "An AI employee plugs every one of those holes at the same time. It answers the second a lead lands — storm night, Sunday, 2 a.m., doesn't matter — and it actually reads what the person wrote instead of firing the same canned blast at everybody. It chases the estimate, nudges the 'we'll think about it' on its own schedule, keeps the claim paperwork moving, and quietly works your old customer list for re-roofs and referrals. It books the appointment straight onto the calendar. Same way every time, every job logged, while your hands stay on the work you're actually good at.",
    rollup: "This is the same playbook I've run five times — you just point it at roofing. First you stop the bleed on the shop you've already got: the leads you were losing turn into booked jobs, and that drops straight to the bottom line. Then you bolt on the next crew, the next town, the next shop — and the AI layer runs the phones the same way across all of them, no extra front desk per location. Own that layer and you stop getting priced like a roofing company and start getting priced like a platform — a technology multiple instead of a trade multiple. That's the difference between selling a truck and a crew, and selling a machine. Same playbook a mergers-and-acquisitions operator runs — maximized, and AI is the newest weapon in it.",
  } }],
};

const GARAGE_SEED: Data = {
  root: {},
  content: [{ type: "FieldDeep", props: {
    id: "garage-doors",
    name: "Garage Doors",
    eyebrow: "Garage doors — same shape, I've seen it five times",
    intro: "I haven't run a garage-door shop, but I've run five businesses shaped exactly like one — and the pattern doesn't change. It's a now business: a broken spring or a door off the track is an emergency, the customer's car is trapped in the garage, and they call the first three companies and book whoever picks up. You're out on installs and service calls while the phone keeps ringing back at the shop. You built it one truck at a time, on your own back. The thing capping you was never the install work — it's every call that comes in while your hands are full of a torsion spring.",
    leaksLede: "I've watched this same leak in every service business I've run. Here's where the money runs out of a garage-door shop, every day:",
    leaks: [
      { item: "The broken-spring emergency that calls while you're on a job — and books the competitor who answered first." },
      { item: "The new-door quote — a real ticket — that needed a follow-up and never got one. Those close on the second and third touch." },
      { item: "Every after-hours and weekend call that hits voicemail, when a stuck door is exactly the kind of thing people call about at night." },
      { item: "The opener and tune-up customers who never hear from you again until something breaks." },
      { item: "The 'send me a price on a new door' that needed three nudges and got zero." },
      { item: "Years of past repair customers with aging doors and openers, due for a replacement, sitting untouched in your system." },
    ],
    fix: "An AI employee closes every one of those leaks at once. It answers the second a lead lands — nights, weekends, mid-emergency, doesn't matter — and reads what the person actually wrote instead of blasting the same canned reply at everybody. It chases the new-door quote until it gets an answer, follows up on the tune-ups, nudges the 'just send me a price' on its own schedule, and works your old repair list for the doors and openers that are ready to be replaced. It books the call straight onto the calendar — same way every time, every job logged — while you stay on the truck.",
    rollup: "This is the same playbook running under all five of my businesses — you just point it at garage doors. First you stop the bleed on the shop you've got: the emergency calls and new-door quotes you were losing turn into booked jobs, straight to the bottom line. Then you bolt on the next truck, the next territory, the next shop — and the AI layer runs the phones the same way across all of them, no extra front desk per location. Own that layer and you stop getting priced like a service company and start getting priced like a platform — a technology multiple, not a trade multiple. That's the road a mergers-and-acquisitions operator takes to build something worth buying. Same playbook, maximized — and AI is the newest weapon in it.",
  } }],
};

const SEEDS: Record<string, Data> = {
  home: HOME_SEED,
  about: SEED,
  faqs: FAQS_SEED,
  "case-study": CASE_STUDY_SEED,
  tech: TECH_SEED,
  "board-of-directors": BOARD_SEED,
  "raising-capital": RAISING_CAPITAL_SEED,
  podcast: PODCAST_SEED,
  "med-spa": MEDSPA_SEED,
  industries: INDUSTRIES_SEED,
  "industry-hvac": HVAC_SEED,
  "industry-roofing": ROOFING_SEED,
  "industry-garage-doors": GARAGE_SEED,
};

export function seedFor(slug: string, title: string): Data {
  return SEEDS[slug] || starter(slug, title);
}
