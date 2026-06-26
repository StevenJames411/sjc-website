// Puck (visual page builder) block catalog for the /about pilot. Each block REUSES the
// site's own look: the same color vars, type scale, and the global `.btn-cta` button — so
// what Steven drags onto the canvas matches the live site. No "use client" here: this module
// is imported by BOTH the client editor (app/about/edit) and the server <Render> on the
// public /about page, so it must stay framework-neutral (types only from @measured/puck).
import type { ComponentType } from "react";
import type { Config, Data } from "@measured/puck";
import CtaButton from "@/components/CtaButton";

type Align = "left" | "center" | "right";

const ALIGN_FIELD = {
  type: "radio" as const,
  options: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
    { label: "Right", value: "right" },
  ],
};

const BG_FIELD = {
  type: "select" as const,
  options: [
    { label: "White", value: "#ffffff" },
    { label: "Light gray", value: "#f3f4f6" },
    { label: "SJC navy", value: "#1e3a6e" },
  ],
};

// The block catalog. `satisfies Config` validates the shape while keeping inference.
export const config = {
  components: {
    Section: {
      label: "Section (band)",
      fields: {
        background: { ...BG_FIELD, label: "Background" },
        content: { type: "slot" as const },
      },
      defaultProps: { background: "#ffffff", content: [] },
      render: ({
        background,
        content: Content,
      }: {
        background: string;
        content: ComponentType;
      }) => (
        <section style={{ backgroundColor: background }} className="w-full">
          <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
            <Content />
          </div>
        </section>
      ),
    },

    Heading: {
      label: "Heading",
      fields: {
        text: { type: "text" as const, label: "Text" },
        level: {
          type: "select" as const,
          label: "Size",
          options: [
            { label: "Big (H1)", value: "h1" },
            { label: "Section (H2)", value: "h2" },
            { label: "Small (H3)", value: "h3" },
          ],
        },
        align: { ...ALIGN_FIELD, label: "Align" },
      },
      defaultProps: { text: "New heading", level: "h2", align: "left" },
      render: ({
        text,
        level,
        align,
      }: {
        text: string;
        level: "h1" | "h2" | "h3";
        align: Align;
      }) => {
        const Tag = level;
        const size =
          level === "h1"
            ? "text-3xl md:text-4xl"
            : level === "h2"
            ? "text-2xl md:text-3xl"
            : "text-xl md:text-2xl";
        return (
          <Tag
            className={`font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] ${size}`}
            style={{ textAlign: align, marginBottom: "0.75rem" }}
          >
            {text}
          </Tag>
        );
      },
    },

    Text: {
      label: "Text box",
      fields: {
        text: { type: "textarea" as const, label: "Text" },
        align: { ...ALIGN_FIELD, label: "Align" },
      },
      defaultProps: {
        text: "New paragraph. Click to edit this text.",
        align: "left",
      },
      render: ({ text, align }: { text: string; align: Align }) => (
        <p
          className="text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg"
          style={{ textAlign: align, whiteSpace: "pre-line", marginTop: "1rem" }}
        >
          {text}
        </p>
      ),
    },

    Button: {
      label: "Call-to-action button",
      fields: {
        title: { type: "text" as const, label: "Button text" },
        subtitle: { type: "text" as const, label: "Small line under (optional)" },
        href: { type: "text" as const, label: "Link" },
      },
      defaultProps: {
        title: "Book the Call",
        subtitle: "",
        href: "/#contact",
      },
      render: ({
        title,
        subtitle,
        href,
      }: {
        title: string;
        subtitle: string;
        href: string;
      }) => (
        <div className="mt-8 flex justify-center">
          <CtaButton title={title} subtitle={subtitle || undefined} href={href} />
        </div>
      ),
    },

    PhoneLink: {
      label: "Phone link",
      fields: {
        label: { type: "text" as const, label: "Text" },
        tel: { type: "text" as const, label: "Phone number (digits, e.g. +12102982343)" },
      },
      defaultProps: {
        label: "Or call me directly: (210) 298-2343",
        tel: "+12102982343",
      },
      render: ({ label, tel }: { label: string; tel: string }) => (
        <div className="mt-4 text-center">
          <a
            href={`tel:${tel}`}
            className="text-sm font-semibold text-[color:var(--color-sjc-blue)] hover:underline"
          >
            {label}
          </a>
        </div>
      ),
    },
  },
} satisfies Config;

