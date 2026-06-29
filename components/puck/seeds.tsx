import type { Data } from "@measured/puck";
import { SEED, IMAGE_DEFAULTS } from "@/components/puck/config";
import { MEDSPA_WOUND_DEFAULTS } from "@/components/medspa/MedSpaWound";
import { MEDSPA_STEP_DEFAULTS } from "@/components/medspa/MedSpaStep";
import { MEDSPA_PRICING_DEFAULTS } from "@/components/medspa/MedSpaPricing";

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
          { type: "Heading", props: { id: "faqs-h1", text: "Questions before you apply.", level: "h1", align: "left" } },
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
          { type: "Text", props: { id: "faqs-cta-p", text: "Apply and ask me directly. You'll leave knowing exactly where AI employees plug into your business — with you holding the keys.", align: "center" } },
          { type: "Button", props: { id: "faqs-cta-btn", title: "Apply to work with me", subtitle: "A quick call to see where AI employees plug into your business.", href: "/#contact" } },
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
      { type: "Text", props: { id: "casestudy-s6-p", text: "Apply to work with me. I'll show you exactly where a dynamic AI employee plugs into the business you already run.", align: "center" } },
      { type: "Button", props: { id: "casestudy-s6-btn", title: "Apply to work with me", subtitle: "See where a dynamic AI employee plugs into your business.", href: "/#contact" } },
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

