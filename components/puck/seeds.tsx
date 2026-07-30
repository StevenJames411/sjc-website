import type { Data } from "@measured/puck";
import { SEED, IMAGE_DEFAULTS, NAV_DEFAULTS, FOOTER_DEFAULTS } from "@/components/puck/config";

const NAV_SEED: Data = {
  root: {},
  content: [{ type: "SiteHeader", props: { id: "site-header", ...NAV_DEFAULTS } }],
};

const FOOTER_SEED: Data = {
  root: {},
  content: [{ type: "SiteFooter", props: { id: "site-footer", ...FOOTER_DEFAULTS } }],
};

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
          { type: "Text", props: { id: "faqs-eyebrow", text: "<b>FAQS</b>", align: "left", color: "#2563eb", fontSize: 14, spaceAbove: 0, spaceBelow: 4 } },
          { type: "Heading", props: { id: "faqs-h1", text: "Questions before you apply.", fontSize: 36, align: "left", spaceBelow: 8 } },
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
          { type: "Heading", props: { id: "faqs-q1", text: "1. Do I keep control of my leads, my data, and my accounts?", fontSize: 24, align: "left", spaceAbove: 40, spaceBelow: 8 } },
          { type: "Text", props: { id: "faqs-a1", text: "Yes. You keep the keys to everything. It's your CRM, your calendar, your phone number, your leads, your money. I install the AI employees on top of what you already have and operate the plumbing in the background — the same way you rent your CRM or your email. I'm the infrastructure you rent, not the boss. Your hand stays on every lead and every dollar.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
          { type: "Heading", props: { id: "faqs-q2", text: "2. How is this different from the chatbot or CRM I already have?", fontSize: 24, align: "left", spaceAbove: 40, spaceBelow: 8 } },
          { type: "Text", props: { id: "faqs-a2", text: "What you have now is step one: a script that waits. It fires off a few canned messages and stops. It can't hold a real conversation, answer a real question, or get anyone onto your calendar. What I install is step two: a dynamic AI employee that goes to work. It answers every lead the instant it comes in, follows up, handles objections in your own words, books the appointment, and even reaches back out to your cold leads. One waits. The other works.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
          { type: "Heading", props: { id: "faqs-q3", text: "3. What are the two things you actually install?", fontSize: 24, align: "left", spaceAbove: 40, spaceBelow: 8 } },
          { type: "Text", props: { id: "faqs-a3", text: "First, Speed to Lead — every single lead gets answered the second it comes in, day or night, so nothing slips through the cracks while you sleep. Second, a dynamic AI employee infrastructure that doesn't just sit there: it follows up, it reactivates the leads who went quiet, and it books consults on its own. Both run on top of the business you already have.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
          { type: "Heading", props: { id: "faqs-q4", text: "4. What does it cost — a build fee or a monthly?", fontSize: 24, align: "left", spaceAbove: 40, spaceBelow: 8 } },
          { type: "Text", props: { id: "faqs-a4", text: "Both. There's a one-time build fee to install and train the system on your business, and a monthly to operate and maintain the plumbing so you never have to touch it. That's the standard model, the same as renting any other piece of infrastructure your business runs on. We go over the exact numbers for your setup on the call.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
          { type: "Heading", props: { id: "faqs-q5", text: "5. What do you need from me to get started?", fontSize: 24, align: "left", spaceAbove: 40, spaceBelow: 8 } },
          { type: "Text", props: { id: "faqs-a5", text: "A quick intake call. You tell me how you run today — how leads come in, what you use, how you sell — and I'll show you exactly where the AI employees plug in. From there I do the building. You stay in control the whole way; I just handle the wiring.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
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
          { type: "PhoneLink", props: { id: "faqs-cta-phone", label: "Or call me directly: (210) 851-4906", tel: "+12108514906" } },
        ],
      },
    },
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
      { type: "Text", props: { id: "hero-eyebrow", text: "You already know you need AI.", align: "center", color: "#22c55e" } },
      { type: "Text", props: { id: "hero-eyebrow2", text: "We give you the easy button!", align: "center", color: "#22c55e" } },
      { type: "Heading", props: { id: "hero-h1", text: "We install AI employees where they make the most impact — finding customers, closing them, and retaining them — installed right on top of the software you already use.", fontSize: 48, align: "center", color: "#ffffff" } },
      { type: "Video", props: { id: "hero-video", src: "", caption: "2-minute walkthrough — coming" } },
      { type: "Button", props: { id: "hero-cta", title: "See It Run on Your Business", subtitle: "Your leads, your follow-up, and the work piling up behind you — all handled, done for you. The only question left is how fast you can get it running.", href: "/#your-team" } },
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

    // ── leaks — open on THEIR money (the WIIFM hook) ─────────────────────────────────────────
    { type: "Section", props: { id: "leaks", background: "#ffffff", content: [
      { type: "Text", props: { id: "leaks-eyebrow", text: "Start with what it's costing you today", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "leaks-h2", text: "Right now, money is leaking out of your business in three places — and you already know where.", align: "left" } },
      { type: "Text", props: { id: "leaks-body", text: "You don't need a chart to find them. The lead that came in last night, while you were closing up or asleep — nobody answered it fast enough, so it went somewhere that did. The folks who asked for a price months ago, went quiet, and are still sitting in your system — nobody ever circled back, so that money just sits there cold. And the customers you already won, the easiest sale you'll ever make, slip out the back because nobody had time to stay in touch. None of this is a you problem. It's a hands problem — there were never enough hours, or enough people, to catch all of it. That's exactly the hole we plug.", align: "left" } },
    ] } },

    // ── the-shift — what changed in 24 months (couldn't afford / couldn't be consistent) ─────
    { type: "Section", props: { id: "the-shift", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "the-shift-eyebrow", text: "What's different now", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "the-shift-h2", text: "For 40 years, fixing this meant hiring people. Two walls always stopped you.", align: "left" } },
      { type: "Text", props: { id: "the-shift-p1", text: "To catch every lead, work every old quote, and stay on every customer, you needed bodies — a front desk, a follow-up person, a closer, someone to call the old list. And right there, two walls went up that never came down. First, the money: good people are expensive, and stacking up enough of them to cover all of it was never going to pencil out for a business your size. Second, even when you found someone, you couldn't make them consistent. People have bad days. They forget. They get busy. They quit right when they finally got good. You can have cheap, or you can have good, or you can have someone who shows up the exact same way every single time — but you could never get all three in one person. Nobody can.", align: "left" } },
      { type: "Text", props: { id: "the-shift-p2", text: "About two years ago, that math broke — in your favor. The technology crossed a line it had never crossed before. For the first time, you can put one trained worker on all of that work who costs a fraction of the people, never has a bad day, and does it the exact same way at 2 a.m. on a Sunday as 10 a.m. on a Monday. Cheap, good, and consistent — the three things that never fit in one hire — finally fit in one. That's the whole reason this company exists. The window just opened, and the owners moving now are the ones pulling ahead.", align: "left" } },
    ] } },

    // ── the-bolt-on — not a new system; your software is the good guy; you learn nothing ──────
    { type: "Section", props: { id: "the-bolt-on", background: "#ffffff", content: [
      { type: "Text", props: { id: "bolt-on-eyebrow", text: "How it fits — nothing gets ripped out", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "bolt-on-h2", text: "It bolts on top of the software you already run. You don't learn a thing.", align: "left" } },
      { type: "Text", props: { id: "bolt-on-p1", text: "Here's the part that trips people up, so let's clear it now. This is not a new system you have to switch to. You're not throwing out your software, retraining your team, or learning anything new. The software you use today — the place that holds your contacts, your calendar, your customer history — is good at what it does: it remembers everything. What it can't do is act. It sits there and waits for a person to log in and do the work. That's not a knock on it; that's just what software has always been. What we add is the worker your software has been waiting for — one that lives right on top of it, reads what's already there, and actually does the follow-up, the answering, the booking. We give your good system a set of hands.", align: "left" } },
      { type: "Text", props: { id: "bolt-on-p2", text: "And you don't lift a finger to make it happen. We build it, we train it on how you actually do business — your prices, your offers, the questions you hear all day, the way you like a customer treated — and we run it. You stay the boss. You set the rules, you watch every conversation and every booking happen, and you can change anything any time. That's the difference between us and everyone else selling AI: they hand you a login and a manual and wish you luck. We hand you the finished worker, already on the job.", align: "left" } },
    ] } },

    // ── your-team — THE CENTERPIECE: Chloe in the lineup + the org chart ─────────────────────
    { type: "Section", props: { id: "your-team", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "your-team-eyebrow", text: "Meet your new hire", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "your-team-h2", text: "This is Chloe — and here's what your team looks like with her on it.", align: "left" } },
      { type: "Text", props: { id: "your-team-body", text: "Pull up your staff list and there she is, right in the lineup next to the people you already pay — a name, a seat, a job, same as everyone else. But look closer at the roster below and you'll notice something. One name shows up in six different seats. That's not a typo. That's the whole point. Chloe doesn't fill one chair — she fills six, the six jobs you could never afford to staff all at once. Take a good look, then we'll walk through each seat and show you exactly how one hire covers all of it.", align: "left" } },
      { type: "Image", props: { id: "your-team-portrait", ...IMAGE_DEFAULTS, src: "https://ddhmhtqvn5lepkpr.public.blob.vercel-storage.com/7af0a5ce-12014A0CD94E4B0EA5A3D061753578BA.png", alt: "Chloe — your AI employee", maxWidth: 360 } },
      { type: "Spacer", props: { id: "your-team-gap", height: 32 } },
      { type: "StaffRoster", props: { id: "your-team-roster", businessName: "Acme Healthcare", rows: [
        { name: "Dr. Alan Pierce", email: "dr.pierce@acmehealthcare.com", role: "Physician / Owner", isAI: false },
        { name: "Renee Salas", email: "renee@acmehealthcare.com", role: "Office Manager", isAI: false },
        { name: "Nina Alvarez", email: "nina@acmehealthcare.com", role: "Nurse", isAI: false },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Finding — Speed-to-Lead", isAI: true },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Closing — Booking Agent", isAI: true },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Retaining — Customer Success", isAI: true },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Database Reactivation", isAI: true },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Front Desk & Phones — 24/7", isAI: true },
        { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Cross-Sell", isAI: true },
      ] } },
    ] } },

    // ── why-six — believability: she's software, not a person ────────────────────────────────
    { type: "Section", props: { id: "why-six", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "why-six-eyebrow", text: "How one hire holds six jobs", align: "left", color: "#93c5fd" } },
      { type: "Heading", props: { id: "why-six-h2", text: "How can one worker do six jobs? Because she isn't a person.", align: "left", color: "#ffffff" } },
      { type: "Text", props: { id: "why-six-body", text: "This is the question everybody asks, so let's answer it straight. A person can only do one job at a time, and only while they're awake. That's the whole reason you could never staff all six seats — you'd need six paychecks, six schedules, six people having six good days in a row. Chloe isn't a person. She's software, built for this work. She's never tired, she's never full, she's never off the clock. The lead that comes in at 9 on a Saturday gets answered while she's also circling back on an old quote and checking in on a customer from last month. None of it waits in a pile. And she's not winging it — we train her on your business before she ever says a word, so she shows up her first hour already knowing your offers, your prices, the objections you hear all day, and exactly how you handle a customer. Think of her less like one employee and more like a whole shift that never clocks out.", align: "left", color: "#ffffff" } },
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

    // ── the six seats, walked one at a time (found money first) ──────────────────────────────
    { type: "Section", props: { id: "seat-reactivation", background: "#ffffff", content: [
      { type: "Text", props: { id: "seat-react-eyebrow", text: "The six seats, one at a time", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-react-h2", text: "Seat 1 — She goes back for the money you already gave up on.", align: "left" } },
      { type: "Text", props: { id: "seat-react-body", text: "Every business is sitting on a pile of old leads — people who called, asked for a price, went quiet, and got forgotten because there was always something louder that day. That's money you already paid to get, sitting there cold. Chloe goes back for all of it, on her own, without being told. She lives in your system, so she already knows who never booked. She reaches back out, picks the conversation up where it stopped, and books the ones who are ready. No new ad spend. No new leads. Just the ones you already had, finally worked. For most owners this is the very first thing she does — and it usually pays for her before anything else even starts.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "seat-speed", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "seat-speed-eyebrow", text: "Seat 2 — Finding", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-speed-h2", text: "She answers the second a new lead comes in — day or night.", align: "left" } },
      { type: "Text", props: { id: "seat-speed-body", text: "A fresh lead is only hot for a few minutes. Wait an hour and they've already called the next name on the list. The problem was never that you didn't care — it's that you can't be by the phone at 9 p.m. on a Saturday, and neither can your front desk. Chloe can. The moment a lead lands — from your website, your ads, a missed call, anywhere — she answers in seconds, in your voice, with your prices and your offer. She doesn't just say 'thanks, we'll be in touch.' She starts the real conversation and works it toward a booking. The leads you're already paying for finally get caught the instant they show up.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "seat-closing", background: "#ffffff", content: [
      { type: "Text", props: { id: "seat-closing-eyebrow", text: "Seat 3 — Closing", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-closing-h2", text: "She handles the objections and books it onto your calendar herself.", align: "left" } },
      { type: "Text", props: { id: "seat-closing-body", text: "Answering fast is only half of it. Most leads don't say yes right away — they ask the price, they say they need to think, they want to check with someone first. That's where deals usually die, because handling that takes a real closer, and a real closer is the hardest person on earth to hire and keep. Chloe handles it. She answers the price question, works through the hesitation, and keeps the conversation going instead of folding the second she hears 'maybe.' And she knows exactly where her job ends — the questions that need you, a real medical or legal call, anything that isn't hers — she hands off cleanly instead of guessing. When she gets the yes, she doesn't drop it on your desk. She books it straight onto your calendar. You don't see the work. You see a new name on the schedule.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "seat-retaining", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "seat-retain-eyebrow", text: "Seat 4 — Retaining", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-retain-h2", text: "She keeps the customers you already won from drifting away.", align: "left" } },
      { type: "Text", props: { id: "seat-retain-body", text: "The most expensive customer to get is a new one. The cheapest money in your business is the customer who already bought from you once — but only if you stay in touch, and staying in touch is the first thing that falls off the plate when you're busy. Chloe doesn't get busy. She checks in, reminds them when it's time to come back, and catches the ones who are about to drift before they're gone for good. The customers you worked so hard to win stop quietly slipping out the back door.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "seat-phones", background: "#ffffff", content: [
      { type: "Text", props: { id: "seat-phones-eyebrow", text: "Seat 5 — Call Routing, 24/7", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-phones-h2", text: "She picks up the phone, too — every hour of every day.", align: "left" } },
      { type: "Text", props: { id: "seat-phones-body", text: "When a call comes in and the desk is slammed, or it's after hours, or it's a Sunday — that call used to go to voicemail and just sit there. Most people don't leave a message; they call the next place. Chloe answers. She handles the basics — your hours, your pricing, what you offer, scheduling — and when a call really needs a human, she flags it for you instead of letting it vanish. You stop bleeding the leads that only ever called once.", align: "left" } },
    ] } },
    { type: "Section", props: { id: "seat-crosssell", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "seat-cross-eyebrow", text: "Seat 6 — Cross-Sell", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "seat-cross-h2", text: "She sells the next thing to the people who already love you.", align: "left" } },
      { type: "Text", props: { id: "seat-cross-body", text: "Your easiest sale is the customer who already said yes once. They know you, they trust you, and the next thing they'd buy from you is usually sitting right there — but nobody ever brings it up, because everybody's busy keeping the lights on. Chloe brings it up. She reaches out, mentions the thing that fits, handles the back-and-forth, and books it. You look at the schedule and the names are already there. This is found money stacked on top of found money.", align: "left" } },
    ] } },

    // ── payroll — the realization (no price; that's the call) ────────────────────────────────
    { type: "Section", props: { id: "payroll", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "payroll-eyebrow", text: "Now add it up", align: "center", color: "#93c5fd" } },
      { type: "Heading", props: { id: "payroll-h2", text: "Six seats. One hire.", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "payroll-body", text: "Step back and look at what you just read. To cover those six seats with people, you'd be hiring a front desk, a follow-up person, a closer, someone to work the old list, someone to answer the phones around the clock, and someone to bring in the repeat business. Six jobs. Even if you could find them all, even if they all showed up every day, that's a payroll most owners your size will never carry — well over a couple hundred thousand dollars a year, plus the managing, the turnover, and the headaches. Chloe holds all six seats, around the clock, and never calls in sick, never quits on you, and never asks for a raise. What that costs is a conversation we have on the call — but you already know it isn't six salaries. That's the part that makes owners sit up.", align: "center", color: "#ffffff" } },
    ] } },

    // ── 8. tech-enabled ──────────────────────────────────────────────────────────────────────
    { type: "Section", props: { id: "tech-enabled", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "tech-enabled-eyebrow", text: "The part most owners don't see coming", align: "center", color: "#93c5fd" } },
      { type: "Heading", props: { id: "tech-enabled-h2", text: "And the day you sell, it's worth more — even if you only ever sell once.", align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "tech-enabled-body", text: "Here's one more piece most owners don't see coming. A business that only runs because you're standing in it is hard to sell — whoever buys it is really just buying your job. A business that runs on a system that keeps working after you walk away is worth a great deal more, because they're buying something that runs without you in the room. Buyers pay a premium for that, and it's exactly what we build into yours: a sales-and-follow-up engine that books customers whether you're there or not. You get the growth now, and a bigger check the day you sell — even if you only ever sell once.", align: "center", color: "#ffffff" } },
    ] } },

    // ── apply — the ONE button, selective, said nice (pricing happens on the call) ───────────
    { type: "Section", props: { id: "apply", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "apply-eyebrow", text: "If you want in", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "apply-h2", text: "We're not for everybody — and that's on purpose.", align: "center" } },
      { type: "Text", props: { id: "apply-body", text: "We don't bolt this onto every business that asks. We take on a limited number of owners at a time, because we build and run each one by hand — and we'd rather do a few right than a lot halfway. So the next step isn't a sales pitch. It's an application. Tell us about your business. If it's a fit, we'll get on a call, show you exactly where your first hire plugs in and what it would look like on day one, and talk about what it costs. If it's not, we'll tell you that straight too. No pressure, no pitch deck — just a real conversation between people who run businesses.", align: "center" } },
      { type: "Button", props: { id: "apply-btn", title: "Apply to work with me", subtitle: "Tell us about your business. If it's a fit, we'll talk.", href: "/apply" } },
      { type: "PhoneLink", props: { id: "apply-phone", label: "Or call me directly: (210) 851-4906", tel: "+12108514906" } },
    ] } },
  ],
};