// Seed = the current /about page expressed as Puck blocks, so Steven opens the editor to the
// page he already has and can immediately add / delete / reorder. (The headshot image block
// is intentionally left out of this first pilot; text + CTA are what he wanted to manipulate.)
export const SEED: Data = {
  root: {},
  content: [
    {
      type: "Section",
      props: {
        id: "sec-1",
        background: "#f3f4f6",
        content: [
          { type: "Text", props: { id: "s1-eyebrow", text: "MY STORY", align: "left" } },
          {
            type: "Heading",
            props: {
              id: "s1-h1",
              text: "I'm a solo entrepreneur, just like you. Forty years. Five businesses of my own.",
              level: "h1",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s1-intro",
              text: "And the whole time, I had the same problem you have. I could never find people worth the effort — people who'd stick around, take the training, and actually do the job right. So I did it all myself. For forty years.",
              align: "left",
            },
          },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "sec-2",
        background: "#ffffff",
        content: [
          {
            type: "Heading",
            props: { id: "s2-h2", text: "I never could find people worth the effort.", level: "h2", align: "left" },
          },
          {
            type: "Text",
            props: {
              id: "s2-p1",
              text: "I'm Steven Barchetti. I've run my own businesses for forty years — five of them, in five different trades. A restaurant in 1986. A mortgage company with my brother. A roofing company. A trucking company I ran for twenty years. And now this.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s2-p2",
              text: "And in every one of them, I hit the same wall: I could never find people who'd stick around, take the training, and be worth the effort. They quit. They cut corners. They went off and did their own thing. So I gave up on it and did everything myself — the work, the books, the follow-up, the ads, and yes, I was the computer guy too. Whatever needed doing, that was me.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s2-p3",
              text: "So I've been sitting in your exact chair, doing 90% of it with my own two hands, longer than most of these consultants have been alive. I know what it feels like to be great at the work and still buried under every other job in the company. I lived it five times.",
              align: "left",
            },
          },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "sec-3",
        background: "#f3f4f6",
        content: [
          {
            type: "Heading",
            props: { id: "s3-h2", text: "Then, for the first time in forty years, that problem got solved.", level: "h2", align: "left" },
          },
          {
            type: "Text",
            props: {
              id: "s3-p1",
              text: "Every decade handed me a slightly better set of tools. Phone, fax, the first websites, email blasts, the customer list software. Each one helped a little. But not one of them ever did the actual work. They sat there and waited for me to push the button. They were tools, and I was still the one holding them.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s3-p2",
              text: "A couple of years ago that changed for good. For the first time, I could finally hire the employee I'd been looking for my whole career — an AI employee. It takes the training. It doesn't quit. It doesn't go off and freelance. It doesn't call in sick or take days off. It answers every lead the second it comes in, follows up, books the appointment, and circles back on the cold ones. It does the job the same way every time, and I can see everything it does.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s3-p3",
              text: "Now here's the part that matters. Just about everyone else selling AI right now is selling you a chatbot — a little pop-up that answers a question and then hands you back the work. That's not an employee. What I do is build a real AI employee right into the same software you already use to run your business, so it works your leads and your calendar like a real member of your staff. That part is hard, and it's the part nobody else has figured out. I build it myself, by hand.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s3-p4",
              text: "I built it for my own company first. Steven James Consulting runs on its own AI employees today — the exact same thing I'll set up for you. I'm not selling you an idea. I'm selling you the thing I already run my own business on.",
              align: "left",
            },
          },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "sec-4",
        background: "#ffffff",
        content: [
          {
            type: "Heading",
            props: { id: "s4-h2", text: "That's why I started this: to set it up for you, and put you in charge of it.", level: "h2", align: "left" },
          },
          {
            type: "Text",
            props: {
              id: "s4-p1",
              text: "Most people calling themselves AI consultants right now are just reselling somebody else's gadget. I'm a guy who's been building this stuff with his own hands, in real businesses, since 1986. I just finally have what I need to do it the way it should be done.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s4-p2",
              text: "I set the AI employee up on top of the business you already run. I don't rip out what's working. I don't take the reins from you. I do the hard part in the background so you never have to think about it — and you keep your hand on every lead and every dollar.",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s4-p3",
              text: "You stay in charge. You're the one running it. I just build the thing and keep it running, so the whole machine answers to you.",
              align: "left",
            },
          },
        ],
      },
    },
    {
      type: "Section",
      props: {
        id: "sec-5",
        background: "#f3f4f6",
        content: [
          {
            type: "Heading",
            props: { id: "s5-h2", text: "Want to see what this would look like in your shop?", level: "h2", align: "center" },
          },
          {
            type: "Text",
            props: {
              id: "s5-p",
              text: "Let's get on a quick call. You tell me how you run things today, and I'll show you exactly where an AI employee fits in — with you in charge the whole way.",
              align: "center",
            },
          },
          {
            type: "Button",
            props: {
              id: "s5-cta",
              title: "Book the Call",
              subtitle: "A quick call to see where an AI employee fits into your business.",
              href: "/#contact",
            },
          },
          {
            type: "PhoneLink",
            props: { id: "s5-phone", label: "Or call me directly: (210) 298-2343", tel: "+12102982343" },
          },
        ],
      },
    },
  ],
};