// Home = SJC front-half (Story→Problem→Solution) → Chloe back-half. Flow:
// hero (who we are = native AI implementation partner) → story → problem → solution
// → meet Chloe → staff screenshot → Chloe at work → replaces the team → 5 core →
// 3 add-ons → tech-enabled → CTA. The Solution's last line hands into "Meet Chloe."
// Branding lock (2026-06-29): "native AI implementation" threaded top-to-bottom — hero
// frames WHO WE ARE first so "AI" reads as the differentiation, not a threat.
// IDs are stable so copy can be targeted by ID without touching structure.
// Render state: if an Upstash published snapshot exists it takes over readPuckPublished("home").
// To load this seed: /edit/home?reset=1 → then Publish.
const HOME_SEED: Data = {
  root: {},
  content: [
    // ── 1. hero — WHO WE ARE: the native AI implementation partner ────────────────────────────
    { type: "Section", props: { id: "hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "hero-eyebrow", text: "Every headline is saying the same thing", align: "center", color: "#93c5fd" } },
      { type: "Heading", props: { id: "hero-h1", text: "Put AI in your business now — or watch your competition leave you behind.", fontSize: 48, align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "hero-sub1", text: "You've heard it everywhere, and they're right. But here's what nobody tells you: you're not an AI company, and you don't have to become one. We're the partner that installs it for you — built onto the business you already run, working in the background, with the controls handed to you.", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "hero-sub2", text: "You get the growth, and a sales force that finally closes. You don't lift a finger, you don't learn a thing, and you never give up an inch of command. We're SJC — the AI implementation partner. We do the work. You stay the boss.", align: "center", color: "#ffffff" } },
      { type: "Video", props: { id: "hero-video", src: "", caption: "2-minute walkthrough — coming" } },
      { type: "Button", props: { id: "hero-cta", title: "Book your intake call", subtitle: "A working conversation about how you run today — not a pitch. We'll show you exactly where your first AI employee plugs in.", href: "/#contact" } },
    ] } },

    // ── 1b. story — what changed (Steven IS the persona) ──────────────────────────────────────
    // ── 1a. stat band — the news-wave in numbers (reinforces the hero; AEO fuel; stacks on mobile)
    { type: "Section", props: { id: "wave-stats", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "wave-stats-eyebrow", text: "The headlines aren't hype — here are the numbers", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "wave-stats-h2", text: "The businesses moving now are pulling away from the ones that wait.", fontSize: 32, align: "center" } },
      { type: "Columns", props: { id: "wave-stats-cols", columns: 3, gap: 24,
        col1: [
          { type: "Heading", props: { id: "stat1-num", text: "55%", fontSize: 54, align: "center", color: "#2563eb", spaceBelow: 4 } },
          { type: "Text", props: { id: "stat1-lbl", text: "of small businesses now use AI — up from 39% just a year ago. The wave isn't coming. It's already here.", align: "center" } },
        ],
        col2: [
          { type: "Heading", props: { id: "stat2-num", text: "2.5×", fontSize: 54, align: "center", color: "#2563eb", spaceBelow: 4 } },
          { type: "Text", props: { id: "stat2-lbl", text: "the revenue growth of AI-run businesses versus the ones still doing it all by hand.", align: "center" } },
        ],
        col3: [
          { type: "Heading", props: { id: "stat3-num", text: "73%", fontSize: 54, align: "center", color: "#2563eb", spaceBelow: 4 } },
          { type: "Text", props: { id: "stat3-lbl", text: "of owners already using AI say it made them more competitive — and that gap widens every month.", align: "center" } },
        ],
      } },
      { type: "Text", props: { id: "wave-stats-foot", text: "Sources: McKinsey, State of AI; U.S. small-business AI-adoption surveys, 2025.", fontSize: 13, align: "center", color: "#6b7280" } },
    ] } },

    // ── 1b. story — the eternal want ───────────────────────────────────────────────────────────
    { type: "Section", props: { id: "story", background: "#ffffff", content: [
      { type: "Text", props: { id: "story-eyebrow", text: "What you've always wanted", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "story-h2", text: "Every owner wants the same two things — together.", align: "left" } },
      { type: "Text", props: { id: "story-p1", text: "I've run five businesses since 1986 — a restaurant, a mortgage shop, a roofing company, a trucking outfit, and now this one. Owner and tech lead in every one. So I'm not studying you from the outside. I've been you. And I've wanted the exact thing you want: more leads coming in the top, and a real closer working every single one of them. Growth and a sales force — together.", align: "left" } },
      { type: "Text", props: { id: "story-p2", text: "That's not a new dream. Every operator has had it since the day they opened the doors. The leads filling up, and someone who answers fast, never lets one go cold, and books the appointment while you run the business. What's new — and it's brand new — is that you can finally have it.", align: "left" } },
    ] } },

    // ── 1c. problem — the sales team you could never build ────────────────────────────────────
    { type: "Section", props: { id: "problem", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "problem-eyebrow", text: "Why you could never get there", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "problem-h2", text: "You needed it. Every road to it was blocked.", align: "left" } },
      { type: "Text", props: { id: "problem-p1", text: "The only way to get growth and a sales force used to be to build an organization around it — hire the people, train them, manage them, then hire more to manage those. But every person you added was another paycheck, another problem, another way the whole thing slipped out of your hands. You didn't get into business to run a payroll and referee a team all day. So it stalled before it ever got going. That's the first wall.", align: "left" } },
      { type: "Text", props: { id: "problem-p2", text: "And the one hire that would've changed everything — the closer who answers in seconds, never lets a lead go cold, works the dead list, and handles the objection instead of folding the moment they hear it — you could never land. The great ones you couldn't afford. The good ones you couldn't keep; they got poached the minute they got good. And the true unicorns came with ego, drama, and babysitting. So you did what you always do: you wore the hat yourself. And while you were buried in the work, the leads slipped, the follow-up died, and the long list of people who once raised their hand quietly rotted in your system. That's the second wall.", align: "left" } },
      { type: "Text", props: { id: "problem-p3", text: "That's the perfect storm every owner has lived. You needed growth and a sales force, and every road to it ran straight through people you couldn't hire, couldn't keep, or couldn't afford to manage. It was never a discipline problem, and it was never a you problem. The tool that could do it any other way simply did not exist yet. Until it did.", align: "left" } },
    ] } },

    // ── 1d. solution — SJC = growth partner + sales partner; hands into Chloe ──────────────────
    { type: "Section", props: { id: "solution", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "solution-eyebrow", text: "What just changed", align: "left", color: "#93c5fd" } },
      { type: "Heading", props: { id: "solution-h2", text: "About two years ago, that changed — for good.", align: "left", color: "#ffffff" } },
      { type: "Text", props: { id: "solution-p1", text: "The AI employee crossed a line it had never crossed before. It got good enough to actually be that closer — and good enough to do the work of the whole org chart you never wanted to build. Not a chatbot. Not a help-desk script that breaks the second a real question shows up. An employee that answers the instant a lead lands, follows up like a person, works the dead list, handles the objection, and books the appointment — in your voice, on your calendar, around the clock. That's the tipping point. The thing you always wanted but could never reach is, for the first time, in reach — and the window just opened.", align: "left", color: "#ffffff" } },
      { type: "Text", props: { id: "solution-p2", text: "That's where SJC comes in — as your growth partner and your sales partner. We install it for you, right on top of the business you already run: your CRM, your calendar, your phone, the leads you already paid for. Nothing gets ripped out, nothing gets handed to a black box. You set the rules, you watch every conversation and every booking as it happens, and you stay the boss.", align: "left", color: "#ffffff" } },
      { type: "Text", props: { id: "solution-p3", text: "And here's the part that separates us from everyone else selling AI: you don't have to learn a thing. We don't hand you a login, a manual, and a good-luck. We build it, we train it on the way you actually sell, and we run it. It shows up like a rockstar coworker who sat down next to your team already trained — handing them layups from day one. Implementation and ease of use. You get the wins; you never touch the machine.", align: "left", color: "#ffffff" } },
      { type: "Heading", props: { id: "solution-bridge", text: "And the sales force we bring is Chloe.", fontSize: 30, align: "left", color: "#ffffff" } },
    ] } },

    // ── 2. meet-chloe ────────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "meet-chloe", background: "#ffffff", content: [
      { type: "Text", props: { id: "meet-chloe-eyebrow", text: "", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "meet-chloe-h2", text: "Meet Chloe.", align: "left" } },
      { type: "Text", props: { id: "meet-chloe-body", text: "This is Chloe. She answers your leads, follows up for days, and books the appointment — start to finish, in your voice. We don't hand you a login and a help doc and wish you luck. We build Chloe for your business, train her on the way you actually sell, and put her to work. She shows up her first day already knowing your offer, your prices, the objections you hear all day, and exactly how you like a customer handled. She's the employee you've been trying to hire for years — except she starts trained, she never has a bad day, and she never walks out the door with everything she learned in her head.", align: "left" } },
      { type: "Image", props: { id: "meet-chloe-portrait", ...IMAGE_DEFAULTS, src: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/7af0a5ce-12014A0CD94E4B0EA5A3D061753578BA.png", alt: "Chloe — your AI employee", maxWidth: 420 } },
    ] } },

    // ── 3. on-staff ──────────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "on-staff", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "on-staff-eyebrow", text: "My Staff", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "on-staff-h2", text: "She's on staff — right there in the lineup.", align: "left" } },
      { type: "Text", props: { id: "on-staff-body", text: "Pull up your team and there she is, in the roster between the people you already pay. Not a feature buried in a settings menu. A teammate — a name, a seat, a job, same as everybody else on the payroll. And you manage her the way you manage anyone: you set the rules, she does the work. The difference is every move she makes is on the record, where you can see it. For the first time, handing something off doesn't mean losing your grip on it — it means tightening it.", align: "left" } },
      { type: "Image", props: { id: "on-staff-screenshot", ...IMAGE_DEFAULTS, alt: "My Staff roster screenshot" } },
    ] } },

    // ── 4. at-work ───────────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "at-work", background: "#ffffff", content: [
      { type: "Text", props: { id: "at-work-eyebrow", text: "At Work", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "at-work-h2", text: "See her work.", align: "left" } },
      { type: "Text", props: { id: "at-work-body", text: "These are real conversations — names and numbers changed, nothing else. They happen to be from a clinic we run this for, but watch what she does, not what she sells: she handles the price objection, re-engages a lead who'd already given up, and knows exactly which questions aren't hers to answer. The same moves work in any business.", align: "left" } },
      { type: "Conversation", props: { id: "at-work-conv-1", chloeLabel: "Chloe", leadLabel: "Lead", caption: "She asked the two questions that kill most deals — the price, and “is this all you do?” Chloe turned both into a booking.", messages: [
        { from: "lead", text: "It's actually not far for me. Can you tell me about pricing? That's a big issue." },
        { from: "chloe", text: "Since you've already been on the medicine, your first visit is just $59. Then the monthly medicine depends on which option the doctor thinks fits you best — semaglutide starts at $199/month, tirzepatide at $279/month. No contracts, no memberships, just pay as you go. Want me to lock in that Monday spot so the doctor can go over what makes sense for you?" },
        { from: "lead", text: "Honestly, does this program only offer GLP?" },
        { from: "chloe", text: "Nope! We also do testosterone therapy, peptide treatments, and red light therapy. The doctor looks at the full picture and figures out what combination makes the most sense for where you're at — he doesn't just push one thing. Want me to grab that Monday spot?" },
        { from: "lead", text: "Ok. I'll take the call for Monday." },
      ] } },
      { type: "Spacer", props: { id: "at-work-gap-1", height: 16 } },
      { type: "Conversation", props: { id: "at-work-conv-2", chloeLabel: "Chloe", leadLabel: "Lead", caption: "A lead who'd already wasted money on the shots and given up — re-engaged, warmed up, and booked. Nobody on staff was going to chase her down. Chloe did.", messages: [
        { from: "chloe", text: "Hey! 80 pounds is a real goal — what's got you focused on making this happen right now?" },
        { from: "lead", text: "Can't buy bigger clothes! 😅 and I just wanted to look good at 56." },
        { from: "chloe", text: "Ha, I love that! 😊 Nothing like a closet full of clothes that don't fit to light a fire under you. Have you tried these weight-loss shots before, or is this something you've been looking into on your own?" },
        { from: "lead", text: "I started doing shots last year, saw weight loss... stopped for financial reasons, gained it back... started again... no weight loss, it's been 6 months now. Wasted money." },
        { from: "chloe", text: "Ugh, that's so frustrating — especially when you know it worked before. You're not alone in that at all, the doctor sees this a lot." },
        { from: "lead", text: "ok... lol... I was hoping I wasn't bothering someone so late at night! 😝" },
        { from: "chloe", text: "Ha, no bother at all! 😄 You're all set — see you Monday!" },
      ] } },
      { type: "Spacer", props: { id: "at-work-gap-2", height: 16 } },
      { type: "Conversation", props: { id: "at-work-conv-3", chloeLabel: "Chloe", leadLabel: "Lead", caption: "This is the line between an employee and a chatbot: she knows exactly where her job ends, and hands the medical and pricing calls to a human instead of guessing.", messages: [
        { from: "lead", text: "Quick question — is this a subscription plan, or do I order when I'm ready?" },
        { from: "chloe", text: "Great question — the doctor goes over all of that with you on your call so it's tailored to you. I don't want to give you a number that doesn't fit your plan. Want me to make sure he covers it?" },
      ] } },
    ] } },

    // ── 5. replaces-team ─────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "replaces-team", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "replaces-team-eyebrow", text: "One hire, four jobs", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "replaces-team-h2", text: "One hire. Four jobs.", align: "left" } },
      { type: "Text", props: { id: "replaces-team-body", text: "To cover what Chloe covers, you'd be hiring three or four people: a front desk to answer the moment a lead comes in, a follow-up person to chase the ones who go quiet, a closer to handle the objections and book the appointment, and somebody whose whole job is calling back the old customers nobody has time for. You've never been able to staff all four. Most owners can't staff one and keep them. Chloe holds all four seats at once, every hour of every day — and they never call in sick, never quit on you mid-season, and never need a raise to do it.", align: "left" } },
    ] } },

    // ── 6. chloe-core: 5 deep sub-sections ──────────────────────────────────────────────────
    { type: "Section", props: { id: "chloe-core-stl", background: "#ffffff", content: [
      { type: "Text", props: { id: "chloe-core-stl-eyebrow", text: "What she does, in plain English.", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "chloe-core-stl-h2", text: "She answers the second the lead lands.", align: "left" } },
      { type: "Text", props: { id: "chloe-core-stl-body", text: "The lead that comes in at 9 p.m. on a Saturday gets the same answer as the one that comes in on a Tuesday morning. Within seconds. In your voice. With your pricing, your offer, your way of talking to a customer. The lead who wanted a discount last month and never replied — she reaches back out on her own, reads the thread, and adjusts what she says. You don't have a person who does this. You have Chloe.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "chloe-core-dfu", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "chloe-core-dfu-eyebrow", text: "Dynamic Follow-Up", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "chloe-core-dfu-h2", text: "She follows up like a person, not a calendar reminder.", align: "left" } },
      { type: "Text", props: { id: "chloe-core-dfu-body", text: "Most follow-up is the same three messages on repeat, sent to everybody, on a timer nobody set with any intention. Chloe reads what the person actually said — the 'I need to think about it,' the 'my husband has to sign off,' the 'what's the price?' — and she responds to that. The message changes because the conversation changed. She doesn't stop because she ran out of templates. She stops when the person says yes or when they clearly won't — and she knows the difference.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "chloe-core-dbr", background: "#ffffff", content: [
      { type: "Text", props: { id: "chloe-core-dbr-eyebrow", text: "Database Reactivation", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "chloe-core-dbr-h2", text: "She goes back for the money you already wrote off.", align: "left" } },
      { type: "Text", props: { id: "chloe-core-dbr-body", text: "Every business is sitting on a pile of old leads — people who asked, got quoted, went quiet, and got forgotten. Nobody called them back because there was always something louder. Chloe calls them back. All of them. On her own, without being told. She doesn't need to be reminded because she lives in your database and she already knows who didn't close. She finds out what happened, picks up the conversation where it stopped, and books the appointment. That's revenue you already paid to acquire, coming in with no new ad spend.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "chloe-core-sil", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "chloe-core-sil-eyebrow", text: "Stays in Her Lane", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "chloe-core-sil-h2", text: "She knows what's hers to answer — and what isn't.", align: "left" } },
      { type: "Text", props: { id: "chloe-core-sil-body", text: "This is the whole line between an employee and a chatbot. A chatbot answers everything until it breaks trust on something it shouldn't have touched. Chloe knows the difference between a sales question and a medical question, a scheduling request and a pricing policy you haven't figured out yet, a complaint she can handle and one that needs you on the phone. When it's not hers, she says so and hands it off cleanly. You define the lines. She holds them.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "chloe-core-bkc", background: "#ffffff", content: [
      { type: "Text", props: { id: "chloe-core-bkc-eyebrow", text: "Booking & Calendar", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "chloe-core-bkc-h2", text: "She closes it — and puts it on the calendar herself.", align: "left" } },
      { type: "Text", props: { id: "chloe-core-bkc-body", text: "Chloe doesn't gather a lead and drop it on your desk. She works the lead, handles the objections, gets the yes — and then she books the appointment directly onto your calendar. You don't see the work. You see a new name on the schedule. The handoff point is 'confirmed' — not 'interested.' That's the difference between Chloe and every other tool you've tried.", align: "left" } },
    ] } },

    // ── 7. addons: 3 deep sub-sections ──────────────────────────────────────────────────────
    { type: "Section", props: { id: "addons-icr", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "addons-icr-eyebrow", text: "When you're ready, you can give her more to do.", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "addons-icr-h2", text: "She picks up the phone, too.", align: "left" } },
      { type: "Text", props: { id: "addons-icr-body", text: "When a call comes in and the desk is slammed, or after hours, or on a Sunday — Chloe answers. She handles the basics: hours, pricing, scheduling, what you offer and what you don't. She takes a message when she needs to. If the call needs a human, she flags it. You stop bleeding the leads that went to voicemail and just stayed there.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "addons-oce", background: "#ffffff", content: [
      { type: "Text", props: { id: "addons-oce-eyebrow", text: "Add-on: Outbound Calling AI Employee", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "addons-oce-h2", text: "She'll make the calls nobody ever gets around to.", align: "left" } },
      { type: "Text", props: { id: "addons-oce-body", text: "This is the step up from follow-up texts. When a lead has gone quiet and a phone call is the right next move — one your team never gets around to because there's always something in front of it — Chloe makes the call. She introduces herself, picks up where the conversation left off, and moves it. Outbound calling at the volume and consistency nobody could staff.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "addons-cs", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "addons-cs-eyebrow", text: "Add-on: Cross-Sell", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "addons-cs-h2", text: "She sells the second thing to the people who already bought the first.", align: "left" } },
      { type: "Text", props: { id: "addons-cs-body", text: "Your easiest sale is the customer you already have. They know you, they already said yes once, and the next thing they'd buy is usually right there waiting. Chloe surfaces it. She reaches out, she mentions it, she handles the back-and-forth, and she books it. You don't do anything. You look at the schedule and the names are already there.", align: "left" } },
    ] } },

    // ── 8. tech-enabled ──────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "tech-enabled", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "tech-enabled-eyebrow", text: "The part most owners don't see coming", align: "center", color: "#93c5fd" } },
      { type: "Heading", props: { id: "tech-enabled-h2", text: "And the day you sell, it's worth more — even if you only ever sell once.", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "tech-enabled-body", text: "A business that only runs because you're standing in it is a hard thing to sell. Whoever buys it is really just buying your job — and they'll pay you like it. A business that runs on a system that keeps working after you walk away is worth a great deal more, because now they're buying something that runs without you in the room. Buyers have a name for that kind of business: a tech-enabled company. And they pay a premium for it.", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "tech-enabled-body2", text: "That's exactly what we build into yours — a sales-and-follow-up engine that books customers whether you're there or not. Even if you've got one location and you only ever sell it once, that lift in what your business is worth — by itself — pays back everything we'll ever do for you, many times over. You get the growth now, and a bigger check at the finish line. The growth is just the part you can see from here.", align: "center", color: "#ffffff" } },
    ] } },

    // ── 9. cta ───────────────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "cta", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "cta-eyebrow", text: "The next move", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "cta-h2", text: "Let's talk — one solo entrepreneur to another.", align: "center" } },
      { type: "Text", props: { id: "cta-body", text: "I'm not going to sell you on a call. I'm going to listen to how you run today, show you exactly where your first AI employee plugs in, and tell you what it would look like on day one. No pitch deck. No system demos. Just the conversation — and if it makes sense, we talk about what's next.", align: "center" } },
      { type: "Button", props: { id: "cta-btn", title: "Book your discovery call", subtitle: "Fifteen minutes. Bring your numbers.", href: "/#contact" } },
      { type: "PhoneLink", props: { id: "cta-phone", label: "Or call me directly: (210) 298-2343", tel: "+12102982343" } },
    ] } },
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
      { type: "Button", props: { id: "medspa-hero-cta", title: "Apply to work with me", subtitle: "See exactly what we'd install — and what you'd control.", href: "/#contact" } },
    ] } },
    { type: "MedSpaWound", props: { id: "medspa-wound", ...MEDSPA_WOUND_DEFAULTS } },
    { type: "MedSpaStep", props: { id: "medspa-step", ...MEDSPA_STEP_DEFAULTS } },
    { type: "MedSpaPricing", props: { id: "medspa-pricing", ...MEDSPA_PRICING_DEFAULTS } },
    { type: "Section", props: { id: "medspa-cta", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "medspa-cta-eyebrow", text: "Your Next Move", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "medspa-cta-h2", text: "You always knew you needed this. The employee you could never find or keep now exists.", level: "h2", align: "center" } },
      { type: "Text", props: { id: "medspa-cta-p1", text: "Get on a quick call. Tell me how you run today, and I'll show you exactly where your first AI employee plugs in — starting with speed to lead.", align: "center" } },
      { type: "Text", props: { id: "medspa-cta-p2", text: "I install it. You turn it on. You stay in command.", align: "center" } },
      { type: "Button", props: { id: "medspa-cta-btn", title: "Apply to work with me", subtitle: "A quick call. No pitch deck — just where AI fits on your business.", href: "/#contact" } },
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

