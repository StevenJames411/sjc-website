// Puck (visual page builder) block catalog for the /about pilot. Each block REUSES the
// site's own look: the same color vars, type scale, and the global `.btn-cta` button — so
// what Steven drags onto the canvas matches the live site. No "use client" here: this module
// is imported by BOTH the client editor (app/about/edit) and the server <Render> on the
// public /about page, so it must stay framework-neutral (types only from @measured/puck).
import type { Config, Data, Slot } from "@measured/puck";
import CtaButton from "@/components/CtaButton";
import RichText from "@/components/puck/RichText";
import SizeStepper from "@/components/puck/SizeStepper";
import HeroReel from "@/components/HeroReel";
import { HERO_REEL_DEFAULTS } from "@/components/HeroReel";
import IndustriesStrip from "@/components/IndustriesStrip";
import Playbook from "@/components/Playbook";
import { PLAYBOOK_DEFAULTS } from "@/components/Playbook";
import TheCeiling from "@/components/TheCeiling";
import { CEILING_DEFAULTS } from "@/components/TheCeiling";
import Weapon from "@/components/Weapon";
import { WEAPON_DEFAULTS } from "@/components/Weapon";
import WhereItLeads from "@/components/WhereItLeads";
import Proof from "@/components/Proof";
import { PROOF_DEFAULTS } from "@/components/Proof";
import FourTables from "@/components/FourTables";
import Moat from "@/components/Moat";
import { MOAT_DEFAULTS } from "@/components/Moat";
import Next from "@/components/Next";
import { NEXT_DEFAULTS } from "@/components/Next";
import Platform from "@/components/Platform";
import { PLATFORM_DEFAULTS } from "@/components/Platform";
import MedSpaWound, { MEDSPA_WOUND_DEFAULTS } from "@/components/medspa/MedSpaWound";
import MedSpaStep, { MEDSPA_STEP_DEFAULTS } from "@/components/medspa/MedSpaStep";
import MedSpaPricing, { MEDSPA_PRICING_DEFAULTS } from "@/components/medspa/MedSpaPricing";
import FieldDeepTemplate from "@/components/FieldDeepTemplate";

type Align = "left" | "center" | "right";

// The props each block carries. Puck uses this to type the field editors AND the render
// functions (so `content` below is handed back as a render component for the nested slot).
type Props = {
  Section: { background: string; paddingTop: number; paddingBottom: number; content: Slot };
  Spacer: { height: number };
  Divider: { color: string };
  Columns: { columns: number; gap: number; col1: Slot; col2: Slot; col3: Slot };
  Heading: { text: string; fontSize: number; spaceAbove: number; spaceBelow: number; align: Align; color: string };
  Text: { text: string; fontSize: number; spaceAbove: number; spaceBelow: number; align: Align; color: string };
  Button: { title: string; subtitle: string; href: string };
  Video: { src: string; caption: string };
  PhoneLink: { label: string; tel: string };
  // Hero — now a props-driven block (text editable via fields). The rest below are still
  // "wrapped" as-is; they get the same treatment section by section.
  HeroReel: {
    eyebrow: string;
    h1: string;
    sub: string;
    fieldsLine: string;
    ctaTitle: string;
    ctaSubtitle: string;
  };
  FindYourIndustry: Record<string, never>;
  Playbook: { eyebrow: string; h2: string; p1: string; p2: string; p3: string; p4: string; p5: string };
  TheCeiling: { eyebrow: string; h2: string; p1: string; p2: string; p3: string; p4: string };
  Weapon: { eyebrow: string; h2: string; p1: string; p2: string; teaser: string };
  DoubleFlywheel: Record<string, never>;
  Proof: { eyebrow: string; h2: string; p1: string; p2: string; p3: string };
  FourTables: Record<string, never>;
  Moat: { eyebrow: string; h2: string; p1: string; p2: string; p3: string };
  NextMove: { eyebrow: string; h2: string; p1: string; p2: string; ctaTitle: string; ctaSubtitle: string };
  Platform: { eyebrow: string; h2: string; p1: string; p2: string; p3: string };
  // Med-Spa page custom sections — props-driven, all text editable via fields.
  MedSpaWound: {
    eyebrow: string;
    h2: string;
    p1: string;
    p2: string;
    beats: { title: string; body: string }[];
    callout: string;
  };
  MedSpaStep: {
    eyebrow: string;
    h2: string;
    p1: string;
    p2: string;
    p3: string;
    col1label: string;
    col1sub: string;
    col2label: string;
    col2sub: string;
    step1: { item: string }[];
    step2: { item: string }[];
    callout: string;
  };
  MedSpaPricing: {
    eyebrow: string;
    h2: string;
    p1: string;
    p2bold1: string;
    p2mid: string;
    p2bold2: string;
    p2end: string;
  };
  // The shared industry deep-page template, with its copy editable through fields.
  FieldDeep: {
    name: string;
    eyebrow: string;
    intro: string;
    leaksLede: string;
    leaks: { item: string }[];
    fix: string;
    rollup: string;
  };
};

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
    { label: "Dark navy", value: "#0f1f3d" },
  ],
};