const APPLY_SEED: Data = {
  root: {},
  content: [
    { type: "Text", props: { id: "apply-eyebrow", text: "Apply to work with me", align: "center", color: "#2563eb" } },
    { type: "Heading", props: { id: "apply-h1", text: "We're not for everybody — and that's on purpose.", level: "h1", align: "center" } },
    { type: "Text", props: { id: "apply-sub", text: "A few quick questions so we can see if we can actually help you. Takes under two minutes — then pick a time and we'll talk. No pitch, just a real conversation.", align: "center" } },

    { type: "FormStep", props: { id: "step-you", title: "First, who are you?", content: [
      { type: "FormQuestion", props: { id: "q-first", label: "First name", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-last", label: "Last name", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-email", label: "Email", questionType: "email", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-phone", label: "Cell phone", questionType: "phone", options: [], required: true } },
    ] } },

    { type: "FormStep", props: { id: "step-biz", title: "Tell us about your business.", content: [
      { type: "FormQuestion", props: { id: "q-industry", label: "What industry are you in / what do you do?", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-growth", label: "Where's your head at with growth right now?", questionType: "choice", required: true, options: [
        { text: "I need more customers — now" },
        { text: "Growing, but it's chaos" },
        { text: "Maxed out — can't take on more work" },
        { text: "Just exploring" },
      ] } },
    ] } },

    { type: "FormStep", props: { id: "step-revenue", title: "Where are you — and where do you want to be?", content: [
      { type: "FormQuestion", props: { id: "q-rev-now", label: "Roughly what's the business doing in revenue now?", questionType: "choice", required: true, options: [
        { text: "Under $10k / mo" },
        { text: "$10k – $25k / mo" },
        { text: "$25k – $50k / mo" },
        { text: "$50k – $100k / mo" },
        { text: "$100k+ / mo" },
      ] } },
      { type: "FormQuestion", props: { id: "q-rev-goal", label: "Where do you want it in the next 12 months?", questionType: "choice", required: true, options: [
        { text: "Under $10k / mo" },
        { text: "$10k – $25k / mo" },
        { text: "$25k – $50k / mo" },
        { text: "$50k – $100k / mo" },
        { text: "$100k+ / mo" },
      ] } },
    ] } },

    { type: "FormStep", props: { id: "step-emergency", title: "One last question — the important one.", content: [
      { type: "FormQuestion", props: { id: "q-emergency", label: "If a health emergency kept you out of work for 4–6 weeks, would your business thrive — or be in serious jeopardy?", questionType: "choice", required: true, options: [
        { text: "It'd thrive without me" },
        { text: "It'd hold steady for a while" },
        { text: "It'd be in serious jeopardy" },
      ] } },
    ] } },

    // Editable copy blocks — the wizard renders these by id. Edit or DELETE any of them at
    // /edit/apply, same as everything else; clearing the text hides that piece on the live page.
    { type: "Text", props: { id: "apply-disclaimer", text: "We only use this to see if we're a fit — no spam, ever.", align: "center", color: "#4b5563" } },
    { type: "Text", props: { id: "apply-booking-eyebrow", text: "Got it", align: "center", color: "#22c55e" } },
    { type: "Heading", props: { id: "apply-booking-h", text: "Last step — grab a time for your call.", level: "h2", align: "center" } },
    { type: "Text", props: { id: "apply-booking-sub", text: "Pick a slot that works and we'll talk through exactly where AI employees plug into your business. No pitch — a real conversation about whether we can help.", align: "center" } },
  ],
};

// Podcast-guest intake — same wizard machinery as APPLY_SEED, guest questions + copy. Rendered by
// app/guest/page.tsx (guest-prefixed ids) via the shared ApplyForm. Steven edits all of this at
// /edit/guest, including the booking-calendar link (guest-booking-url block below).
const GUEST_SEED: Data = {
  root: {},
  content: [
    { type: "Text", props: { id: "guest-eyebrow", text: "Come on the show", align: "center", color: "#2563eb" } },
    { type: "Heading", props: { id: "guest-h1", text: "Let's get you in front of the mic.", level: "h1", align: "center" } },
    { type: "Text", props: { id: "guest-sub", text: "A few quick questions so we can make it a great conversation — takes under two minutes, then pick a time to record. One operator to another. No pitch on the mic.", align: "center" } },

    { type: "FormStep", props: { id: "guest-step-you", title: "First, who are you?", content: [
      { type: "FormQuestion", props: { id: "q-first", label: "First name", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-last", label: "Last name", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-email", label: "Email", questionType: "email", options: [], required: true } },
      { type: "FormQuestion", props: { id: "q-phone", label: "Cell phone", questionType: "phone", options: [], required: false } },
    ] } },

    { type: "FormStep", props: { id: "guest-step-work", title: "What do you do?", content: [
      { type: "FormQuestion", props: { id: "qg-what", label: "Company / what you're known for", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "qg-website", label: "Website (if you have one)", questionType: "text", options: [], required: false } },
      { type: "FormQuestion", props: { id: "qg-show", label: "Do you host your own podcast / show? If so, which one?", questionType: "text", options: [], required: false } },
      { type: "FormQuestion", props: { id: "qg-social", label: "Best link to see your work (LinkedIn, IG, YouTube…)", questionType: "text", options: [], required: false } },
    ] } },

    { type: "FormStep", props: { id: "guest-step-episode", title: "What would you bring to the episode?", content: [
      { type: "FormQuestion", props: { id: "qg-topic", label: "The story or topic you'd want to get into", questionType: "text", options: [], required: true } },
      { type: "FormQuestion", props: { id: "qg-fit", label: "Anything else that makes you a great fit for this show?", questionType: "text", options: [], required: false } },
    ] } },

    // Editable copy blocks (edit or DELETE any at /edit/guest, same as everywhere).
    { type: "Text", props: { id: "guest-disclaimer", text: "We only use this to prep a great conversation — no spam, ever.", align: "center", color: "#4b5563" } },
    { type: "Text", props: { id: "guest-booking-eyebrow", text: "Got it", align: "center", color: "#22c55e" } },
    { type: "Heading", props: { id: "guest-booking-h", text: "Last step — grab a time to record.", level: "h2", align: "center" } },
    { type: "Text", props: { id: "guest-booking-sub", text: "Pick a slot that works and we'll get you on the calendar. Remote, relaxed, and we do all the lifting on our end.", align: "center" } },
    // The booking calendar. Paste your GUEST appointment-schedule link here (must start with https://).
    // Until it's a real URL, guests see a friendly 'we'll reach out' note. This block never shows on the live page.
    { type: "Text", props: { id: "guest-booking-url", text: "Paste your guest booking calendar link here (starts with https://). This text does not appear on the live form.", align: "center", color: "#4b5563" } },
  ],
};

// ── /websites — the $795 + $25/mo website offer ─────────────────────────────────────────────
// The whole page as builder blocks, so Steven owns every word without touching code. Built from
// the GENERIC kit (Section / Heading / Text / Columns / Card / CheckList / PriceBox / LeadForm)
// rather than one-off page components — the same blocks compose the next page.
//
// Its header and footer are their OWN builder pages (websites-nav / websites-footer) instead of
// the site-wide ones, because this page must not carry the global menu: the DIY link goes to the
// free Skool community that teaches exactly what this page sells.
const WEBSITES_NAV_SEED: Data = {
  root: {},
  content: [
    {
      type: "SiteHeader",
      props: {
        id: "websites-header",
        ...NAV_DEFAULTS,
        // Clicking the logo keeps him on THIS offer — not over on the AI-implementation site.
        brandHref: "/websites",
        tagline: "",
        // The phone number is the ONLY link — no About, no Podcast, no DIY. No escape hatches.
        links: [
          { label: "(210) 851-4906", target: "tel:+12108514906", fontSize: 15, color: "#334155", newTab: false },
        ],
        ctaLabel: "Get Started",
        ctaHref: "#get-started",
        ctaNewTab: false,
      },
    },
  ],
};

const WEBSITES_FOOTER_SEED: Data = {
  root: {},
  content: [
    {
      type: "SiteFooter",
      props: {
        id: "websites-footer",
        ...FOOTER_DEFAULTS,
        blurb: "",
        links: [], // same reason as the header
        copyright: "Steven James Consulting",
      },
    },
  ],
};

const WEBSITES_SEED: Data = {
  root: {},
  content: [
    // Hero
    {
      type: "Section",
      props: {
        id: "websites-hero",
        background: "#f3f4f6",
        maxWidth: "48rem",
        paddingTop: 56,
        paddingBottom: 64,
        content: [
          { type: "Text", props: { id: "w-eyebrow", text: "WEBSITES FOR SMALL BUSINESSES", align: "center", color: "#2563eb", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
          { type: "Heading", props: { id: "w-h1", text: "A real website for your business — live in three days.", fontSize: 48, align: "center", spaceBelow: 16 } },
          { type: "Text", props: { id: "w-sub1", text: "Your work, your reviews, your phone number. Somebody fills out the form and it hits your phone before they've closed the browser.", align: "center", color: "#2563eb", fontSize: 22, spaceAbove: 4, spaceBelow: 8 } },
          { type: "Text", props: { id: "w-sub2", text: "You do good work. People just can't find you. I build the site, I put it online, and I keep it running — you never touch any of it.", align: "center", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
          // ⚠️ NO PRICE. Price comes up on the discovery call. This seed renders whenever nothing
          // is published, so a number left here would put the price back on the live page.
          { type: "Button", props: { id: "w-hero-cta", title: "Get My Website Started", subtitle: "Built and live in three days.", href: "#get-started" } },
        ],
      },
    },

    // What you get
    {
      type: "Section",
      props: {
        id: "websites-get",
        background: "#ffffff",
        maxWidth: "48rem",
        paddingTop: 80,
        paddingBottom: 80,
        content: [
          { type: "Heading", props: { id: "w-get-h2", text: "What you get", fontSize: 36, align: "center", spaceBelow: 40 } },
          {
            type: "CheckList",
            props: {
              id: "w-get-list",
              dotColor: "#22c55e",
              rows: [
                { heading: "A real website", body: "Three to five pages built around the work you actually do — not a template with your name dropped in the corner." },
                { heading: "Your reviews on it", body: "The stars you already earned, right where somebody deciding whether to call you can see them." },
                { heading: "A contact form that texts you", body: "Every message lands on your phone with their name and number attached. Hit reply and you're talking to them. Your phone is the whole system." },
                { heading: "You never touch it", body: "I build it, I host it, and I make the changes when your business changes. You go back to work." },
              ],
            },
          },
        ],
      },
    },

    // Getting found — mobile / SEO / AEO
    {
      type: "Section",
      props: {
        id: "websites-found",
        background: "#1e3a6e",
        maxWidth: "64rem",
        paddingTop: 80,
        paddingBottom: 80,
        content: [
          { type: "Text", props: { id: "w-found-eyebrow", text: "GETTING FOUND", align: "center", color: "#ffffff", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
          { type: "Heading", props: { id: "w-found-h2", text: "A website nobody finds is a business card in a drawer.", fontSize: 36, align: "center", color: "#ffffff", spaceBelow: 16 } },
          { type: "Text", props: { id: "w-found-lede", text: "There are three ways a customer looks you up today. Most websites are built for one of them. Yours is built for all three.", align: "center", color: "#ffffff", fontSize: 18, spaceAbove: 0, spaceBelow: 40 } },
          {
            type: "Columns",
            props: {
              id: "w-found-cols",
              columns: 3,
              gap: 24,
              col1: [{ type: "Card", props: { id: "w-card-phone", badge: "", eyebrow: "ON THEIR PHONE", heading: "Because that's what's in their hand", body: "Almost everybody checking you out is standing in a driveway or a kitchen holding a phone. Your site is built for that screen first — big type, big buttons, your number one thumb away. It looks right on a computer too." } }],
              col2: [{ type: "Card", props: { id: "w-card-google", badge: "", eyebrow: "ON GOOGLE", heading: "So you show up when they search", body: "Built the way Google wants it, so Google understands who you are, what you do, and the towns you work in. When somebody nearby searches for your trade, you're in the running instead of invisible. This is the part people call SEO." } }],
              col3: [{ type: "Card", props: { id: "w-card-ai", badge: "", eyebrow: "WHEN THEY ASK AI", heading: "The one nobody else is doing yet", body: "People don't only search anymore — they ask. They type “who's the best guy near me for this” into ChatGPT and take the answer they get back. Your site is written so the AI can read it, understand your business, and hand your name over. Almost no small-business website is built this way yet. Yours is." } }],
            },
          },
          { type: "Text", props: { id: "w-found-close", text: "That third one didn't exist a couple of years ago. It does now, it's where your customers are headed, and almost nobody building websites at this price has caught up to it yet.", align: "center", color: "#ffffff", fontSize: 18, spaceAbove: 40, spaceBelow: 0 } },
        ],
      },
    },

    // How it works
    {
      type: "Section",
      props: {
        id: "websites-how",
        background: "#f3f4f6",
        maxWidth: "64rem",
        paddingTop: 80,
        paddingBottom: 80,
        content: [
          { type: "Heading", props: { id: "w-how-h2", text: "How it works", fontSize: 36, align: "center", spaceBelow: 12 } },
          { type: "Text", props: { id: "w-how-lede", text: "Three days, start to finish. Ten minutes of that is yours.", align: "center", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 40 } },
          {
            type: "Columns",
            props: {
              id: "w-how-cols",
              columns: 3,
              gap: 24,
              col1: [{ type: "Card", props: { id: "w-step-1", badge: "1", eyebrow: "", heading: "You tell me about your business", body: "Ten minutes on the phone. What you do, where you work, and your best photos. That's your whole job." } }],
              col2: [{ type: "Card", props: { id: "w-step-2", badge: "2", eyebrow: "", heading: "I build it", body: "Three days. You look it over before anybody else sees it and tell me what to change." } }],
              col3: [{ type: "Card", props: { id: "w-step-3", badge: "3", eyebrow: "", heading: "It goes live", body: "Your name, your domain, your phone number. From then on the leads come to you." } }],
            },
          },
        ],
      },
    },

    // Who this is for
    {
      type: "Section",
      props: {
        id: "websites-who",
        background: "#ffffff",
        maxWidth: "48rem",
        paddingTop: 80,
        paddingBottom: 80,
        content: [
          { type: "Heading", props: { id: "w-who-h2", text: "Who this is for", fontSize: 36, align: "left", spaceBelow: 24 } },
          { type: "Text", props: { id: "w-who-p1", text: "You're good at what you do and nobody can find you online. Maybe you've got no website at all. Maybe you've got one from years back that you can't log into and that looks broken on a phone.", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 16 } },
          { type: "Text", props: { id: "w-who-p2", text: "<b>Either way, people are checking you out before they call — and right now there's nothing there to check.</b>", align: "left", fontSize: 18, spaceAbove: 0, spaceBelow: 16 } },
          { type: "Text", props: { id: "w-who-p3", text: "This isn't for you if you already have a site that works, or if what you want is a full marketing machine with automation and a CRM behind it. That's a different conversation and I'm happy to have it. This is a real website, done right, at a fair price.", align: "left", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 0 } },
        ],
      },
    },

    // ⚠️ NO PRICE SECTION — deliberate, matches the live page. Price comes up on the discovery
    // call, so the page sells the outcome and the number happens in conversation. There used to be
    // a "What it costs" band with a $795/$25 PriceBox here; Steven pulled it. This seed renders
    // whenever nothing is published, so putting it back here puts the price back on the live site.
    // The PriceBox block still exists and is still usable — it just isn't on this page.

    // CTA — the anchor every button on the page points at
    {
      type: "Section",
      props: {
        id: "get-started",
        background: "#ffffff",
        maxWidth: "56rem",
        paddingTop: 80,
        paddingBottom: 80,
        content: [
          { type: "Heading", props: { id: "w-cta-h2", text: "Let's get you online.", fontSize: 36, align: "center", spaceBelow: 16 } },
          { type: "Text", props: { id: "w-cta-lede", text: "Four boxes and I'll call you today. Ten minutes on the phone and your site is in front of you in three days.", align: "center", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 32 } },
          {
            type: "LeadForm",
            props: {
              id: "w-cta-form",
              source: "/websites — $795 website offer",
              fields: [
                { label: "Your name", inputType: "text" },
                { label: "Business name", inputType: "text" },
                { label: "Best phone number", inputType: "tel" },
                { label: "What kind of work do you do?", inputType: "text" },
              ],
              buttonLabel: "Send Me My Website",
              note: "No obligation, and nothing gets built until you say so. Rather just talk? Call (210) 851-4906.",
              successHeading: "Got it. I'll call you today.",
              successBody: "Ten minutes on the phone is all I need. If you'd rather not wait, call me straight out at (210) 851-4906.",
            },
          },
        ],
      },
    },
  ],
};

// ── /lucky-dog-wash-house — the first client demo, ported from SiteDrop ───────────────────────────────────────────────────────
//
// A SiteDrop-generated hero (Lucky Dog Wash House, San Antonio) rebuilt entirely from OUR blocks:
// Section → Columns → Heading / Text / Button / HeroImage. Nothing here is bespoke markup.
//
// THE POINT: their builder makes a beautiful page you can only change by arguing with a chatbot
// that meters you per attempt. The same design assembled from these blocks has a −/+ control on
// every padding, size, and colour. That is the whole reason to pull a design over instead of
// renting the tool that made it.
//
// ⚠️ The photo still points at THEIR Supabase. Fine for a scratch page; download it before this
// look goes anywhere near a client, or their server going away takes the client's site with it.
const LAB_SEED: Data = {
  root: { props: { title: "Lab" } },
  content: [
    // Header sits INSIDE this page rather than in the site-wide `nav` document, so the whole
    // port renders top-to-bottom in one editor. On a real client site it moves out to its own
    // nav document and becomes global — edit the phone number once, every page follows.
    {
      type: "SiteHeader",
      props: {
        id: "lab-nav",
        brandName: "Lucky Dog Wash House",
        brandHref: "#lab-hero",
        brandSize: 20,
        tagline: "",
        taglineColor: "#ffffff",
        taglineSize: 14,
        links: [
          { label: "Services", target: "#lab-services", fontSize: 15, color: "#334155", newTab: false },
          { label: "About Us", target: "#lab-about", fontSize: 15, color: "#334155", newTab: false },
          { label: "How It Works", target: "#lab-process", fontSize: 15, color: "#334155", newTab: false },
          { label: "Reviews", target: "#lab-testimonials", fontSize: 15, color: "#334155", newTab: false },
        ],
        ctaLabel: "Book Appointment",
        ctaHref: "#lab-contact",
        ctaNewTab: false,
        // Lucky Dog's own colours, not SJC's. This is the whole point of un-welding them.
        background: "#ffffff",
        foreground: "#334155",
        showLogo: false,
        ctaColor: "#0ea5e9",
        brandIcon: "bone",
        brandIconColor: "#0ea5e9",
      },
    },
    {
      type: "Section",
      props: {
        id: "lab-hero",
        background: "#f8fafc",
        maxWidth: "80rem",
        paddingTop: 72,
        paddingBottom: 96,
        decor: "#0ea5e9",
        content: [
          {
            type: "Columns",
            props: {
              id: "lab-hero-cols",
              columns: 2,
              gap: 48,
              col1: [
                {
                  type: "Text",
                  props: {
                    id: "lab-hero-rating",
                    text: "<span style=\"color:#f59e0b\">★★★★★</span> <strong>4.7 Rating</strong> <span style=\"opacity:.45\">|</span> <span style=\"color:#0ea5e9;font-weight:600\">210+ Google Reviews</span>",
                    align: "left", color: "#334155", fontSize: 15, spaceAbove: 0, spaceBelow: 24,
                    pill: "#ffffff", pillBorder: "#e5e7eb", icon: "", iconColor: "",
                  },
                },
                {
                  type: "Heading",
                  props: {
                    id: "lab-hero-h1",
                    text: "San Antonio's Premier Pet Wash & Grooming",
                    fontSize: 60, align: "left", color: "#334155",
                    spaceAbove: 0, spaceBelow: 20,
                    underline: "#f59e0b",
                    highlight: "Premier Pet Wash", highlightColor: "#0ea5e9",
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: "lab-hero-sub",
                    text: "Experience stress-free, professional grooming and easy self-serve wash stations. Clean facilities, friendly staff, and happy tails guaranteed at Lucky Dog Wash House.",
                    align: "left", color: "#4b5563", fontSize: 19, spaceAbove: 0, spaceBelow: 28,
                  },
                },
                {
                  type: "Button",
                  props: {
                    id: "lab-hero-cta",
                    title: "Book an Appointment",
                    subtitle: "",
                    href: "#contact",
                  },
                },
                {
                  type: "Button",
                  props: {
                    id: "lab-hero-phone",
                    title: "(210) 474-6252", subtitle: "", href: "tel:+12104746252",
                    icon: "phone", variant: "outline", shape: "pill",
                    color: "#10b981", align: "left", fullWidth: false,
                  },
                },
                {
                  type: "Text",
                  props: {
                    id: "lab-hero-addr",
                    text: "819 New Laredo Hwy, San Antonio, TX 78211",
                    align: "left", color: "#334155", fontSize: 15, spaceAbove: 28, spaceBelow: 0,
                    pill: "#ffffff", pillBorder: "#e5e7eb", icon: "map-pin", iconColor: "#f59e0b",
                  },
                },
              ],
              col2: [
                {
                  type: "HeroImage",
                  props: {
                    id: "lab-hero-photo",
                    src: "https://zgnpmogdjnnhpwewavnr.supabase.co/storage/v1/object/public/project-images/bcda9a64-6721-499a-bdaa-5d6a9977abe9/98f8cb82-9922-416a-b87a-8b39fc36d057.png",
                    alt: "Happy wet Golden Retriever getting a warm bubble bath with suds at a professional dog grooming salon",
                    height: 560,
                    tilt: 2,
                    glow: "#0ea5e9",
                    frame: "#ffffff",
                    radius: 40,
                    badgeTitle: "Premium Spa Add-ons",
                    badgeBody: "Oatmeal baths, nail trims & more",
                    pillText: "Open Today",
                    pillColor: "#10b981",
                    spaceAbove: 0,
                    spaceBelow: 0,
                  },
                },
              ],
              col3: [],
            },
          },
        ],
      },
    },

    // ── STATS BAR ────────────────────────────────────────────────────────────────────────────
    {
      type: "Section",
      props: {
        id: "lab-stats", background: "#ffffff", maxWidth: "80rem",
        paddingTop: 48, paddingBottom: 48, decor: "",
        content: [
          {
            type: "Columns",
            props: {
              id: "lab-stats-cols", columns: 3, gap: 32,
              col1: [
                { type: "Heading", props: { id: "lab-stat1-n", text: "210+", fontSize: 40, align: "center", color: "#0ea5e9", spaceAbove: 0, spaceBelow: 4, underline: "" } },
                { type: "Text", props: { id: "lab-stat1-l", text: "Happy Pups Served", align: "center", color: "#4b5563", fontSize: 16, spaceAbove: 0, spaceBelow: 0 } },
              ],
              col2: [
                { type: "Heading", props: { id: "lab-stat2-n", text: "4.7 Stars", fontSize: 40, align: "center", color: "#0ea5e9", spaceAbove: 0, spaceBelow: 4, underline: "" } },
                { type: "Text", props: { id: "lab-stat2-l", text: "Average Google Review", align: "center", color: "#4b5563", fontSize: 16, spaceAbove: 0, spaceBelow: 0 } },
              ],
              col3: [
                { type: "Heading", props: { id: "lab-stat3-n", text: "Top Rated", fontSize: 40, align: "center", color: "#0ea5e9", spaceAbove: 0, spaceBelow: 4, underline: "" } },
                { type: "Text", props: { id: "lab-stat3-l", text: "San Antonio Groomer", align: "center", color: "#4b5563", fontSize: 16, spaceAbove: 0, spaceBelow: 0 } },
              ],
            },
          },
        ],
      },
    },

    // ── SERVICES ─────────────────────────────────────────────────────────────────────────────
    {
      type: "Section",
      props: {
        id: "lab-services", background: "#f8fafc", maxWidth: "80rem",
        paddingTop: 80, paddingBottom: 80, decor: "",
        content: [
          { type: "Text", props: { id: "lab-svc-eyebrow", text: "OUR SERVICES", align: "center", color: "#0ea5e9", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
          { type: "Heading", props: { id: "lab-svc-h2", text: "Pampering Your Best Friend", fontSize: 44, align: "center", color: "#334155", spaceAbove: 0, spaceBelow: 12, underline: "" } },
          { type: "Text", props: { id: "lab-svc-sub", text: "From a quick rinse to a full spa day, we have the perfect service to make your dog look and feel amazing.", align: "center", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 40 } },
          {
            type: "Columns",
            props: {
              id: "lab-svc-cols", columns: 3, gap: 24,
              col1: [{ type: "Card", props: { id: "lab-svc1", badge: "", icon: "shower-head", iconColor: "#0ea5e9", eyebrow: "", heading: "Self-Serve Wash", body: "Our state-of-the-art wash bays have everything you need: premium shampoos, conditioners, and professional-grade dryers. You bring the dog, we handle the mess!" } }],
              col2: [{ type: "Card", props: { id: "lab-svc2", badge: "", icon: "scissors", iconColor: "#10b981", eyebrow: "", heading: "Full-Service Grooming", body: "Let our expert groomers take care of everything. Includes a bath, haircut, nail trim, and ear cleaning, all tailored to your dog's specific needs and breed." } }],
              col3: [{ type: "Card", props: { id: "lab-svc3", badge: "", icon: "sparkles", iconColor: "#f59e0b", eyebrow: "", heading: "Spa Add-Ons", body: "Treat your pup to something extra special. Choose from our menu of de-shedding treatments, teeth brushing, paw pad moisturizers, and more." } }],
            },
          },
        ],
      },
    },

    // ── ABOUT ────────────────────────────────────────────────────────────────────────────────
    {
      type: "Section",
      props: {
        id: "lab-about", background: "#ffffff", maxWidth: "80rem",
        paddingTop: 80, paddingBottom: 80, decor: "",
        content: [
          {
            type: "Columns",
            props: {
              id: "lab-about-cols", columns: 2, gap: 48,
              col1: [
                {
                  type: "HeroImage",
                  props: {
                    id: "lab-about-photo",
                    src: "https://zgnpmogdjnnhpwewavnr.supabase.co/storage/v1/object/public/project-images/bcda9a64-6721-499a-bdaa-5d6a9977abe9/9e8bd702-caf3-4337-8d30-2d4957a127b6.png",
                    alt: "Smiling female dog groomer in a blue apron gently hugging a clean happy Golden Retriever inside a bright modern pet salon",
                    height: 480, tilt: -2, glow: "#10b981", frame: "#ffffff", radius: 32,
                    badgeTitle: "", badgeBody: "", pillText: "", pillColor: "#10b981",
                    spaceAbove: 0, spaceBelow: 0,
                  },
                },
              ],
              col2: [
                { type: "Text", props: { id: "lab-about-eyebrow", text: "YOUR SAN ANTONIO PET OASIS", align: "left", color: "#0ea5e9", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
                { type: "Heading", props: { id: "lab-about-h2", text: "A Clean, Safe, and Stress-Free Haven", fontSize: 40, align: "left", color: "#334155", spaceAbove: 0, spaceBelow: 16, underline: "" } },
                { type: "Text", props: { id: "lab-about-body", text: "Located conveniently on New Laredo Hwy, Lucky Dog Wash House was founded with a simple mission: to provide a positive and comfortable grooming experience for every pet that walks through our doors. Our facility is meticulously cleaned, our equipment is top-of-the-line, and our staff are passionate animal lovers trained in gentle handling techniques.", align: "left", color: "#4b5563", fontSize: 17, spaceAbove: 0, spaceBelow: 24 } },
                {
                  type: "CheckList",
                  props: {
                    id: "lab-about-checks", dotColor: "#22c55e",
                    rows: [
                      { heading: "Impeccably clean and sanitized environment", body: "" },
                      { heading: "Premium, pet-safe grooming products", body: "" },
                      { heading: "Experienced and caring professional staff", body: "" },
                    ],
                  },
                },
                { type: "Button", props: { id: "lab-about-cta", title: "Book An Appointment", subtitle: "", href: "#lab-contact" } },
              ],
              col3: [],
            },
          },
        ],
      },
    },

    // ── HOW IT WORKS ─────────────────────────────────────────────────────────────────────────
    // The numbered steps use Card's `badge` field — the same 1/2/3 circle that started this
    // whole thread when Steven asked where its hardcoded blue lived.
    {
      type: "Section",
      props: {
        id: "lab-process", background: "#f8fafc", maxWidth: "80rem",
        paddingTop: 80, paddingBottom: 80, decor: "#f59e0b",
        content: [
          { type: "Text", props: { id: "lab-proc-eyebrow", text: "HOW IT WORKS", align: "center", color: "#0ea5e9", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
          { type: "Heading", props: { id: "lab-proc-h2", text: "A Breeze from Start to Finish", fontSize: 44, align: "center", color: "#334155", spaceAbove: 0, spaceBelow: 12, underline: "" } },
          { type: "Text", props: { id: "lab-proc-sub", text: "We've designed our process to be as simple and enjoyable as possible for both you and your furry friend.", align: "center", color: "#4b5563", fontSize: 18, spaceAbove: 0, spaceBelow: 40 } },
          {
            type: "Columns",
            props: {
              id: "lab-proc-cols", columns: 3, gap: 24,
              col1: [{ type: "Card", props: { id: "lab-proc1", badge: "1", badgeColor: "#f59e0b", badgePosition: "edge", icon: "calendar-check", iconColor: "#f59e0b", centered: true, eyebrow: "", heading: "Check-In & Consult", body: "Arrive for your appointment or walk in. We'll discuss your pet's needs and get them settled in." } }],
              col2: [{ type: "Card", props: { id: "lab-proc2", badge: "2", badgeColor: "#10b981", badgePosition: "edge", icon: "bath", iconColor: "#10b981", centered: true, eyebrow: "", heading: "Wash & Pamper", body: "Whether it's a self-wash or full grooming, your pup gets the 5-star treatment with our premium products." } }],
              col3: [{ type: "Card", props: { id: "lab-proc3", badge: "3", badgeColor: "#0ea5e9", badgePosition: "edge", icon: "wind", iconColor: "#0ea5e9", centered: true, eyebrow: "", heading: "Dry & Go Home Happy", body: "We'll get your dog fluffy and dry with our professional dryers. They'll leave looking, smelling, and feeling fantastic!" } }],
            },
          },
        ],
      },
    },

    // ── TESTIMONIALS ─────────────────────────────────────────────────────────────────────────
    {
      type: "Section",
      props: {
        id: "lab-testimonials", background: "#ffffff", maxWidth: "80rem",
        paddingTop: 80, paddingBottom: 80, decor: "",
        content: [
          { type: "Text", props: { id: "lab-rev-eyebrow", text: "DON'T JUST TAKE OUR WORD FOR IT", align: "center", color: "#0ea5e9", fontSize: 14, spaceAbove: 0, spaceBelow: 8 } },
          { type: "Heading", props: { id: "lab-rev-h2", text: "Hear From Our Happy Customers", fontSize: 44, align: "center", color: "#334155", spaceAbove: 0, spaceBelow: 40, underline: "" } },
          {
            type: "Columns",
            props: {
              id: "lab-rev-cols", columns: 3, gap: 24,
              col1: [{ type: "Card", props: { id: "lab-rev1", badge: "", eyebrow: "★★★★★  MARIA G.", heading: "", body: "\"The staff is always so friendly and patient with my anxious dog. The facility is spotless every single time. We love the self-serve wash stations, they have everything!\"" } }],
              col2: [{ type: "Card", props: { id: "lab-rev2", badge: "", eyebrow: "★★★★★  JOHN S.", heading: "", body: "\"Best place in San Antonio, hands down. The full-service groom they did on my husky was incredible. He came back looking like a show dog. Highly recommend.\"" } }],
              col3: [{ type: "Card", props: { id: "lab-rev3", badge: "", eyebrow: "★★★★★  LINDA P.", heading: "", body: "\"A fantastic local business. I appreciate how clean and well-maintained everything is. The prices are fair and the results are always great. We're regulars now.\"" } }],
            },
          },
        ],
      },
    },

    // ── CONTACT ──────────────────────────────────────────────────────────────────────────────
    // ⚠️ Their form posts to THEIR Supabase. This one is OUR LeadForm block — instant email plus
    // a Google Sheet row — which is the second half of why a design gets pulled over here.
    {
      type: "Section",
      props: {
        id: "lab-contact", background: "#f8fafc", maxWidth: "56rem",
        paddingTop: 80, paddingBottom: 88, decor: "#0ea5e9",
        content: [
          { type: "Heading", props: { id: "lab-contact-h2", text: "Book Your Pup's Pamper Day", fontSize: 44, align: "center", color: "#334155", spaceAbove: 0, spaceBelow: 12, underline: "#f59e0b" } },
          { type: "Text", props: { id: "lab-contact-sub", text: "819 New Laredo Hwy, San Antonio, TX 78211  ·  Open today", align: "center", color: "#4b5563", fontSize: 17, spaceAbove: 0, spaceBelow: 32 } },
          {
            type: "LeadForm",
            props: {
              id: "lab-contact-form",
              source: "/lab — Lucky Dog design port",
              fields: [
                { label: "Your name", inputType: "text" },
                { label: "Best phone number", inputType: "tel" },
                { label: "Your dog's breed and size", inputType: "text" },
                { label: "What service are you after?", inputType: "text" },
              ],
              buttonLabel: "Request My Appointment",
              note: "We'll text you back to confirm a time. Rather just talk? Call (210) 474-6252.",
              successHeading: "Got it — we'll text you shortly.",
              successBody: "Keep an eye on your phone. If you'd rather not wait, call us at (210) 474-6252.",
            },
          },
        ],
      },
    },

    // Same story as the header — lives in this page for the port, moves out to its own global
    // footer document on a real client site.
    {
      type: "SiteFooter",
      props: {
        id: "lab-footer",
        blurb: "Self-serve wash bays and full-service grooming on New Laredo Hwy. Spotless facility, gentle handling, and a dog that comes home happy.",
        links: [
          { label: "Services", target: "#lab-services" },
          { label: "About Us", target: "#lab-about" },
          { label: "Reviews", target: "#lab-testimonials" },
        ],
        phone: "+12104746252",
        phoneDisplay: "(210) 474-6252",
        email: "hello@luckydogwashhouse.com",
        privacyUrl: "",
        tosUrl: "",
        copyright: "Lucky Dog Wash House · San Antonio, TX",
        background: "#334155",
        foreground: "#ffffff",
        brandName: "Lucky Dog Wash House",
        showLogo: false,
      },
    },
  ],
};

const SEEDS: Record<string, Data> = {
  "lucky-dog-wash-house": LAB_SEED,
  websites: WEBSITES_SEED,
  "websites-nav": WEBSITES_NAV_SEED,
  "websites-footer": WEBSITES_FOOTER_SEED,
  home: HOME_SEED,
  apply: APPLY_SEED,
  guest: GUEST_SEED,
  nav: NAV_SEED,
  footer: FOOTER_SEED,
  about: SEED,
  faqs: FAQS_SEED,
  podcast: PODCAST_SEED,
};

export function seedFor(slug: string, title: string): Data {
  return SEEDS[slug] || starter(slug, title);
}