// What Changed — 6 content sections + the dark hinge band reproduced with native blocks.
const WHATCHANGED_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "wc-s1", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "wc-s1-eyebrow", text: "What changed", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "wc-h1", text: "The hire you could never make finally exists.", level: "h1", align: "left" } },
      { type: "Text", props: { id: "wc-s1-lead", text: "I know that hire never existed, because I spent my whole career needing it. I started my first business in 1986 — the same year Michael Gerber published The E-Myth and told every owner the same thing: build the org chart, fill the seats, stop being the business. For the four decades after that, his playbook was the law — and so was its one catch: every seat could only ever be filled by a human being. For a shop my size, that meant the seat stayed empty and the work fell back on me. Then, twenty-four months ago, that broke. For the first time since 1986, a seat can be filled by something other than a person — and it changes everything about the business you're running right now.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "wc-s2", background: "#ffffff", content: [
      { type: "Heading", props: { id: "wc-s2-h2", text: "The org chart was always a fantasy.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "wc-s2-p1", text: "Every business that grows past the owner needs the same thing: an org chart with the seats filled — someone on the phones, someone on follow-up, someone on sales, someone running operations. Michael Gerber wrote that down, and he was right. The part nobody says out loud is that for a business your size, those seats were never really fillable. You couldn't find the people. The ones you found didn't stick. And even the average ones cost more than the work was worth.", align: "left" } },
      { type: "Text", props: { id: "wc-s2-p2", text: "So every empty seat fell back on the one person who'd always catch it — you. That's not a you problem; that's every owner-run business since the beginning. You became the system because there was never another option. The org chart on the wall and the org chart in real life were two different things, and the gap between them was always your own two hands.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "wc-hinge", background: "#0f1f3d", content: [
      { type: "Heading", props: { id: "wc-hinge-text", text: "Forty years of human-only labor. Twenty-four months of something else.", level: "h2", align: "center", color: "#ffffff" } },
    ] } },
    { type: "Section", props: { id: "wc-s3", background: "#f3f4f6", content: [
      { type: "Heading", props: { id: "wc-s3-h2", text: "Then, for the first time, a tool did the work instead of waiting for you.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "wc-s3-p1", text: "Every tool before this one had the same flaw: it waited. The phone waited for you to dial. The CRM waited for you to type. The email blast waited for you to push the button. They were tools, and you were still the one holding them. Helpful — but not one of them ever filled a seat. They just gave you a faster way to do the work yourself.", align: "left" } },
      { type: "Text", props: { id: "wc-s3-p2", text: "Then the technology crossed a line it had never crossed before. For the first time, a tool doesn't wait — it works. Not a chatbot that answers one question and hands you back the job. A real AI employee: trained on the way YOU do it, it answers every lead the second it lands, holds a real conversation, handles the objection in your own words, books the appointment, and goes back to wake up the leads that went cold. It does the job the same way every time, it never quits, and you can see everything it does.", align: "left" } },
      { type: "Text", props: { id: "wc-s3-p3", text: "<strong>That's the whole breakthrough. The seat that was never fillable is finally fillable — by something other than you. It was impossible your entire career. Now it's real. That's what changed.</strong>", align: "left" } },
    ] } },
    { type: "Section", props: { id: "wc-s4", background: "#ffffff", content: [
      { type: "Heading", props: { id: "wc-s4-h2", text: "What it means for the business you run.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "wc-s4-p1", text: "When the seats fill themselves, the lid comes off. The leads stop leaking. The follow-up actually happens. The work that used to live in your head and your calendar moves into a system you control — and delegating finally tightens your grip instead of loosening it, because every conversation is logged and nothing lives in some new person's head where you can't see it.", align: "left" } },
      { type: "Text", props: { id: "wc-s4-p2", text: "<strong>You stop owning a job. You start owning a business.</strong>", align: "left" } },
    ] } },
    { type: "Section", props: { id: "wc-s5", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "wc-s5-eyebrow", text: "What it looks like", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "wc-s5-h2", text: "An org chart you can finally afford.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "wc-s5-p1", text: "Picture the seats you'd fill with people — front desk, follow-up, sales, the admin that eats your week — and what that costs in salary, training, and turnover, year after year, assuming you could even keep them. Now picture the same org chart filled by AI employees: built once, running every day, for a fraction of a single human wage.", align: "left" } },
      { type: "Text", props: { id: "wc-s5-p2", text: "That's the trade: a one-time build to install and train it on your business, and a flat monthly to keep it running — the same way you already pay for the software you run on. We walk the exact numbers for your setup on the call.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "wc-s6", background: "#ffffff", content: [
      { type: "Heading", props: { id: "wc-s6-h2", text: "The shift already happened. The only question is who installs it first.", level: "h2", align: "center" } },
      { type: "Text", props: { id: "wc-s6-p1", text: "Everyone in your market is about to be running on this. The only question is whether you're early or late — and the owners who put it in now own the head start, because their leads get answered the instant they land while everyone else's still sit in a voicemail box until Monday.", align: "center" } },
      { type: "Text", props: { id: "wc-s6-p2", text: "<strong>I install it. You stay in command.</strong>", align: "center" } },
      { type: "Button", props: { id: "wc-s6-btn", title: "Apply to work with me", subtitle: "I'll show you exactly where it plugs into the business you already run.", href: "/#contact" } },
      { type: "PhoneLink", props: { id: "wc-s6-phone", label: "Or call me directly: (210) 298-2343", tel: "+12102982343" } },
    ] } },
  ],
};

// For Agencies — the standalone white-label partner funnel. A DIFFERENT buyer than the homepage
// (the GHL agency, not the end owner): same product, agency-facing language. Native editable
// blocks, so the whole page lives in the Puck builder at /edit/for-agencies like every other page.
const FOR_AGENCIES_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "fa-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "fa-hero-eyebrow", text: "For Facebook Marketing Agencies", size: "base", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "fa-hero-h1", text: "AI is coming for every marketing agency. Be the one who installs it — not the one it replaces.", fontSize: 44, align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "fa-hero-sub", text: "You run a Facebook marketing agency, and you already know where this is headed: AI is about to commoditize lead-gen, and the agencies that just run ads get replaced. The ones who wield it become something else entirely — a tech-enabled company that installs AI employees inside their clients' businesses. That's the pivot you've been wanting, and almost nobody can hand it to you. I'm the AI implementation partner who does — and you'd be among the first to plant a flag in a category that didn't exist 24 months ago.", size: "lg", align: "center", color: "#ffffff" } },
      { type: "Video", props: { id: "fa-hero-video", src: "", caption: "Watch the 3-minute walkthrough" } },
      { type: "Button", props: { id: "fa-hero-cta", title: "Book a Partner Call", subtitle: "One operator to another.", href: "/#partner" } },
    ] } },
    { type: "Section", props: { id: "fa-arc", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-arc-eyebrow", text: "Remember when this was fun?", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-arc-h2", text: "You were the hotshots once. You get to be again.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-arc-p1", text: "Be honest — there was a window when running Facebook ads made you the smartest guy in the room. You printed leads, clients lined up, and you were on the front edge of something nobody else understood. Then everybody piled in. The platform got expensive, the targeting got gutted, the results got harder, and \"Facebook marketing agency\" went from cutting-edge to a commodity that gets beaten up on price and dropped without a second thought. You got your ass kicked — the whole industry did.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-arc-p2", text: "AI is the next window, and it's the same kind of edge Facebook ads were before everyone caught on. Get on it now and you're the one out front again — the agency that brought the future to its clients before the guy down the street even understood it. You don't get many of these windows. This is one, and it's open right now.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-turn", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-turn-eyebrow", text: "The pivot", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-turn-h2", text: "Stop being just a Facebook marketing agency. Become a tech-enabled company.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-turn-p1", text: "Running ads is getting commoditized — every agency does it, the price floor keeps dropping, and AI is about to automate most of it. Selling leads alone is a race to the bottom. The way out is to become a tech-enabled company — and that's not something you build, it's a partner you plug in. I'm your AI implementation partner: I do the enabling, you do the selling. The chain is dead simple — I enable you, you enable your client.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-turn-p2", text: "What you put on top of your client's business is a workforce of native AI employees — capability no agency could deliver until right now. And it does two things at once: it makes you sticky (your client can't unplug an AI workforce running his sales floor) and it makes you relevant (you stop being the ads vendor nervous about AI and become the partner who brought him the future first). Nobody has ever told you your agency could be that. I'm telling you it's exactly what you can become — and you keep running the ads you're already good at while this works underneath.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-proof", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-proof-eyebrow", text: "Proof first — not a pitch", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-proof-h2", text: "Meet Chloe. She's already on the clock.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-proof-p1", text: "You're not betting your name on a promise — here's the receipt. Chloe is an AI employee running live in a real business right now, trained on that owner's own sales conversations. In her first 30 days she booked around 30 appointments — about one a day — and four of them landed on a single dead Sunday: staff off, lights out, while she worked the leads alone.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-proof-p2", text: "That's the part that matters. Not a demo video, not a roadmap — a live employee filling a real calendar, with a dashboard the owner watches the number climb on in real time. That's what you'd be installing the day you become a tech-enabled company, behind your brand. Everything below is just how she does it.", size: "base", align: "left" } },
      { type: "Button", props: { id: "fa-proof-link", title: "See her live on the call", subtitle: "The dashboard, the real numbers.", href: "/#partner" } },
    ] } },
    { type: "Section", props: { id: "fa-magnitude", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-mag-eyebrow", text: "What you're actually installing", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-mag-h2", text: "One hire that does the work of three — and never has a bad day.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-mag-p1", text: "Chloe does the job of about three people — the front desk, the follow-up, the closer — for a fraction of one human wage. She never takes a day off, never forgets to follow up, never has a bad mood on lead number 400, and never goes to lunch when the hot lead comes in. She works 24/7, in your client's voice, behind your brand.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-mag-p2", text: "And here's the number that makes an owner sit up: run all three of her plays and you can pull roughly 5X the revenue out of the same ad budget — no new spend, you just stop the leaks across the pipeline he already owns. This is a native AI employee that didn't exist 24 months ago, doing things that have never been done before — and installing it is exactly what turns you from his ads vendor into his tech-enabled partner.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-levers", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-levers-eyebrow", text: "How it goes in", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-levers-h2", text: "Three levers. Each one a hero moment. All on money he already has.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-levers-p1", text: "You don't drop all of this at once. You pull three levers, in order. Each one makes you the hero on money the client already had sitting there, each one earns you the right to pull the next — and every one of them moves you further from ad vendor and closer to the tech-enabled partner he can't run without. Watch the order. The order is the whole game.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-lever1", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-l1-eyebrow", text: "Lever one — the foot in the door", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-l1-h2", text: "Found money off the dead list — on a scoreboard he can watch.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-l1-p1", text: "You start here every time, because it's the easiest yes you'll ever get and the fastest proof he'll ever see. Every client is sitting on a graveyard — a database of leads they paid for months ago and never spoke to again. He already spent the money to get those people. They cost nothing to wake up.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-l1-p2", text: "Point Chloe at that dead list and she goes to work — not blasting a coupon, selling: reading replies, handling the brush-off, reviving the ones with a pulse, booking them. And you put the number on a scoreboard he watches climb in real time. Run the math with him out loud: she books 5 off the dead list this week, each worth about $1,500 in lifetime value — that's $7,500 that didn't exist Monday morning, pulled from a list he'd written off, for less than a fraction of one hire. A founder who's heard a hundred pitches doesn't believe your words — he believes a number climbing on his own screen. That's why you lead here.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-lever2", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-l2-eyebrow", text: "Lever two — the one he asks for himself", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-l2-h2", text: "Now point her at the new leads he's already paying for.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-l2-p1", text: "Here's how you know lever one worked: you won't have to pitch lever two. He'll watch her close the dead list and the question falls out of his mouth — why are we only doing this on the dead leads? Why isn't she on my new leads the second they land? That's the whole sale, and he made it for you.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-l2-p2", text: "Now, speed-to-lead — answering the instant a lead comes in — is table stakes; everybody claims it. So that's not your hook. Your hook is what answers: not a form auto-reply, but the psychological sales engine your client has never had on his front line — closing the new lead with the same skill she just showed on the dead one. The lead that used to sit three hours and book with a competitor now gets a real closer in nine seconds, every time, day and night. Speed gets her in the door. The closing is what he's paying for.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-lever3", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-l3-eyebrow", text: "Lever three — the easiest money there is", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-l3-h2", text: "Sell more to the people who already bought.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-l3-p1", text: "By now she's pulled money out of his past — the dead list — and plugged his present — the new leads. The last leak is the easiest money in any business and almost nobody works it: the customers who already said yes. The hardest sale is the first one, and he already won it with everyone in his book. Those people trust him. They've paid him. And most agencies leave them completely alone after the first transaction.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-l3-p2", text: "Turn Chloe loose on them — the upgrade, the next service, the re-up — sold the way a sharp human reads it: right offer, right person, right moment. No ad spend, no new acquisition, just more revenue out of relationships he already paid to build. Three levers, one AI employee — and you've gone from running his ads to running his revenue.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-throughline", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-tl-eyebrow", text: "Why it never feels risky to him", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-tl-h2", text: "Past, present, and customers — every dollar already his.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-tl-p1", text: "Step back. Lever one worked his past — the dead leads he gave up on. Lever two worked his present — the new leads he's already paying you to generate. Lever three worked his customers — the people who already bought. Not one dollar of new ad spend in any of it. You didn't ask him to spend more to make more — you stopped the money that was already his from leaking out of the pipeline he already owns.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-tl-p2", text: "That's the easiest thing you'll ever sell a client — and the hardest thing he'll ever cancel. Cut you now and the leaks come right back, and he felt what they were costing. That's load-bearing. That's un-fireable. That's the substance the ads alone never gave you — and it's why he stops seeing you as the ad guy and starts seeing you as the tech partner who runs his business.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-moat", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-moat-eyebrow", text: "What I take off your plate", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-moat-h2", text: "You loved GoHighLevel's modularity. You hated executing it. I take the execution away.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-moat-p1", text: "This is what an AI implementation partner is for — taking the execution off your plate. You chose GHL because it's modular — bolt the pieces together, your name on all of it. And you know the other half of that promise: making anything real actually work in there takes a developer, and you've paid that tax in hours and broken automations. That half is the half I take. What I've built is a modular, clonable AI-employee system — install it once, clone it to the next client, and the next. Seasoned, turnkey, done-for-you. I hand it to you finished, behind your brand, and I run the engine. It's additive — keep your current developer, keep your stack, nothing breaks.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-moat-p2", text: "Then I take the other tax — the one your developer can't help with: the selling. I don't just hand you the employee, I hand you the playbook to sell her to your client — the exact sequence, which lever first, how to put the number on the board so he sees it instead of hearing it. You're not figuring out how to sell this; I've already figured it out and I hand it to you with the product. You keep the client, the billing, the margin, the relationship — and you become the operational backbone of his business. Pure upside. Pure stick.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-pricing", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-pr-eyebrow", text: "What it's worth vs. what it costs", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-pr-h2", text: "Price her against what she replaces — and what she creates.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-pr-p1", text: "When you set your client's price — and the retail is yours to set, I just hand you the guardrails — you anchor against two things, never against software. Software is a race to zero; Chloe is an employee. One: what she replaces — three real humans, call it $120,000 to $150,000 a year before training and turnover. Two: what she creates — the reactivation money, the saved leads, the re-sold customers, the lifetime value stacking on that scoreboard.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-pr-p2", text: "Price her at a fraction of either number and she's a no-brainer twice over — cheaper than the payroll she replaces, smaller than the revenue she creates. The owner does that math in four seconds and says yes. Your margin lives in the gap. That's yours.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-cta", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "fa-cta-eyebrow", text: "The first movers win this", size: "sm", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "fa-cta-h2", text: "A brand-new category just opened. Be first to plant your flag.", level: "h2", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "fa-cta-p1", text: "This is the rare moment when a whole new thing becomes possible, and the agencies that grab it first own the category. You stop being a Facebook marketing agency nervous about AI and become the tech-enabled company that installs it — sticky with every client, relevant in a world about to sort agencies into the ones who wield AI and the ones it replaces. White-label, done-for-you, the pricing and the playbook in the box; I build and run the engine, your name on all of it. One call, owner to owner, and I'll show you exactly how the first AI employee goes into one of your accounts.", size: "lg", align: "center", color: "#ffffff" } },
      { type: "Button", props: { id: "fa-cta-btn", title: "Book a Partner Call", subtitle: "Be first. One operator to another.", href: "/#partner" } },
    ] } },
  ],
};

const SEEDS: Record<string, Data> = {
  home: HOME_SEED,
  "for-agencies": FOR_AGENCIES_SEED,
  about: SEED,
  faqs: FAQS_SEED,
  "case-study": CASE_STUDY_SEED,
  tech: TECH_SEED,
  "board-of-directors": BOARD_SEED,
  "raising-capital": RAISING_CAPITAL_SEED,
  podcast: PODCAST_SEED,
  "med-spa": MEDSPA_SEED,
  "what-changed": WHATCHANGED_SEED,
  industries: INDUSTRIES_SEED,
  "industry-hvac": HVAC_SEED,
  "industry-roofing": ROOFING_SEED,
  "industry-garage-doors": GARAGE_SEED,
};

export function seedFor(slug: string, title: string): Data {
  return SEEDS[slug] || starter(slug, title);
}
