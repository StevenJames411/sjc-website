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

export function seedFor(slug: string, title: string): Data {
  if (slug === "about") return SEED;
  if (slug === "faqs") return FAQS_SEED;
  return starter(slug, title);
}