// Per-block text color. Default ink; "White" is for blocks sitting on a dark Section band.
const COLOR_FIELD = {
  type: "select" as const,
  options: [
    { label: "Ink (default)", value: "#111827" },
    { label: "White", value: "#ffffff" },
    { label: "Blue", value: "#2563eb" },
    { label: "Muted gray", value: "#4b5563" },
  ],
};

// The block catalog, typed with the Props map so fields + render params are inferred.
export const config: Config<Props> = {
  components: {
    Section: {
      label: "Section (band)",
      fields: {
        background: { ...BG_FIELD, label: "Background" },
        paddingTop: {
          type: "custom" as const,
          label: "Padding top (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={64} step={8} min={0} />
          ),
        },
        paddingBottom: {
          type: "custom" as const,
          label: "Padding bottom (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={64} step={8} min={0} />
          ),
        },
        content: { type: "slot" as const },
      },
      defaultProps: { background: "#ffffff", paddingTop: 64, paddingBottom: 64, content: [] },
      render: ({ background, paddingTop, paddingBottom, content: Content }) => (
        <section style={{ backgroundColor: background }} className="w-full">
          <div
            className="mx-auto max-w-3xl px-6"
            style={{
              paddingTop: `${typeof paddingTop === "number" ? paddingTop : 64}px`,
              paddingBottom: `${typeof paddingBottom === "number" ? paddingBottom : 64}px`,
            }}
          >
            <Content />
          </div>
        </section>
      ),
    },

    Spacer: {
      label: "Spacer (vertical gap)",
      fields: {
        height: {
          type: "custom" as const,
          label: "Height (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={32} step={8} min={0} />
          ),
        },
      },
      defaultProps: { height: 32 },
      render: ({ height }) => (
        <div style={{ height: `${typeof height === "number" ? height : 32}px` }} aria-hidden />
      ),
    },

    Divider: {
      label: "Divider (line)",
      fields: {
        color: { ...COLOR_FIELD, label: "Line color" },
      },
      defaultProps: { color: "#e5e7eb" },
      render: ({ color }) => (
        <hr style={{ border: "none", borderTop: `1px solid ${color || "#e5e7eb"}`, margin: "1.5rem 0" }} />
      ),
    },

    Columns: {
      label: "Columns (1 / 2 / 3)",
      fields: {
        columns: {
          type: "select" as const,
          label: "Number of columns",
          options: [
            { label: "1 column", value: 1 },
            { label: "2 columns", value: 2 },
            { label: "3 columns", value: 3 },
          ],
        },
        gap: {
          type: "custom" as const,
          label: "Gap between columns (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={24} step={4} min={0} />
          ),
        },
        col1: { type: "slot" as const },
        col2: { type: "slot" as const },
        col3: { type: "slot" as const },
      },
      defaultProps: { columns: 2, gap: 24, col1: [], col2: [], col3: [] },
      render: ({ columns, gap, col1: Col1, col2: Col2, col3: Col3 }) => {
        const n = Number(columns) || 1;
        const cls =
          n >= 3 ? "grid-cols-1 md:grid-cols-3" : n === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1";
        return (
          <div className={`grid ${cls}`} style={{ gap: `${typeof gap === "number" ? gap : 24}px` }}>
            <div>
              <Col1 />
            </div>
            {n >= 2 && (
              <div>
                <Col2 />
              </div>
            )}
            {n >= 3 && (
              <div>
                <Col3 />
              </div>
            )}
          </div>
        );
      },
    },

    Heading: {
      label: "Heading",
      fields: {
        text: { type: "text" as const, label: "Text" },
        fontSize: {
          type: "custom" as const,
          label: "Font size (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={32} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={12} step={4} min={0} />
          ),
        },
        align: { ...ALIGN_FIELD, label: "Align" },
        color: { ...COLOR_FIELD, label: "Color" },
      },
      defaultProps: { text: "New heading", fontSize: 0, spaceAbove: 0, spaceBelow: 12, align: "left" as const, color: "#111827" },
      render: ({ text, fontSize, spaceAbove, spaceBelow, align, color }) => {
        const px = fontSize && fontSize > 0 ? fontSize : 32;
        return (
          <h2
            className="font-bold leading-tight tracking-tight"
            style={{
              fontSize: `${px}px`,
              textAlign: align,
              color: color || "#111827",
              marginTop: `${typeof spaceAbove === "number" ? spaceAbove : 0}px`,
              marginBottom: `${typeof spaceBelow === "number" ? spaceBelow : 12}px`,
            }}
          >
            {text}
          </h2>
        );
      },
    },

    Text: {
      label: "Text box",
      fields: {
        // A full in-block word processor (bold/italic/underline/color/link on a selection).
        text: {
          type: "custom" as const,
          label: "Text",
          render: ({ onChange, value }) => (
            <RichText value={value as string} onChange={onChange} />
          ),
        },
        fontSize: {
          type: "custom" as const,
          label: "Font size (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={18} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={16} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
        align: { ...ALIGN_FIELD, label: "Align" },
        color: { ...COLOR_FIELD, label: "Color" },
      },
      defaultProps: {
        text: "New paragraph. Select any word and use the toolbar to format it.",
        fontSize: 0,
        spaceAbove: 16,
        spaceBelow: 0,
        align: "left" as const,
        color: "#111827",
      },
      render: ({ text, fontSize, spaceAbove, spaceBelow, align, color }) => (
        <div
          className="rt leading-relaxed"
          style={{
            textAlign: align,
            color: color || "#111827",
            marginTop: `${typeof spaceAbove === "number" ? spaceAbove : 16}px`,
            marginBottom: `${typeof spaceBelow === "number" ? spaceBelow : 0}px`,
            fontSize: `${fontSize && fontSize > 0 ? fontSize : 18}px`,
          }}
          dangerouslySetInnerHTML={{ __html: text }}
        />
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
      render: ({ title, subtitle, href }) => (
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
      render: ({ label, tel }) => (
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

    Video: {
      label: "Video / sizzle reel",
      fields: {
        src: { type: "text" as const, label: "Embed URL (YouTube/Vimeo) — blank = placeholder" },
        caption: { type: "text" as const, label: "Placeholder caption" },
      },
      defaultProps: { src: "", caption: "2-minute teaser — coming" },
      render: ({ src, caption }) => (
        <div className="mx-auto mt-9 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-black/40">
          {src ? (
            <iframe src={src} className="h-full w-full" allowFullScreen title="Video" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-2xl">
                &#9654;
              </span>
              <span className="text-sm uppercase tracking-[0.18em]">{caption}</span>
            </div>
          )}
        </div>
      ),
    },

    // Wrapped homepage sections — each renders the real live component as a single
    // draggable/deletable block. (Their internal text becomes Puck-editable in a later pass.)
    HeroReel: {
      label: "Hero — sizzle reel",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h1: { type: "text" as const, label: "Headline" },
        sub: { type: "textarea" as const, label: "Sub-paragraph" },
        fieldsLine: { type: "textarea" as const, label: "Breadth line" },
        ctaTitle: { type: "text" as const, label: "Button text" },
        ctaSubtitle: { type: "text" as const, label: "Button subtitle" },
      },
      defaultProps: HERO_REEL_DEFAULTS,
      render: ({ eyebrow, h1, sub, fieldsLine, ctaTitle, ctaSubtitle }) => (
        <HeroReel
          eyebrow={eyebrow}
          h1={h1}
          sub={sub}
          fieldsLine={fieldsLine}
          ctaTitle={ctaTitle}
          ctaSubtitle={ctaSubtitle}
        />
      ),
    },
    FindYourIndustry: { label: "Find Your Industry (cards)", fields: {}, render: () => <IndustriesStrip /> },
    Playbook: {
      label: "The Playbook You Already Run",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
        p4: { type: "textarea" as const, label: "Paragraph 4" },
        p5: { type: "textarea" as const, label: "Paragraph 5" },
      },
      defaultProps: PLAYBOOK_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3, p4, p5 }) => (
        <Playbook eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3} p4={p4} p5={p5} />
      ),
    },
    TheCeiling: {
      label: "The Ceiling — the Problem",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
        p4: { type: "textarea" as const, label: "Paragraph 4" },
      },
      defaultProps: CEILING_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3, p4 }) => (
        <TheCeiling eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3} p4={p4} />
      ),
    },
    Weapon: {
      label: "What Changed — AI fills the seats",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        teaser: { type: "textarea" as const, label: "Teaser line" },
      },
      defaultProps: WEAPON_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, teaser }) => (
        <Weapon eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} teaser={teaser} />
      ),
    },
    DoubleFlywheel: { label: "The Double Flywheel", fields: {}, render: () => <WhereItLeads /> },
    Proof: {
      label: "Proof — Chloe",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
      },
      defaultProps: PROOF_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3 }) => (
        <Proof eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3} />
      ),
    },
    FourTables: { label: "The Four Tables", fields: {}, render: () => <FourTables /> },
    Moat: {
      label: "The Moat — Why Me",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
      },
      defaultProps: MOAT_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3 }) => (
        <Moat eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3} />
      ),
    },
    NextMove: {
      label: "The Next Move",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        ctaTitle: { type: "text" as const, label: "Button text" },
        ctaSubtitle: { type: "text" as const, label: "Button subtitle" },
      },
      defaultProps: NEXT_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, ctaTitle, ctaSubtitle }) => (
        <Next eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} ctaTitle={ctaTitle} ctaSubtitle={ctaSubtitle} />
      ),
    },
    Platform: {
      label: "Above Any One Industry",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
      },
      defaultProps: PLATFORM_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3 }) => (
        <Platform eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3} />
      ),
    },

    // Med-Spa page sections — full field schemas, copy editable in the builder.
    MedSpaWound: {
      label: "Med-Spa — The Wound",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        beats: {
          type: "array" as const,
          label: "Beats (cards)",
          arrayFields: {
            title: { type: "text" as const, label: "Title" },
            body: { type: "textarea" as const, label: "Body" },
          },
          getItemSummary: (i: { title: string; body: string }) => i.title || "Beat",
        },
        callout: { type: "textarea" as const, label: "Callout" },
      },
      defaultProps: MEDSPA_WOUND_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, beats, callout }) => (
        <MedSpaWound eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} beats={beats} callout={callout} />
      ),
    },
    MedSpaStep: {
      label: "Med-Spa — Step One",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
        col1label: { type: "text" as const, label: "Column 1 label" },
        col1sub: { type: "text" as const, label: "Column 1 sub" },
        col2label: { type: "text" as const, label: "Column 2 label" },
        col2sub: { type: "text" as const, label: "Column 2 sub" },
        step1: {
          type: "array" as const,
          label: "Step 1 bullets",
          arrayFields: { item: { type: "textarea" as const, label: "Item" } },
          getItemSummary: (i: { item: string }) => i.item || "Item",
        },
        step2: {
          type: "array" as const,
          label: "Step 2 bullets",
          arrayFields: { item: { type: "textarea" as const, label: "Item" } },
          getItemSummary: (i: { item: string }) => i.item || "Item",
        },
        callout: { type: "textarea" as const, label: "Callout" },
      },
      defaultProps: MEDSPA_STEP_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, p3, col1label, col1sub, col2label, col2sub, step1, step2, callout }) => (
        <MedSpaStep
          eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} p3={p3}
          col1label={col1label} col1sub={col1sub}
          col2label={col2label} col2sub={col2sub}
          step1={step1} step2={step2} callout={callout}
        />
      ),
    },
    MedSpaPricing: {
      label: "Med-Spa — Pricing",
      fields: {
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        h2: { type: "text" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2bold1: { type: "text" as const, label: "Bold opener" },
        p2mid: { type: "text" as const, label: "Mid text" },
        p2bold2: { type: "text" as const, label: "Bold mid" },
        p2end: { type: "textarea" as const, label: "Closing text" },
      },
      defaultProps: MEDSPA_PRICING_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2bold1, p2mid, p2bold2, p2end }) => (
        <MedSpaPricing eyebrow={eyebrow} h2={h2} p1={p1} p2bold1={p2bold1} p2mid={p2mid} p2bold2={p2bold2} p2end={p2end} />
      ),
    },

    // Industry deep page (HVAC / Roofing / Garage Doors …) — full template, copy editable.
    FieldDeep: {
      label: "Industry deep page",
      fields: {
        name: { type: "text" as const, label: "Field name" },
        eyebrow: { type: "text" as const, label: "Eyebrow" },
        intro: { type: "textarea" as const, label: "Intro" },
        leaksLede: { type: "textarea" as const, label: "Leaks lead-in" },
        leaks: {
          type: "array" as const,
          label: "Leaks (bullets)",
          arrayFields: { item: { type: "textarea" as const, label: "Leak" } },
          getItemSummary: (i: { item: string }) => i.item || "Leak",
        },
        fix: { type: "textarea" as const, label: "The fix" },
        rollup: { type: "textarea" as const, label: "The roll-up" },
      },
      defaultProps: {
        name: "Field",
        eyebrow: "",
        intro: "",
        leaksLede: "",
        leaks: [],
        fix: "",
        rollup: "",
      },
      render: ({ name, eyebrow, intro, leaksLede, leaks, fix, rollup }) => (
        <FieldDeepTemplate
          name={name}
          eyebrow={eyebrow}
          intro={intro}
          leaksLede={leaksLede}
          leaks={(leaks || []).map((l: { item: string }) => l.item)}
          fix={fix}
          rollup={rollup}
        />
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
              text: "I'm a solo entrepreneur, just like you. Four businesses of my own since 1986 — and now this one.",
              level: "h1",
              align: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "s1-intro",
              text: "And the whole time, I had the same problem you have. I could never find people worth the effort — people who'd stick around, take the training, and actually do the job right. So I did it all myself. The whole way.",
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
              text: "I'm Steven Barchetti. I've run my own businesses for four decades — four of them, in four different trades. A restaurant in 1986. A mortgage company with my brother. A roofing company. A trucking company I ran for twenty years. And now this one — the AI business.",
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
              text: "So I've been sitting in your exact chair, doing 90% of it with my own two hands, longer than most of these consultants have been alive. I know what it feels like to be great at the work and still buried under every other job in the company. I lived it four times.",
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
            props: { id: "s3-h2", text: "Then, for the first time, that problem got solved.", level: "h2", align: "left" },
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
              text: "Twenty-four months ago that changed for good. I could finally hire the employee I'd been looking for my whole career — an AI employee. It takes the training. It doesn't quit. It doesn't go off and freelance. It doesn't call in sick or take days off. It answers every lead the second it comes in, follows up, books the appointment, and circles back on the cold ones. It does the job the same way every time, and I can see everything it does.",
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
              text: "Apply to work with me. You tell me how you run things today, and I'll show you exactly where an AI employee fits in — with you in charge the whole way.",
              align: "center",
            },
          },
          {
            type: "Button",
            props: {
              id: "s5-cta",
              title: "Apply to work with me",
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
