import type { Data } from "@measured/puck";
import { SEED } from "@/components/puck/config";
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

// Home = the journey spine, now expressed as NATIVE editable blocks (Section / Heading / Text /
// Video / Button) so every element on the homepage carries the full toolset — font size, color,
// align, add / delete / reorder — exactly like every other page.
const HOME_SEED: Data = {
  root: {},
  content: [
    { type: "Section", props: { id: "home-hero", background: "#0f1f3d", content: [
      { type: "Text", props: { id: "home-hero-eyebrow", text: "Sales · Marketing · Growth · Control", size: "base", align: "center", color: "#ffffff" } },
      { type: "Heading", props: { id: "home-hero-h1", text: "For the first time in 40 years, you can have all of it.", fontSize: 48, align: "center", color: "#ffffff" } },
      { type: "Text", props: { id: "home-hero-sub", text: "I install the marketing that fills your pipeline and the sales force that closes every lead — so your business finally grows without you carrying it. And nothing leaves your hands: every lead, every dollar, every decision stays yours.", size: "lg", align: "center", color: "#ffffff" } },
      { type: "Video", props: { id: "home-hero-video", src: "", caption: "2-minute teaser — coming" } },
      { type: "Button", props: { id: "home-hero-cta", title: "Apply to work with me", subtitle: "One solo entrepreneur to another.", href: "/#contact" } },
    ] } },
    { type: "Section", props: { id: "home-playbook", background: "#ffffff", content: [
      { type: "Text", props: { id: "home-playbook-eyebrow", text: "The playbook you already run", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-playbook-h2", text: "Every business like yours runs the same play.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-playbook-p1", text: "You know this cold, so I'll just say it back to you the way you'd say it yourself — not to teach you, but so you know I'm not guessing. I've run this play four times, in four different businesses of my own.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-playbook-p2", text: "Michael Gerber named where it starts: you're the Technician. You got good at the work, you opened your own shop, and now the business is just you — you answer the phone, you run the schedule, you know every customer by name, and the whole thing lives in your head and your calendar. You take the risk nobody else would take, and you grind it up one job, one lead, one customer at a time.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-playbook-p3", text: "The play to grow is the same one Gerber wrote down back in 1986: stop being the business and start building it. Draw the org chart — sales, follow-up, front desk, operations — and fill the seats, so the system runs the business and the people run the system. You work ON it instead of buried IN it. That's the whole game, whether you've got one location or seven.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-playbook-p4", text: "And whatever stage you're at, you run the whole thing on the same linear tools everyone else uses — a CRM, the GoHighLevel-class sequences, software that does what software has always done: if this, then that. A lead comes in, fire a text. It's a conveyor belt. It's been the state of the art for fifteen years, and nobody wins on it anymore — you run it so you don't lose on it.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-playbook-p5", text: "That's the playbook, top to bottom. I'm not here to tell you it's wrong. I'm here because I know it well enough to show you where the lid is — and the new lever that lifts it.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "home-ceiling", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "home-ceiling-eyebrow", text: "The ceiling", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-ceiling-h2", text: "The playbook has a lid — and you can feel it.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-ceiling-p1", text: "Start with where the money leaks, because it's leaking right now. The lead that comes in at 9 p.m. on a Saturday and sits until Monday — booked with the guy down the street by then. The calls that hit voicemail when the front desk is slammed. The follow-up that fires the same canned text to everybody. The old customers nobody has time to call back. A few hundred dollars here, a no-show there — invisible because it's spread thin, enormous once you add it up.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-ceiling-p2", text: "The linear tools can't plug those leaks, because they were never built to fill a seat — only to move a lead from A to B in a straight line. They don't answer at midnight, they don't read what the person actually said, and they don't work the list. So the seats on your org chart go unfilled, and the work that should live in them falls back onto the one person who's always caught it: you.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-ceiling-p3", text: "That's the real lid — the org chart with one name in every box: yours. Every time you handed something off it got fumbled, so you stopped handing things off and do it all yourself — and a part of you is proud of it. Gerber's line still bites: if the business depends on you, you don't own a business — you own a job. You became the system.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-ceiling-p4", text: "And here's what it costs you: the growth you actually want. You can't add a location, you can't take on more volume, you can't take a week off — because the moment you try, the whole thing wobbles and falls right back onto you. The lid isn't on how hard you work. It's on how big you can ever get. That's the ceiling. Here's the lever.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "home-weapon", background: "#ffffff", content: [
      { type: "Text", props: { id: "home-weapon-eyebrow", text: "What changed", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-weapon-h2", text: "Now the seats fill themselves.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-weapon-p1", text: "There's a new kind of worker that didn't exist in any usable form even a year ago. Not the linear software you already run. Not a chatbot. An AI employee — a worker with a job, trained on the way YOU do it, that answers every lead the instant it lands, follows up reading what the person actually said, books the appointment, and works the dormant list nobody has time to touch. It never quits, never has a bad day, never lets a lead sit. The seat's job stays exactly the same; who sits in it is finally something other than you.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-weapon-p2", text: "And it's the first hire the control-freak in you will actually trust — because a human employee was always a loss of control (forgets, freelances, quits), and this is the opposite. It obeys exactly, every time, fully logged. Every lead tracked, every conversation on the record, nothing living in some new person's head where you can't see it. For the first time, delegating increases your grip instead of surrendering it. That's the lever — the biggest shift to hit a business like yours since the org chart was invented.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-weapon-teaser", text: "For forty years, the one employee you needed most didn't exist. Twenty-four months ago, that changed.", size: "lg", align: "left" } },
      { type: "Button", props: { id: "home-weapon-link", title: "See what changed", subtitle: "", href: "/what-changed" } },
    ] } },
    { type: "Section", props: { id: "home-proof", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "home-proof-eyebrow", text: "Proof, not theory", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-proof-h2", text: "A working AI employee, live today.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-proof-p1", text: "None of this is a whiteboard theory, and I'm not going to ask you to take a forty-year business owner's word for it without a receipt. There's a working prototype running right now, in one field, and it's the first of many.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-proof-p2", text: "The AI employee has a name — Chloe. She's trained on one owner's own sales conversations: the way he actually talks to a lead, the questions he asks, the way he handles “let me think about it.” She answers every lead the instant it lands and books the consult herself, start to finish, no human in the loop. Her first night live was a Sunday, staff off — she booked four consults while the lights were out and nobody was at the desk. Four appointments that, the week before, would have sat in a voicemail box until Monday.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-proof-p3", text: "One field, proven — an AI employee booking real consults off real leads while the humans slept. It's the same engine, and it points at the next field — whatever business runs the same playbook.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "home-platform", background: "#ffffff", content: [
      { type: "Text", props: { id: "home-platform-eyebrow", text: "The Platform", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-platform-h2", text: "Above any one industry.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-platform-p1", text: "Don't let any one example narrow your thinking. What I'm describing isn't a one-industry business at all — it's an AI-implementation company that sits above every single industry.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-platform-p2", text: "The engine — the AI employee that answers, follows up, qualifies, books, and reactivates; the way it's trained on one owner's own playbook; the way it installs on top of the linear software a shop already runs — none of that is tied to any single field. It forks. I proved it in the first field, then the next — roofing, because I ran a roofing company and I know exactly where that money leaks; home services, trades, practices, any field with the same shape: built and run by one person, lead-driven, fragmented, bleeding the same leaks. Same engine, retrained on the new field's playbook, installed in the businesses that run it.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-platform-p3", text: "That's what this actually is: not a tool for one industry, but the company that installs an owned AI workforce on top of whatever business you run — whichever industry, whichever software you already use. The platform goes everywhere the playbook goes.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "home-moat", background: "#ffffff", content: [
      { type: "Text", props: { id: "home-moat-eyebrow", text: "Why me", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-moat-h2", text: "You'd never hand your shop to a kid with a laptop. You don't have to.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "home-moat-p1", text: "Here's the un-fakeable part, and it's the reason this works with me and is very hard to copy.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-moat-p2", text: "This only works if one person is two things at once: someone who has actually run a business like yours, the way you run it, and someone who is genuinely AI-native and builds the technology himself. Those two almost never live in the same person. The twenty-two-year-old AI founder can build the system, but he's never made a payroll, never run a real shop through a slow season — he doesn't understand the business you built or the grind behind it, and you sniff that out in the first sentence. The forty-year business owner understands all of that in his bones, but he can't suddenly become AI-native and build the thing by hand — so he ends up reselling somebody else's software and changes nothing.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-moat-p3", text: "I'm both. I opened my first shop in 1986 — a restaurant — then mortgage, then roofing, then twenty years in trucking. Four businesses of my own, and the tech lead in every one, because we were too small to afford anyone else. And now I build the AI myself. Not a deck I bought, not a vendor I white-label. I sit on top of my own AI workforce and I build it by hand. So when I sit across from you, I'm not the tech guy you tolerate — I'm a man who ran shops just like yours for four decades and happens to be the one who can install the machine. You believe me because I've stood where you're standing. That overlap — real business owner and hands-on builder — is the moat.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "home-next", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "home-next-eyebrow", text: "The next move", size: "sm", align: "center", color: "#2563eb" } },
      { type: "Heading", props: { id: "home-next-h2", text: "The next move.", level: "h2", align: "center" } },
      { type: "Text", props: { id: "home-next-p1", text: "Wherever you are on the journey, you already know the playbook has a lid. Same play as everyone, same linear tools, the same leads slipping through. What's new is the lever that lifts it: an AI employee that plugs the leaks — answers every lead, follows up, books — so the org-chart seats you could never afford to fill finally fill themselves.", size: "base", align: "left" } },
      { type: "Text", props: { id: "home-next-p2", text: "I'm not going to sell you on a call. Either it moves your numbers or it doesn't, and you'll know inside the first ten minutes. So let's talk one solo entrepreneur to another: tell me how you run today, and I'll show you exactly where it plugs in — starting with the leads you're already paying for.", size: "base", align: "left" } },
      { type: "Button", props: { id: "home-next-cta", title: "Apply to work with me", subtitle: "One solo entrepreneur to another.", href: "/#contact" } },
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
      { type: "Text", props: { id: "fa-proof-p1", text: "Before I tell you what she is, look at what she does. Chloe is an AI employee running live in a real business right now, trained on that owner's own sales conversations. In her first 30 days she booked around 30 appointments — about one a day — and four of them landed on a single dead Sunday: staff off, lights out, while she worked the leads alone.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-proof-p2", text: "That's the part that matters. Not a demo video, not a roadmap — a live employee filling a real calendar, with a dashboard the owner watches the number climb on in real time. That is what ships behind your brand. Everything below is just how she does it.", size: "base", align: "left" } },
      { type: "Button", props: { id: "fa-proof-link", title: "See her live on the call", subtitle: "The dashboard, the real numbers.", href: "/#partner" } },
    ] } },
    { type: "Section", props: { id: "fa-magnitude", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-mag-eyebrow", text: "What you're actually installing", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-mag-h2", text: "One hire that does the work of three — and never has a bad day.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-mag-p1", text: "Chloe does the job of about three people — the front desk, the follow-up, the closer — for a fraction of one human wage. She never takes a day off, never forgets to follow up, never has a bad mood on lead number 400, and never goes to lunch when the hot lead comes in. She works 24/7, in your client's voice, behind your brand.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-mag-p2", text: "And here's the number that makes an owner sit up: run all three of her plays and you can pull roughly 5X the revenue out of the same ad budget — no new spend, you just stop the leaks across the pipeline he already owns. This isn't a faster auto-responder. It's a new kind of employee that didn't exist two years ago, doing things that have never been done before.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-levers", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-levers-eyebrow", text: "How it goes in", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-levers-h2", text: "Three levers. Each one a hero moment. All on money he already has.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-levers-p1", text: "You don't drop all of this at once. You pull three levers, in order. Each one makes you the hero on money the client already had sitting there — and each one earns you the right to pull the next. Watch the order. The order is the whole game.", size: "base", align: "left" } },
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
      { type: "Text", props: { id: "fa-l3-p2", text: "Turn Chloe loose on them — the upgrade, the next service, the re-up — sold the way a sharp human reads it: right offer, right person, right moment. No ad spend, no new acquisition, just more revenue out of relationships he already paid to build.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-throughline", background: "#f3f4f6", content: [
      { type: "Text", props: { id: "fa-tl-eyebrow", text: "Why it never feels risky to him", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-tl-h2", text: "Past, present, and customers — every dollar already his.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-tl-p1", text: "Step back. Lever one worked his past — the dead leads he gave up on. Lever two worked his present — the new leads he's already paying you to generate. Lever three worked his customers — the people who already bought. Not one dollar of new ad spend in any of it. You didn't ask him to spend more to make more — you stopped the money that was already his from leaking out of the pipeline he already owns.", size: "base", align: "left" } },
      { type: "Text", props: { id: "fa-tl-p2", text: "That's the easiest thing you'll ever sell a client — and the hardest thing he'll ever cancel. Cut you now and the leaks come right back, and he felt what they were costing. That's load-bearing. That's un-fireable. That's the substance the ads alone never gave you.", size: "base", align: "left" } },
    ] } },
    { type: "Section", props: { id: "fa-moat", background: "#ffffff", content: [
      { type: "Text", props: { id: "fa-moat-eyebrow", text: "What I take off your plate", size: "sm", align: "left", color: "#2563eb" } },
      { type: "Heading", props: { id: "fa-moat-h2", text: "You loved GoHighLevel's modularity. You hated executing it. I take the execution away.", level: "h2", align: "left" } },
      { type: "Text", props: { id: "fa-moat-p1", text: "You chose GHL because it's modular — bolt the pieces together, your name on all of it. And you know the other half of that promise: making anything real actually work in there takes a developer, and you've paid that tax in hours and broken automations. That half is the half I take. What I've built is a modular, clonable AI-employee system — install it once, clone it to the next client, and the next. Seasoned, turnkey, done-for-you. I hand it to you finished, behind your brand, and I run the engine. It's additive — keep your current developer, keep your stack, nothing breaks.", size: "base", align: "left" } },
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
