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
import ImageUpload from "@/components/puck/ImageUpload";
import NavView from "@/components/NavView";

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
  Image: { src: string; alt: string; caption: string; maxWidth: number; rounded: string; align: Align };
  Conversation: { caption: string; chloeLabel: string; leadLabel: string; messages: { from: string; text: string }[] };
  StaffRoster: { businessName: string; rows: { name: string; email: string; role: string; isAI: boolean }[] };
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
  // The site navigation — fully editable in the builder (edit at /edit/nav, renders site-wide).
  SiteHeader: {
    brandName: string;
    tagline: string;
    taglineColor: string;
    taglineSize: number;
    links: { label: string; target: string; fontSize: number; color: string }[];
    ctaLabel: string;
    ctaHref: string;
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

// Nav text colors (sit on the dark navy header band).
const NAV_COLOR_FIELD = {
  type: "select" as const,
  options: [
    { label: "White", value: "#ffffff" },
    { label: "Green", value: "#22c55e" },
    { label: "Light blue", value: "#93c5fd" },
    { label: "Muted", value: "#cbd5e1" },
  ],
};

// Single source of truth for the nav's starting content — used by BOTH the seed (so /edit/nav
// opens to it) AND Nav.tsx's fallback (so the live nav never renders blank if nothing's published).
export const NAV_DEFAULTS = {
  brandName: "Steven James Consulting",
  tagline: "Your Native AI Implementation Partner",
  taglineColor: "#22c55e",
  taglineSize: 18,
  links: [] as { label: string; target: string; fontSize: number; color: string }[],
  ctaLabel: "See How It Works",
  ctaHref: "/#at-work",
};

export const IMAGE_DEFAULTS = {
  src: "",
  alt: "",
  caption: "",
  maxWidth: 0,
  rounded: "16px",
  align: "center" as Align,
};

export const CONVERSATION_DEFAULTS = {
  caption: "",
  chloeLabel: "Chloe",
  leadLabel: "Lead",
  messages: [
    { from: "chloe", text: "Hey! 80 pounds is a real goal — what's got you focused on making this happen right now?" },
    { from: "lead", text: "Can't buy bigger clothes! and I just wanted to look good at 56" },
    { from: "chloe", text: "Ha, I love that! Nothing like a closet full of clothes that don't fit to light a fire under you. Have you tried the weight-loss shots before, or is this new for you?" },
  ],
};

// The block catalog, typed with the Props map so fields + render params are inferred.
export const STAFFROSTER_DEFAULTS = {
  businessName: "Acme Healthcare",
  rows: [
    { name: "Dr. Alan Pierce", email: "dr.pierce@acmehealthcare.com", role: "Physician / Owner", isAI: false },
    { name: "Renee Salas", email: "renee@acmehealthcare.com", role: "Office Manager", isAI: false },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Booking & Follow-Up", isAI: true },
    { name: "Marcus Webb", email: "marcus@acmehealthcare.com", role: "Front Desk", isAI: false },
  ] as { name: string; email: string; role: string; isAI: boolean }[],
};

export const config: Config<Props> = {
  components: {
    StaffRoster: {
      label: "Staff roster (Chloe in the lineup)",
      fields: {
        businessName: { type: "text" as const, label: "Business name (fictitious example)" },
        rows: {
          type: "array" as const,
          label: "Staff — mark Chloe as the AI row",
          arrayFields: {
            name: { type: "text" as const, label: "Name" },
            email: { type: "text" as const, label: "Email" },
            role: { type: "text" as const, label: "Role" },
            isAI: {
              type: "radio" as const,
              label: "AI employee?",
              options: [
                { label: "No", value: false },
                { label: "Yes (Chloe)", value: true },
              ],
            },
          },
          getItemSummary: (i: { name?: string }) => i?.name || "teammate",
          defaultItemProps: { name: "New teammate", email: "name@acmehealthcare.com", role: "Role", isAI: false },
        },
      },
      defaultProps: STAFFROSTER_DEFAULTS,
      render: ({ businessName, rows }) => {
        const list = Array.isArray(rows) ? rows : [];
        const initials = (n: string) =>
          (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
        const palette = ["#2563eb", "#dc2626", "#9333ea", "#0891b2", "#ca8a04"];
        return (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,.08)",
              background: "#fff",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid #eef0f3",
                background: "#f8fafc",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{businessName || "My Staff"}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>My Staff</span>
            </div>
            <div>
              {list.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 18px",
                    borderTop: i ? "1px solid #f1f3f5" : "none",
                    background: r.isAI ? "#f0fdf4" : "#fff",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      background: r.isAI ? "#22c55e" : palette[i % palette.length],
                    }}
                  >
                    {initials(r.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{r.name}</span>
                      {r.isAI && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#15803d",
                            background: "#dcfce7",
                            border: "1px solid #bbf7d0",
                            borderRadius: 999,
                            padding: "2px 8px",
                          }}
                        >
                          AI EMPLOYEE
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.email}
                    </div>
                  </div>
                  <div style={{ flex: "0 0 auto", textAlign: "right", color: "#374151", fontSize: 13, fontWeight: 600 }}>
                    {r.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      },
    },

    SiteHeader: {
      label: "Site header / nav",
      fields: {
        brandName: { type: "text" as const, label: "Business name (links home)" },
        tagline: { type: "text" as const, label: "Center tagline (who you are)" },
        taglineColor: { ...NAV_COLOR_FIELD, label: "Tagline color" },
        taglineSize: {
          type: "custom" as const,
          label: "Tagline size (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={18} step={1} min={10} />
          ),
        },
        links: {
          type: "array" as const,
          label: "Nav links (add / delete pages or #sections)",
          arrayFields: {
            label: { type: "text" as const, label: "Label" },
            target: { type: "text" as const, label: "Links to (a page like /about, or a homepage section like /#at-work)" },
            fontSize: {
              type: "custom" as const,
              label: "Size (− / +)",
              render: ({ onChange, value }) => (
                <SizeStepper value={value as number} onChange={onChange} fallback={14} step={1} min={10} />
              ),
            },
            color: { ...NAV_COLOR_FIELD, label: "Color" },
          },
          getItemSummary: (i: { label?: string }) => i?.label || "link",
          defaultItemProps: { label: "New link", target: "/", fontSize: 14, color: "#ffffff" },
        },
        ctaLabel: { type: "text" as const, label: "Button label (leave blank to hide)" },
        ctaHref: { type: "text" as const, label: "Button links to" },
      },
      defaultProps: NAV_DEFAULTS,
      render: ({ brandName, tagline, taglineColor, taglineSize, links, ctaLabel, ctaHref }) => (
        <NavView
          brandName={brandName}
          tagline={tagline}
          taglineColor={taglineColor}
          taglineSize={taglineSize}
          links={links}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />
      ),
    },

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
      render: ({ id, background, paddingTop, paddingBottom, content: Content }) => (
        <section id={typeof id === "string" ? id : undefined} style={{ backgroundColor: background }} className="w-full scroll-mt-20">
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
        text: { type: "textarea" as const, label: "Text" },
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
        subtitle: { type: "textarea" as const, label: "Small line under (optional)" },
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
        caption: { type: "textarea" as const, label: "Placeholder caption" },
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

    Image: {
      label: "Image / screenshot",
      fields: {
        src: {
          type: "custom" as const,
          label: "Image",
          render: ({ onChange, value }) => (
            <ImageUpload value={value as string} onChange={onChange} />
          ),
        },
        alt: { type: "text" as const, label: "Alt text (describe the image)" },
        caption: { type: "textarea" as const, label: "Caption (optional)" },
        maxWidth: {
          type: "custom" as const,
          label: "Max width px (0 = full width)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={0} step={40} min={0} />
          ),
        },
        rounded: {
          type: "select" as const,
          label: "Rounded corners",
          options: [
            { label: "None", value: "0" },
            { label: "Small (8px)", value: "8px" },
            { label: "Large (16px)", value: "16px" },
            { label: "Full circle", value: "9999px" },
          ],
        },
        align: { ...ALIGN_FIELD, label: "Align" },
      },
      defaultProps: IMAGE_DEFAULTS,
      render: ({ src, alt, caption, maxWidth, rounded, align }) => {
        const alignItems = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
        const maxW = maxWidth && maxWidth > 0 ? `${maxWidth}px` : undefined;
        const radius = rounded || "16px";
        return (
          <figure style={{ display: "flex", flexDirection: "column", alignItems, marginTop: "1.5rem" }}>
            {src ? (
              <img
                src={src}
                alt={alt || ""}
                style={{
                  width: "100%",
                  maxWidth: maxW,
                  borderRadius: radius,
                  display: "block",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
                  objectFit: "contain" as const,
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  maxWidth: maxW,
                  borderRadius: radius,
                  aspectRatio: "4/3",
                  minHeight: "120px",
                  background: "#f3f4f6",
                  border: "2px dashed #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "14px",
                }}
              >
                {alt || "Image placeholder"}
              </div>
            )}
            {caption && (
              <figcaption style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
                {caption}
              </figcaption>
            )}
          </figure>
        );
      },
    },

    Conversation: {
      label: "Conversation (chat bubbles)",
      fields: {
        messages: {
          type: "array" as const,
          label: "Messages",
          arrayFields: {
            from: {
              type: "radio" as const,
              label: "From",
              options: [
                { label: "Chloe", value: "chloe" },
                { label: "Lead", value: "lead" },
              ],
            },
            text: { type: "textarea" as const, label: "Message" },
          },
          getItemSummary: (i: { from: string; text: string }) =>
            (i.text ? i.text.slice(0, 38) : i.from || "message"),
        },
        chloeLabel: { type: "text" as const, label: "Chloe's name label" },
        leadLabel: { type: "text" as const, label: "Lead's name label" },
        caption: { type: "textarea" as const, label: "Caption (below the thread)" },
      },
      defaultProps: CONVERSATION_DEFAULTS,
      render: ({ caption, chloeLabel, leadLabel, messages }) => (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "1.5rem" }}>
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#f5f5f7",
              borderRadius: "22px",
              padding: "18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              border: "1px solid #e5e7eb",
            }}
          >
            {(messages || []).map((m: { from: string; text: string }, i: number) => {
              const isChloe = (m.from || "chloe") === "chloe";
              return (
                <div
                  key={i}
                  style={{ display: "flex", flexDirection: "column", alignItems: isChloe ? "flex-end" : "flex-start" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      margin: isChloe ? "0 8px 2px 0" : "0 0 2px 8px",
                    }}
                  >
                    {isChloe ? chloeLabel || "Chloe" : leadLabel || "Lead"}
                  </span>
                  <div
                    style={{
                      maxWidth: "84%",
                      padding: "10px 15px",
                      borderRadius: "20px",
                      fontSize: "15px",
                      lineHeight: 1.4,
                      whiteSpace: "pre-wrap" as const,
                      background: isChloe ? "#2563eb" : "#e5e7eb",
                      color: isChloe ? "#ffffff" : "#111827",
                      borderBottomRightRadius: isChloe ? "5px" : "20px",
                      borderBottomLeftRadius: isChloe ? "20px" : "5px",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>
          {caption && (
            <p style={{ marginTop: "0.7rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center", maxWidth: "440px" }}>
              {caption}
            </p>
          )}
        </div>
      ),
    },

    // Wrapped homepage sections — each renders the real live component as a single
    // draggable/deletable block. (Their internal text becomes Puck-editable in a later pass.)
    HeroReel: {
      label: "Hero — sizzle reel",
      fields: {
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h1: { type: "textarea" as const, label: "Headline" },
        sub: { type: "textarea" as const, label: "Sub-paragraph" },
        fieldsLine: { type: "textarea" as const, label: "Breadth line" },
        ctaTitle: { type: "text" as const, label: "Button text" },
        ctaSubtitle: { type: "textarea" as const, label: "Button subtitle" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        ctaTitle: { type: "text" as const, label: "Button text" },
        ctaSubtitle: { type: "textarea" as const, label: "Button subtitle" },
      },
      defaultProps: NEXT_DEFAULTS,
      render: ({ eyebrow, h2, p1, p2, ctaTitle, ctaSubtitle }) => (
        <Next eyebrow={eyebrow} h2={h2} p1={p1} p2={p2} ctaTitle={ctaTitle} ctaSubtitle={ctaSubtitle} />
      ),
    },
    Platform: {
      label: "Above Any One Industry",
      fields: {
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2: { type: "textarea" as const, label: "Paragraph 2" },
        p3: { type: "textarea" as const, label: "Paragraph 3" },
        col1label: { type: "text" as const, label: "Column 1 label" },
        col1sub: { type: "textarea" as const, label: "Column 1 sub" },
        col2label: { type: "text" as const, label: "Column 2 label" },
        col2sub: { type: "textarea" as const, label: "Column 2 sub" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
        h2: { type: "textarea" as const, label: "Headline" },
        p1: { type: "textarea" as const, label: "Paragraph 1" },
        p2bold1: { type: "textarea" as const, label: "Bold opener" },
        p2mid: { type: "textarea" as const, label: "Mid text" },
        p2bold2: { type: "textarea" as const, label: "Bold mid" },
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
        eyebrow: { type: "textarea" as const, label: "Eyebrow" },
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
