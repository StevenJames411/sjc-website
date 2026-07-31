// Puck (visual page builder) block catalog for the /about pilot. Each block REUSES the
// site's own look: the same color vars, type scale, and the global `.btn-cta` button — so
// what Steven drags onto the canvas matches the live site. No "use client" here: this module
// is imported by BOTH the client editor (app/about/edit) and the server <Render> on the
// public /about page, so it must stay framework-neutral (types only from @measured/puck).
import type { Config, Data, Slot } from "@measured/puck";
import CtaButton from "@/components/CtaButton";
import RichText from "@/components/puck/RichText";
import SizeStepper from "@/components/puck/SizeStepper";
import ColorField from "@/components/puck/ColorField";
import ImageUpload from "@/components/puck/ImageUpload";
import NavView from "@/components/NavView";
import FooterView from "@/components/FooterView";
import Card, { CARD_DEFAULTS } from "@/components/blocks/Card";
import CheckList, { CHECKLIST_DEFAULTS } from "@/components/blocks/CheckList";
import PriceBox, { PRICEBOX_DEFAULTS } from "@/components/blocks/PriceBox";
import LeadForm, { LEADFORM_DEFAULTS } from "@/components/blocks/LeadForm";
import HeroImage, { HERO_IMAGE_DEFAULTS } from "@/components/blocks/HeroImage";
import DesignSection, {
  DESIGNSECTION_DEFAULTS,
  type DesignText,
  type DesignImage,
} from "@/components/blocks/DesignSection";
import Icon, { ICON_OPTIONS } from "@/components/blocks/Icon";
import { resolveColor, resolveColorOr } from "@/lib/brandColor";
import { telLink } from "@/lib/businessTokens";

type Align = "left" | "center" | "right";

// The props each block carries. Puck uses this to type the field editors AND the render
// functions (so `content` below is handed back as a render component for the nested slot).
type Props = {
  Section: { background: string; maxWidth: string; paddingTop: number; paddingBottom: number; decor: string; content: Slot };
  /** One section of a bought design, kept verbatim. Only its words and photos are editable. */
  DesignSection: { html: string; text: DesignText[]; images: DesignImage[] };
  // Generic, page-agnostic building blocks — compose these instead of hand-coding a section.
  Card: { badge: string; eyebrow: string; heading: string; body: string; icon: string; iconColor: string; badgeColor: string; badgePosition: string; centered: boolean; layout: string; bare: boolean; eyebrowSize: number; eyebrowColor: string; headingSize: number; headingColor: string; bodySize: number; bodyColor: string; eyebrowBold: boolean; headingBold: boolean; bodyBold: boolean; eyebrowCaps: boolean };
  HeroImage: {
    src: string; alt: string; height: number; tilt: number; glow: string; frame: string;
    radius: number; badgeTitle: string; badgeBody: string; pillText: string; pillColor: string;
    spaceAbove: number; spaceBelow: number;
  };
  CheckList: { dotColor: string; rows: { heading: string; body: string }[] };
  PriceBox: {
    topAmount: string;
    topNote: string;
    bottomAmount: string;
    bottomSuffix: string;
    bottomNote: string;
    footnote: string;
  };
  LeadForm: {
    source: string;
    fields: { label: string; inputType: string }[];
    buttonLabel: string;
    note: string;
    successHeading: string;
    successBody: string;
    buttonColor: string;
    inColumn: boolean;
  };
  Spacer: { height: number };
  Divider: { color: string; thickness: number; spacing: number };
  Columns: { columns: number; gap: number; col1: Slot; col2: Slot; col3: Slot };
  Heading: { text: string; fontSize: number; spaceAbove: number; spaceBelow: number; align: Align; color: string; underline: string; highlight: string; highlightColor: string };
  Text: { text: string; fontSize: number; spaceAbove: number; spaceBelow: number; align: Align; color: string; pill: string; pillBorder: string; icon: string; iconColor: string };
  Button: { title: string; subtitle: string; href: string; variant: string; shape: string; color: string; icon: string; align: Align; fullWidth: boolean };
  Video: { src: string; caption: string; poster: string };
  Image: { src: string; alt: string; caption: string; maxWidth: number; rounded: string; align: Align; spaceAbove: number; spaceBelow: number; linkUrl: string; openInNewTab: string; shape: string; zoom: number; focus: string };
  Conversation: { caption: string; chloeLabel: string; leadLabel: string; messages: { from: string; text: string }[] };
  StaffRoster: { businessName: string; rows: { name: string; email: string; role: string; isAI: boolean }[] };
  SiteFooter: { blurb: string; links: { label: string; target: string }[]; phone: string; phoneDisplay: string; email: string; privacyUrl: string; tosUrl: string; copyright: string; background: string; foreground: string; brandName: string; showLogo: boolean };
  PhoneLink: { label: string; tel: string };
  // Hero — now a props-driven block (text editable via fields). The rest below are still
  // "wrapped" as-is; they get the same treatment section by section.
  // The site navigation — fully editable in the builder (edit at /edit/nav, renders site-wide).
  SiteHeader: {
    brandName: string;
    brandHref: string;
    brandSize: number;
    tagline: string;
    taglineColor: string;
    taglineSize: number;
    links: { label: string; target: string; fontSize: number; color: string; newTab: boolean }[];
    ctaLabel: string;
    ctaHref: string;
    ctaNewTab: boolean;
    background: string;
    foreground: string;
    showLogo: boolean;
    ctaColor: string;
    brandIcon: string;
    brandIconColor: string;
  };
  // Intake-form building blocks (the /apply page). FormStep = one screen (a slot holding
  // FormQuestion blocks). The live /apply wizard reads this data and renders itself — these
  // renders are the in-editor preview only.
  FormStep: { title: string; content: Slot };
  FormQuestion: { label: string; questionType: string; options: { text: string }[]; required: boolean };
};

// The generic blocks declare optional props in their own components (so they're usable outside
// the builder); Puck wants them all present. These aliases keep the defaults honestly typed.
type CardBlock = Props["Card"];
type CheckListBlock = Props["CheckList"];
type PriceBoxBlock = Props["PriceBox"];
type LeadFormBlock = Props["LeadForm"];

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
    { label: "Off-white", value: "#f8fafc" },
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

// Where a link opens. Same tab for anything on this site; new tab for anywhere off it, so a
// visitor sent to an outside page (Skool, YouTube) still has the site sitting behind them.
const OPENS_IN_FIELD = {
  type: "radio" as const,
  label: "Opens in",
  options: [
    { label: "Same tab", value: false },
    { label: "New tab", value: true },
  ],
};

// How wide the content inside a Section band runs. Narrow reads best for paragraphs; wide is
// for card rows that need the room. Default matches the original fixed max-w-3xl.
const WIDTH_FIELD = {
  type: "select" as const,
  options: [
    { label: "Narrow (reading width)", value: "48rem" },
    { label: "Medium", value: "56rem" },
    { label: "Wide (card rows)", value: "64rem" },
    { label: "Full", value: "80rem" },
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
  brandHref: "/",
  brandSize: 16,
  tagline: "Your Native AI Implementation Partner",
  taglineColor: "#22c55e",
  taglineSize: 18,
  links: [] as { label: string; target: string; fontSize: number; color: string; newTab: boolean }[],
  ctaLabel: "See How It Works",
  ctaHref: "/#at-work",
  ctaNewTab: false,
  // Blank/true = today's SJC look. A client build overrides these; nothing already saved has
  // them, so every existing nav renders exactly as before.
  background: "",
  foreground: "",
  showLogo: true,
  ctaColor: "",
  brandIcon: "",
  brandIconColor: "",
};

// Single source of truth for the footer — used by the seed (so /edit/footer opens to it) AND
// Footer.tsx's fallback (so the live footer never renders blank if nothing's published).
export const FOOTER_DEFAULTS = {
  blurb:
    "Five businesses since 1986. Owner and tech lead in every one — now installing AI employees for the solo entrepreneur, done for you, on the software you already run.",
  links: [
    { label: "About Steven James — who I am & why listen", target: "/about" },
    { label: "FAQs", target: "/faqs" },
  ] as { label: string; target: string }[],
  phone: "+12108514906",
  phoneDisplay: "(210) 851-4906",
  email: "support@stevenjamesconsulting.com",
  privacyUrl: "https://www.privacypolicies.com/live/1cbbc5dd-5b42-4b68-abdd-a279a5e3b4f7",
  tosUrl: "https://www.privacypolicies.com/live/34bb5cc7-32b9-4449-ae32-7cfe78f34e45",
  copyright: "ARV Venture Group LLC Parent Company · Steven James Consulting",
  background: "",
  foreground: "",
  brandName: "",
  showLogo: true,
};

export const IMAGE_DEFAULTS = {
  src: "",
  alt: "",
  caption: "",
  maxWidth: 0,
  rounded: "16px",
  align: "center" as Align,
  spaceAbove: 24,
  spaceBelow: 0,
  linkUrl: "",
  openInNewTab: "yes",
  shape: "",
  zoom: 100,
  focus: "center",
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
    { name: "Nina Alvarez", email: "nina@acmehealthcare.com", role: "Nurse", isAI: false },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Speed-to-Lead — Finding", isAI: true },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Booking Agent — Closing", isAI: true },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Customer Success — Retaining", isAI: true },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Database Reactivation", isAI: true },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Front Desk & Phones", isAI: true },
    { name: "Chloe", email: "chloe@acmehealthcare.com", role: "Cross-Sell", isAI: true },
  ] as { name: string; email: string; role: string; isAI: boolean }[],
};

// ── PAGE SETTINGS (the root panel) ────────────────────────────────────────────────────────────
// What a page IS, as opposed to what's on it. These four show in the right-hand panel the moment
// the editor opens with no block selected — deliberately the first thing you see, because they
// used to live in code and could only be changed by a developer.
//
// They exist because of a real failure: a demo built for a business still previewed as "Steven
// James Consulting — AI employees for your business" when its link was texted, since a page with
// nothing of its own inherits the SJC site defaults from app/layout.tsx. Filling these in is what
// severs that inheritance. See generateMetadata in app/[slug]/page.tsx — it reads exactly these.
type RootProps = {
  title: string;
  description: string;
  businessName: string;
  shareImage: string;
};

export const config: Config<Props, RootProps> = {
  // Labels are written for the person filling them in, not for an SEO tool: they name WHERE the
  // text shows up, because that's the only thing that makes the field self-explanatory on sight.
  root: {
    fields: {
      title: {
        type: "text" as const,
        label: "Page title — the browser tab, and the bold line when this link is texted",
      },
      description: {
        type: "textarea" as const,
        label: "Preview text — the sentence under the title in a text message or Google result",
      },
      businessName: {
        type: "text" as const,
        label: "Business name — the source line on the preview card (leave blank on SJC's own pages)",
      },
      shareImage: {
        type: "custom" as const,
        label: "Preview image — the picture in the text-message card",
        render: ({ onChange, value }) => (
          <ImageUpload value={(value as string) || ""} onChange={onChange} />
        ),
      },
    },
  },
  // The parts bin, grouped so the everyday kit is on top and the one-off legacy sections
  // (built for specific pages before the generic blocks existed) stay collapsed out of the way.
  // A block NOT listed in any category falls into "other" automatically.
  categories: {
    building: {
      title: "Building blocks",
      defaultExpanded: true,
      components: ["Section", "Columns", "Heading", "Text", "Button", "Card", "CheckList",
                   "PriceBox", "Conversation", "Image", "HeroImage", "Video", "Spacer", "Divider",
                   "PhoneLink"] as (keyof Props)[],
    },
    forms: {
      title: "Forms",
      defaultExpanded: false,
      components: ["LeadForm", "FormStep", "FormQuestion"] as (keyof Props)[],
    },
    sitewide: {
      title: "Header & footer",
      defaultExpanded: false,
      components: ["SiteHeader", "SiteFooter"] as (keyof Props)[],
    },
    extras: {
      title: "Extras",
      defaultExpanded: false,
      components: ["StaffRoster"] as (keyof Props)[],
    },
    design: {
      title: "Imported design",
      defaultExpanded: false,
      components: ["DesignSection"] as (keyof Props)[],
    },
  },
  components: {
    // A section of a bought design. Created by the importer, not by dragging one on — an empty
    // one renders nothing, because there is no design in it to edit.
    DesignSection: {
      label: "Design section (imported)",
      fields: {
        text: {
          type: "array" as const,
          label: "Words on this section",
          getItemSummary: (item: DesignText, i) => item?.label || `Text ${(i ?? 0) + 1}`,
          arrayFields: {
            // Shown so you know which one you're editing; the value is the part you change.
            label: { type: "text" as const, label: "Where it appears" },
            value: { type: "textarea" as const, label: "Text" },
            key: { type: "text" as const, label: "Token (do not change)" },
          },
        },
        images: {
          type: "array" as const,
          label: "Photos on this section",
          getItemSummary: (item: DesignImage, i) => item?.alt || `Image ${(i ?? 0) + 1}`,
          arrayFields: {
            alt: { type: "text" as const, label: "Describe the photo (for Google + screen readers)" },
            src: {
              type: "custom" as const,
              label: "Photo",
              render: ({ onChange, value }) => (
                <ImageUpload value={value as string} onChange={onChange} />
              ),
            },
            key: { type: "text" as const, label: "Token (do not change)" },
          },
        },
        // Deliberately last and plain: this is the design itself. Editing it by hand is how you
        // break the layout you paid for.
        html: { type: "textarea" as const, label: "Markup (imported — leave this alone)" },
      },
      defaultProps: DESIGNSECTION_DEFAULTS as Props["DesignSection"],
      render: ({ html, text, images }) => (
        <DesignSection html={html} text={text} images={images} />
      ),
    },
    Card: {
      label: "Card (white box)",
      fields: {
        badge: { type: "text" as const, label: "Number badge (optional — e.g. 1)" },
        badgeColor: {
          type: "custom" as const,
          label: "Badge colour (blank = site blue)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        badgePosition: {
          type: "radio" as const,
          label: "Badge position",
          options: [
            { label: "Inside, top-left", value: "" },
            { label: "Floating on the top edge", value: "edge" },
          ],
        },
        icon: { type: "select" as const, label: "Icon", options: ICON_OPTIONS },
        iconColor: {
          type: "custom" as const,
          label: "Icon colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        // TYPE CONTROLS (2026-07-30). Each of the card's three text lines gets its own size and
        // colour, matching what the Text and Heading blocks already offer. Before this, wanting a
        // bigger eyebrow meant deleting it and stacking a separate Text box above the card — a
        // workaround that has to be rebuilt every time the row is touched. Blank/0 = the card's
        // built-in styling, so no existing card changes.
        eyebrow: { type: "text" as const, label: "Top line — small label (optional)" },
        // allowZero={false} + a fallback matching the card's REAL default size, so an untouched
        // field shows the size the text is actually rendering at (12/20/16) and steps from
        // there. With allowZero on it displayed a meaningless "0px" that "−" couldn't move.
        eyebrowSize: {
          type: "custom" as const,
          label: "Top line — size",
          render: ({ onChange, value }) => (
            <SizeStepper label="Label size" value={value as number} onChange={onChange} fallback={12} step={2} min={8} allowZero={false} />
          ),
        },
        eyebrowColor: {
          type: "custom" as const,
          label: "Top line — colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        eyebrowBold: {
          type: "radio" as const,
          label: "Top line — weight",
          options: [
            { label: "Bold", value: true },
            { label: "Normal", value: false },
          ],
        },
        eyebrowCaps: {
          type: "radio" as const,
          label: "Top line — letters",
          options: [
            { label: "ALL CAPS", value: true },
            { label: "Normal case", value: false },
          ],
        },
        heading: { type: "textarea" as const, label: "Middle line — the card's heading (an H3 for Google)" },
        headingSize: {
          type: "custom" as const,
          label: "Middle line — size",
          render: ({ onChange, value }) => (
            <SizeStepper label="Heading size" value={value as number} onChange={onChange} fallback={20} step={2} min={10} allowZero={false} />
          ),
        },
        headingColor: {
          type: "custom" as const,
          label: "Middle line — colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        headingBold: {
          type: "radio" as const,
          label: "Middle line — weight",
          options: [
            { label: "Bold", value: true },
            { label: "Normal", value: false },
          ],
        },
        body: { type: "textarea" as const, label: "Bottom line — paragraph" },
        bodySize: {
          type: "custom" as const,
          label: "Bottom line — size",
          render: ({ onChange, value }) => (
            <SizeStepper label="Body size" value={value as number} onChange={onChange} fallback={16} step={2} min={10} allowZero={false} />
          ),
        },
        bodyColor: {
          type: "custom" as const,
          label: "Bottom line — colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        bodyBold: {
          type: "radio" as const,
          label: "Bottom line — weight",
          options: [
            { label: "Bold", value: true },
            { label: "Normal", value: false },
          ],
        },
        centered: {
          type: "radio" as const,
          label: "Text",
          options: [
            { label: "Left", value: false },
            { label: "Centered", value: true },
          ],
        },
        layout: {
          type: "radio" as const,
          label: "Layout",
          options: [
            { label: "Stacked (icon above)", value: "" },
            { label: "Row (icon beside — contact details)", value: "row" },
          ],
        },
        bare: {
          type: "radio" as const,
          label: "Card box",
          options: [
            { label: "White box", value: false },
            { label: "No box (sits on the band)", value: true },
          ],
        },
      },
      defaultProps: CARD_DEFAULTS as CardBlock,
      render: ({ badge, eyebrow, heading, body, icon, iconColor, badgeColor, badgePosition, centered, layout, bare, eyebrowSize, eyebrowColor, headingSize, headingColor, bodySize, bodyColor, eyebrowBold, headingBold, bodyBold, eyebrowCaps }) => (
        <Card
          badge={badge} eyebrow={eyebrow} heading={heading} body={body}
          icon={icon} iconColor={iconColor} badgeColor={badgeColor}
          badgePosition={badgePosition} centered={centered}
          layout={layout} bare={bare}
          eyebrowSize={eyebrowSize} eyebrowColor={eyebrowColor}
          headingSize={headingSize} headingColor={headingColor}
          bodySize={bodySize} bodyColor={bodyColor}
          eyebrowBold={eyebrowBold} headingBold={headingBold} bodyBold={bodyBold}
          eyebrowCaps={eyebrowCaps}
        />
      ),
    },

    CheckList: {
      label: "Checklist (dot + line)",
      fields: {
        dotColor: {
          type: "select" as const,
          label: "Dot color",
          options: [
            { label: "Green", value: "#22c55e" },
            { label: "Blue", value: "#2563eb" },
            { label: "Ink", value: "#111827" },
          ],
        },
        rows: {
          type: "array" as const,
          label: "Items",
          arrayFields: {
            heading: { type: "text" as const, label: "Bold line" },
            body: { type: "textarea" as const, label: "Supporting line" },
          },
          getItemSummary: (i: { heading?: string }) => i?.heading || "item",
          defaultItemProps: { heading: "New item", body: "What it means for them." },
        },
      },
      defaultProps: CHECKLIST_DEFAULTS as CheckListBlock,
      render: ({ dotColor, rows }) => <CheckList dotColor={dotColor} rows={rows} />,
    },

    PriceBox: {
      label: "Price box",
      fields: {
        topAmount: { type: "text" as const, label: "Top price (e.g. $795)" },
        topNote: { type: "text" as const, label: "Line under the top price" },
        bottomAmount: { type: "text" as const, label: "Second price (leave blank for one price)" },
        bottomSuffix: { type: "text" as const, label: "Suffix (e.g. /month)" },
        bottomNote: { type: "text" as const, label: "Line under the second price" },
        footnote: { type: "textarea" as const, label: "Small print underneath" },
      },
      defaultProps: PRICEBOX_DEFAULTS as PriceBoxBlock,
      render: ({ topAmount, topNote, bottomAmount, bottomSuffix, bottomNote, footnote }) => (
        <PriceBox
          topAmount={topAmount}
          topNote={topNote}
          bottomAmount={bottomAmount}
          bottomSuffix={bottomSuffix}
          bottomNote={bottomNote}
          footnote={footnote}
        />
      ),
    },

    LeadForm: {
      label: "Lead form (name / phone / etc.)",
      fields: {
        source: { type: "text" as const, label: "Source tag (shows in the intake sheet)" },
        fields: {
          type: "array" as const,
          label: "Questions",
          arrayFields: {
            label: { type: "text" as const, label: "Question" },
            inputType: {
              type: "select" as const,
              label: "Answer type",
              options: [
                { label: "Short text", value: "text" },
                { label: "Phone", value: "tel" },
                { label: "Email", value: "email" },
              ],
            },
          },
          getItemSummary: (i: { label?: string }) => i?.label || "question",
          defaultItemProps: { label: "New question", inputType: "text" },
        },
        buttonLabel: { type: "text" as const, label: "Button text" },
        note: { type: "textarea" as const, label: "Small line under the button" },
        successHeading: { type: "text" as const, label: "Thank-you heading" },
        successBody: { type: "textarea" as const, label: "Thank-you body" },
        buttonColor: {
          type: "custom" as const,
          label: "Submit button colour (blank = site blue)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        inColumn: {
          type: "radio" as const,
          label: "Width",
          options: [
            { label: "Centred island", value: false },
            { label: "Fill the column", value: true },
          ],
        },
      },
      defaultProps: LEADFORM_DEFAULTS as LeadFormBlock,
      render: ({ source, fields, buttonLabel, note, successHeading, successBody, buttonColor, inColumn }) => (
        <LeadForm
          source={source}
          fields={fields}
          buttonLabel={buttonLabel}
          note={note}
          successHeading={successHeading}
          successBody={successBody}
          buttonColor={buttonColor}
          inColumn={inColumn}
        />
      ),
    },

    FormStep: {
      label: "Form step (one screen)",
      fields: {
        title: { type: "text" as const, label: "Step heading" },
        content: { type: "slot" as const },
      },
      defaultProps: { title: "New step", content: [] },
      render: ({ title, content: Content }) => (
        <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 16, margin: "12px 0", background: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#2563eb", marginBottom: 6 }}>
            Form step
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 10 }}>{title || "Step"}</div>
          <Content />
        </div>
      ),
    },

    FormQuestion: {
      label: "Question",
      fields: {
        label: { type: "text" as const, label: "Question / label" },
        questionType: {
          type: "select" as const,
          label: "Answer type",
          options: [
            { label: "Short text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
            { label: "Single choice (pick one)", value: "choice" },
            { label: "Multiple choice (check all that apply)", value: "multi" },
          ],
        },
        options: {
          type: "array" as const,
          label: "Answer options (single or multiple choice)",
          arrayFields: { text: { type: "text" as const, label: "Option" } },
          getItemSummary: (i: { text?: string }) => i?.text || "option",
          defaultItemProps: { text: "New option" },
        },
        required: {
          type: "radio" as const,
          label: "Required?",
          options: [
            { label: "No", value: false },
            { label: "Yes", value: true },
          ],
        },
      },
      defaultProps: { label: "New question", questionType: "text", options: [], required: true },
      render: ({ label, questionType, options, required }) => {
        const opts = Array.isArray(options) ? options : [];
        const typeLabel =
          questionType === "email" ? "Email" :
          questionType === "phone" ? "Phone" :
          questionType === "choice" ? "Single choice" :
          questionType === "multi" ? "Multiple choice" : "Short text";
        return (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", margin: "8px 0", background: "#f8fafc" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
              {label || "Question"}{required ? " *" : ""}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{typeLabel}</div>
            {(questionType === "choice" || questionType === "multi") && opts.length > 0 ? (
              <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 12, color: "#4b5563" }}>
                {opts.map((o, i) => <li key={i}>{o?.text || "—"}</li>)}
              </ul>
            ) : null}
          </div>
        );
      },
    },

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

    SiteFooter: {
      label: "Site footer",
      fields: {
        blurb: { type: "textarea" as const, label: "Bio blurb (who you are, brief)" },
        links: {
          type: "array" as const,
          label: "Footer links (add / delete)",
          arrayFields: {
            label: { type: "text" as const, label: "Label" },
            target: { type: "text" as const, label: "Links to (page or /#section)" },
          },
          getItemSummary: (i: { label?: string }) => i?.label || "link",
          defaultItemProps: { label: "New link", target: "/" },
        },
        phone: { type: "text" as const, label: "Phone — raw for Call/Text (e.g. +12108514906)" },
        phoneDisplay: { type: "text" as const, label: "Phone — display (e.g. (210) 851-4906)" },
        email: { type: "text" as const, label: "Email" },
        privacyUrl: { type: "text" as const, label: "Privacy Policy URL" },
        tosUrl: { type: "text" as const, label: "Terms of Service URL" },
        copyright: { type: "text" as const, label: "Copyright line" },
        // Same story as the header — blank keeps SJC's look, set them for a client build.
        background: {
          type: "custom" as const,
          label: "Footer band colour (blank = SJC near-black)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        foreground: {
          type: "custom" as const,
          label: "Footer text colour (blank = white)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        brandName: { type: "text" as const, label: "Business name (blank = Steven James Consulting)" },
        showLogo: {
          type: "radio" as const,
          label: "SJC logo",
          options: [
            { label: "Show", value: true },
            { label: "Hide (client site)", value: false },
          ],
        },
      },
      defaultProps: FOOTER_DEFAULTS,
      render: ({ blurb, links, phone, phoneDisplay, email, privacyUrl, tosUrl, copyright, background, foreground, brandName, showLogo }) => (
        <FooterView
          blurb={blurb}
          links={links}
          phone={phone}
          phoneDisplay={phoneDisplay}
          email={email}
          privacyUrl={privacyUrl}
          tosUrl={tosUrl}
          copyright={copyright}
          background={background}
          foreground={foreground}
          brandName={brandName}
          showLogo={showLogo}
        />
      ),
    },

    SiteHeader: {
      label: "Site header / nav",
      fields: {
        brandName: { type: "text" as const, label: "Business name" },
        brandHref: {
          type: "text" as const,
          label: "Logo + name links to (\"/\" for home; on a sales page, that page's own URL)",
        },
        brandSize: {
          type: "custom" as const,
          label: "Business name size (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper value={value as number} onChange={onChange} fallback={16} step={1} min={12} />
          ),
        },
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
            newTab: { ...OPENS_IN_FIELD },
          },
          getItemSummary: (i: { label?: string }) => i?.label || "link",
          defaultItemProps: { label: "New link", target: "/", fontSize: 14, color: "#ffffff", newTab: false },
        },
        ctaLabel: { type: "text" as const, label: "Button label (leave blank to hide)" },
        ctaHref: { type: "text" as const, label: "Button links to" },
        ctaNewTab: { ...OPENS_IN_FIELD },
        // ── WHOSE SITE IS THIS ────────────────────────────────────────────────────────────
        // Blank = SJC's own look. Set these on a client build so their header isn't wearing
        // our navy. Existing nav documents have none of them saved, so they render unchanged.
        background: {
          type: "custom" as const,
          label: "Header band colour (blank = SJC navy)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        foreground: {
          type: "custom" as const,
          label: "Header text colour (blank = white)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        showLogo: {
          type: "radio" as const,
          label: "SJC logo",
          options: [
            { label: "Show", value: true },
            { label: "Hide (client site)", value: false },
          ],
        },
        ctaColor: {
          type: "custom" as const,
          label: "Button colour (blank = SJC blue)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        brandIcon: { type: "select" as const, label: "Mark beside the name (client sites)", options: ICON_OPTIONS },
        brandIconColor: {
          type: "custom" as const,
          label: "Mark colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
      },
      defaultProps: NAV_DEFAULTS,
      render: ({ brandName, brandHref, brandSize, tagline, taglineColor, taglineSize, links, ctaLabel, ctaHref, ctaNewTab, background, foreground, showLogo, ctaColor, brandIcon, brandIconColor }) => (
        <NavView
          brandName={brandName}
          brandHref={brandHref}
          brandSize={brandSize}
          tagline={tagline}
          taglineColor={taglineColor}
          taglineSize={taglineSize}
          links={links}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          ctaNewTab={ctaNewTab}
          background={background}
          foreground={foreground}
          showLogo={showLogo}
          ctaColor={ctaColor}
          brandIcon={brandIcon}
          brandIconColor={brandIconColor}
        />
      ),
    },

    Section: {
      label: "Section (band)",
      fields: {
        background: { ...BG_FIELD, label: "Background" },
        maxWidth: { ...WIDTH_FIELD, label: "Content width" },
        paddingTop: {
          type: "custom" as const,
          label: "Padding top (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Padding top" value={value as number} onChange={onChange} fallback={64} step={8} min={0} />
          ),
        },
        paddingBottom: {
          type: "custom" as const,
          label: "Padding bottom (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Padding bottom" value={value as number} onChange={onChange} fallback={64} step={8} min={0} />
          ),
        },
        // Soft colour washes bleeding in from the corners. Blank = off, which is what every
        // existing Section has saved, so nothing already built changes.
        decor: {
          type: "custom" as const,
          label: "Corner glow (blank = none)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        content: { type: "slot" as const },
      },
      defaultProps: { background: "#ffffff", maxWidth: "48rem", paddingTop: 64, paddingBottom: 64, decor: "", content: [] },
      render: ({ id, background, maxWidth, paddingTop, paddingBottom, decor, content: Content }) => (
        <section
          id={typeof id === "string" ? id : undefined}
          style={{ backgroundColor: resolveColor(background) }}
          className={`w-full scroll-mt-20${decor ? " relative overflow-hidden" : ""}`}
        >
          {/* Two large blurred circles, opposite corners, pointer-events-none so they can never
              swallow a click on anything sitting above them. */}
          {decor ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-32 -top-32 h-[36rem] w-[36rem] rounded-full blur-3xl"
                style={{ background: resolveColor(decor), opacity: 0.12 }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
                style={{ background: resolveColor(decor), opacity: 0.08 }}
              />
            </>
          ) : null}
          <div
            className={`mx-auto px-6${decor ? " relative z-10" : ""}`}
            style={{
              // Existing pages have no maxWidth saved — fall back to the old max-w-3xl so nothing shifts.
              maxWidth: maxWidth || "48rem",
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
            <SizeStepper label="Height" value={value as number} onChange={onChange} fallback={32} step={8} min={0} />
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
        thickness: {
          type: "custom" as const,
          label: "Thickness (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Thickness" value={value as number} onChange={onChange} fallback={1} step={1} min={1} />
          ),
        },
        spacing: {
          type: "custom" as const,
          label: "Space above/below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Spacing" value={value as number} onChange={onChange} fallback={24} step={4} min={0} />
          ),
        },
      },
      defaultProps: { color: "#e5e7eb", thickness: 1, spacing: 24 },
      render: ({ color, thickness, spacing }) => (
        <div style={{ padding: `${typeof spacing === "number" ? spacing : 24}px 0` }}>
          <hr style={{ border: "none", borderTop: `${typeof thickness === "number" ? thickness : 1}px solid ${resolveColorOr(color, "#e5e7eb")}`, margin: 0 }} />
        </div>
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
            <SizeStepper label="Gap between columns" value={value as number} onChange={onChange} fallback={24} step={4} min={0} />
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
            <SizeStepper label="Font size" allowZero={false} value={value as number} onChange={onChange} fallback={32} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space above" value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space below" value={value as number} onChange={onChange} fallback={12} step={4} min={0} />
          ),
        },
        align: { ...ALIGN_FIELD, label: "Align" },
        color: {
          type: "custom" as const,
          label: "Color",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        // TWO-TONE — type the words you want in the accent colour and they get picked out of the
        // headline. A flat single-colour headline is the biggest thing separating a template
        // from a designed page, and it costs one text field.
        highlight: { type: "text" as const, label: "Words to colour differently (blank = none)" },
        highlightColor: {
          type: "custom" as const,
          label: "Highlight colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        // The hand-drawn swipe under a headline. Blank = off, which is what every existing
        // heading on the site has saved, so nothing already built changes.
        underline: {
          type: "custom" as const,
          label: "Hand-drawn underline (blank = none)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
      },
      defaultProps: { text: "New heading", fontSize: 0, spaceAbove: 0, spaceBelow: 12, align: "left" as const, color: "#111827", underline: "", highlight: "", highlightColor: "" },
      render: ({ text, fontSize, spaceAbove, spaceBelow, align, color, underline, highlight, highlightColor }) => {
        const px = fontSize && fontSize > 0 ? fontSize : 32;

        // The marker swipe. A straight rule reads like a border; this reads like someone drew it.
        const swipeUnder = (inner: React.ReactNode, key?: string) => (
          <span key={key} className="relative inline-block">
            <span className="relative z-10">{inner}</span>
            <svg
              aria-hidden
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              className="absolute left-0 w-full"
              style={{ bottom: `-${Math.round(px * 0.08)}px`, height: `${Math.round(px * 0.22)}px`, color: resolveColor(underline), zIndex: 0 }}
            >
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent" strokeLinecap="round" />
            </svg>
          </span>
        );

        // Split the headline around the highlighted words. Case-insensitive, so "premier pet wash"
        // finds "Premier Pet Wash"; if the words aren't in the text we render it unchanged rather
        // than silently dropping anything.
        //
        // When BOTH a highlight and an underline are set, the swipe goes under the highlighted
        // words only — not the whole headline. That's the move the design actually makes: one
        // phrase picked out in colour with a stroke under it, the rest left alone.
        const hl = (highlight || "").trim();
        const at = hl && highlightColor ? String(text || "").toLowerCase().indexOf(hl.toLowerCase()) : -1;

        let body: React.ReactNode;
        if (at >= 0) {
          const marked = (
            <span key="hl" style={{ color: resolveColor(highlightColor) }}>
              {text.slice(at, at + hl.length)}
            </span>
          );
          body = [
            text.slice(0, at),
            underline ? swipeUnder(marked, "hl-wrap") : marked,
            text.slice(at + hl.length),
          ];
        } else {
          body = underline ? swipeUnder(text) : text;
        }
        return (
          <h2
            className="font-bold leading-tight tracking-tight"
            style={{
              fontSize: `${px}px`,
              textAlign: align,
              color: resolveColorOr(color, "#111827"),
              marginTop: 0,
              marginBottom: 0,
              paddingTop: `${typeof spaceAbove === "number" ? spaceAbove : 0}px`,
              paddingBottom: `${typeof spaceBelow === "number" ? spaceBelow : 12}px`,
            }}
          >
            {body}
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
            <SizeStepper label="Font size" allowZero={false} value={value as number} onChange={onChange} fallback={18} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space above" value={value as number} onChange={onChange} fallback={16} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space below" value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
        align: { ...ALIGN_FIELD, label: "Align" },
        color: { ...COLOR_FIELD, label: "Default color (whole block)" },
        // PILL MODE — turns a line of text into the little bordered badge a good design uses for
        // a star rating or an address. Blank = an ordinary paragraph, which is what every
        // existing Text block on the site has saved.
        pill: {
          type: "custom" as const,
          label: "Pill background (blank = plain text)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        pillBorder: {
          type: "custom" as const,
          label: "Pill border colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        icon: { type: "select" as const, label: "Icon before the text", options: ICON_OPTIONS },
        iconColor: {
          type: "custom" as const,
          label: "Icon colour",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
      },
      defaultProps: {
        text: "New paragraph. Select any word and use the toolbar to format it.",
        fontSize: 0,
        spaceAbove: 16,
        spaceBelow: 0,
        align: "left" as const,
        color: "#111827",
        pill: "",
        pillBorder: "",
        icon: "",
        iconColor: "",
      },
      render: ({ text, fontSize, spaceAbove, spaceBelow, align, color, pill, pillBorder, icon, iconColor }) => {
        const pad = {
          paddingTop: `${typeof spaceAbove === "number" ? spaceAbove : 16}px`,
          paddingBottom: `${typeof spaceBelow === "number" ? spaceBelow : 0}px`,
        };
        const size = `${fontSize && fontSize > 0 ? fontSize : 18}px`;
        const body = (
          <span className="rt" style={{ fontSize: size }} dangerouslySetInnerHTML={{ __html: text }} />
        );

        // Plain paragraph — byte-identical to before when no pill and no icon are set.
        if (!pill && !pillBorder && !icon) {
          return (
            <div
              className="rt leading-relaxed"
              style={{ textAlign: align, color: resolveColorOr(color, "#111827"), marginTop: 0, marginBottom: 0, ...pad, fontSize: size }}
              dangerouslySetInnerHTML={{ __html: text }}
            />
          );
        }

        const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
        return (
          <div className="flex" style={{ justifyContent: justify, ...pad }}>
            <span
              className={`inline-flex items-center gap-2 leading-snug${pill || pillBorder ? " rounded-full px-4 py-2" : ""}`}
              style={{
                color: resolveColorOr(color, "#111827"),
                background: pill || undefined,
                border: pillBorder ? `1px solid ${resolveColor(pillBorder)}` : undefined,
                boxShadow: pill || pillBorder ? "0 1px 2px rgba(0,0,0,0.05)" : undefined,
              }}
            >
              <Icon name={icon} size={Math.round((fontSize && fontSize > 0 ? fontSize : 18) * 0.95)} style={{ color: resolveColor(iconColor) }} />
              {body}
            </span>
          </div>
        );
      },
    },

    // Every field here defaults to blank/empty, and blank means "render exactly as before" —
    // the old .btn-cta, centred, no icon. Existing pages have none of these saved, so nothing
    // already built moves. Set them and you get the pill/outline/icon treatments a real design
    // uses (a filled Book button next to an outlined Call button with a phone icon).
    Button: {
      label: "Call-to-action button",
      fields: {
        title: { type: "text" as const, label: "Button text" },
        subtitle: { type: "textarea" as const, label: "Small line under (optional)" },
        href: { type: "text" as const, label: "Link" },
        icon: { type: "select" as const, label: "Icon", options: ICON_OPTIONS },
        variant: {
          type: "radio" as const,
          label: "Style",
          options: [
            { label: "Site default", value: "" },
            { label: "Filled", value: "filled" },
            { label: "Outlined", value: "outline" },
          ],
        },
        shape: {
          type: "radio" as const,
          label: "Shape",
          options: [
            { label: "Rounded", value: "" },
            { label: "Pill", value: "pill" },
          ],
        },
        color: {
          type: "custom" as const,
          label: "Button colour (blank = site default)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        align: { ...ALIGN_FIELD, label: "Align" },
        fullWidth: {
          type: "radio" as const,
          label: "Width",
          options: [
            { label: "Fit text", value: false },
            { label: "Full width", value: true },
          ],
        },
      },
      defaultProps: {
        title: "Book the Call",
        subtitle: "",
        href: "/#contact",
        icon: "",
        variant: "",
        shape: "",
        color: "",
        align: "center" as Align,
        fullWidth: false,
      },
      render: ({ title, subtitle, href, icon, variant, shape, color, align, fullWidth }) => {
        // No styling chosen => the original button, untouched.
        if (!variant && !shape && !color && !icon) {
          return (
            <div className="mt-8 flex justify-center">
              <CtaButton title={title} subtitle={subtitle || undefined} href={href} />
            </div>
          );
        }
        const accent = resolveColorOr(color, "#2563eb");
        const outlined = variant === "outline";
        const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
        return (
          <div className="mt-6 flex" style={{ justifyContent: justify }}>
            <a
              href={href || "#"}
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 font-bold transition-all hover:-translate-y-0.5${
                shape === "pill" ? " rounded-full" : " rounded-xl"
              }${fullWidth ? " w-full" : ""}`}
              style={
                outlined
                  ? { border: `2px solid ${accent}`, color: accent, background: "#ffffff" }
                  : { background: accent, color: "#ffffff", boxShadow: accent.startsWith("var(") ? "0 8px 20px -6px rgba(0,0,0,0.25)" : `0 8px 20px -6px ${accent}80` }
              }
            >
              <span className="flex flex-col items-center leading-tight">
                <span className="flex items-center gap-2">
                  {title}
                  <Icon name={icon} size={18} />
                </span>
                {subtitle ? <span className="text-xs font-medium opacity-80">{subtitle}</span> : null}
              </span>
            </a>
          </div>
        );
      },
    },

    PhoneLink: {
      label: "Phone link",
      fields: {
        label: { type: "text" as const, label: "Text" },
        tel: { type: "text" as const, label: "Phone number (digits, e.g. +12108514906)" },
      },
      defaultProps: {
        label: "Or call me directly: (210) 851-4906",
        tel: "+12108514906",
      },
      render: ({ label, tel }) => (
        <div className="mt-4 text-center">
          <a
            href={telLink(tel)}
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
        src: { type: "text" as const, label: "Video URL — MP4 (Blob) or YouTube/Vimeo embed; blank = placeholder" },
        poster: {
          type: "custom" as const,
          label: "Poster image (optional) — thumbnail before play; blank = auto first frame",
          render: ({ onChange, value }) => (
            <ImageUpload value={value as string} onChange={onChange} />
          ),
        },
        caption: { type: "textarea" as const, label: "Placeholder caption" },
      },
      defaultProps: { src: "", poster: "", caption: "2-minute teaser — coming" },
      render: ({ src, caption, poster }) => {
        const isFile = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src) || src.includes("blob.vercel-storage");
        // No poster set: append a #t=0.1 media fragment so Safari renders the first frame
        // instead of a black box (Chrome does this on its own; Safari needs the nudge).
        const videoSrc = poster || src.includes("#") ? src : `${src}#t=0.1`;
        return (
          <div className="mx-auto mt-9 aspect-video max-w-3xl overflow-hidden rounded-2xl border border-white/15 bg-black/40">
            {src ? (
              isFile ? (
                <video src={videoSrc} poster={poster || undefined} controls playsInline preload="metadata" className="h-full w-full" />
              ) : (
                <iframe src={src} className="h-full w-full" allowFullScreen title="Video" />
              )
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/70">
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 text-2xl">
                  &#9654;
                </span>
                <span className="text-sm uppercase tracking-[0.18em]">{caption}</span>
              </div>
            )}
          </div>
        );
      },
    },

    // The hero photo treatment — tilt, glow, white frame, and up to two cards floating on the
    // photo's corners. Separate from Image because the badges sit ON the photo and therefore have
    // to live in the same box; assembling that from loose blocks would need absolute-position
    // controls in the builder. Every effect is optional, so this also renders a plain photo.
    HeroImage: {
      label: "Hero photo (tilt + floating cards)",
      fields: {
        src: {
          type: "custom" as const,
          label: "Photo",
          render: ({ onChange, value }) => (
            <ImageUpload value={value as string} onChange={onChange} />
          ),
        },
        alt: { type: "text" as const, label: "Alt text (describe the photo)" },
        height: {
          type: "custom" as const,
          label: "Photo height (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Height" value={value as number} onChange={onChange} fallback={560} step={20} min={160} allowZero={false} />
          ),
        },
        tilt: {
          type: "select" as const,
          label: "Tilt",
          options: [
            { label: "Straight", value: 0 },
            { label: "Slight right (2°)", value: 2 },
            { label: "Right (3°)", value: 3 },
            { label: "Slight left (−2°)", value: -2 },
            { label: "Left (−3°)", value: -3 },
          ],
        },
        radius: {
          type: "custom" as const,
          label: "Corner rounding (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Corner rounding" value={value as number} onChange={onChange} fallback={40} step={4} min={0} />
          ),
        },
        frame: {
          type: "select" as const,
          label: "White frame",
          options: [
            { label: "White frame", value: "#ffffff" },
            { label: "No frame", value: "" },
          ],
        },
        glow: {
          type: "custom" as const,
          label: "Glow behind photo (blank = none)",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        badgeTitle: { type: "text" as const, label: "Floating card — bold line (blank = hide)" },
        badgeBody: { type: "text" as const, label: "Floating card — small line" },
        pillText: { type: "text" as const, label: "Corner pill — e.g. Open Today (blank = hide)" },
        pillColor: {
          type: "custom" as const,
          label: "Corner pill color",
          render: ({ onChange, value }) => (
            <ColorField value={value as string} onChange={onChange} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space above" value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space below" value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
          ),
        },
      },
      defaultProps: HERO_IMAGE_DEFAULTS,
      // Destructured rather than spread: Puck also injects `puck`, `editMode` and `id` into every
      // render, and HeroImage only accepts its own props.
      render: ({ src, alt, height, tilt, glow, frame, radius, badgeTitle, badgeBody, pillText, pillColor, spaceAbove, spaceBelow }) => (
        <HeroImage
          src={src} alt={alt} height={height} tilt={tilt} glow={glow} frame={frame} radius={radius}
          badgeTitle={badgeTitle} badgeBody={badgeBody} pillText={pillText} pillColor={pillColor}
          spaceAbove={spaceAbove} spaceBelow={spaceBelow}
        />
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
        // CROPPING, WITHOUT TOUCHING THE FILE. A phone screen in a wide photo is unreadable in a
        // narrow card because most of the frame is blurred background. Re-cropping the file in an
        // image editor and re-uploading works, and it means every reframe goes through Claude.
        // These three do it live: pick a shape, zoom in, choose what stays in view. The original
        // upload is never altered, so nothing is lost and it can be undone by setting Shape to
        // "Whole image".
        shape: {
          type: "select" as const,
          label: "Shape — crop the image to fit",
          options: [
            { label: "Whole image (no crop)", value: "" },
            { label: "Landscape 4:3", value: "4/3" },
            { label: "Wide 16:9", value: "16/9" },
            { label: "Square", value: "1/1" },
            { label: "Tall 3:4", value: "3/4" },
          ],
        },
        zoom: {
          type: "custom" as const,
          label: "Zoom % (100 = fit, higher = closer)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Zoom %" value={value as number} onChange={onChange} fallback={100} step={10} min={100} allowZero={false} />
          ),
        },
        focus: {
          type: "select" as const,
          label: "Keep in view — what the crop centres on",
          options: [
            { label: "Centre", value: "center" },
            { label: "Top", value: "top" },
            { label: "Bottom", value: "bottom" },
            { label: "Left", value: "left" },
            { label: "Right", value: "right" },
            { label: "Top left", value: "left top" },
            { label: "Top right", value: "right top" },
            { label: "Bottom left", value: "left bottom" },
            { label: "Bottom right", value: "right bottom" },
          ],
        },
        alt: { type: "text" as const, label: "Alt text (describe the image)" },
        caption: { type: "textarea" as const, label: "Caption (optional)" },
        maxWidth: {
          type: "custom" as const,
          label: "Max width px (0 = full width)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Max width (0 = full)" value={value as number} onChange={onChange} fallback={0} step={40} min={0} />
          ),
        },
        spaceAbove: {
          type: "custom" as const,
          label: "Space above (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space above" value={value as number} onChange={onChange} fallback={24} step={4} min={0} />
          ),
        },
        spaceBelow: {
          type: "custom" as const,
          label: "Space below (− / +)",
          render: ({ onChange, value }) => (
            <SizeStepper label="Space below" value={value as number} onChange={onChange} fallback={0} step={4} min={0} />
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
        linkUrl: { type: "text" as const, label: "Link URL (make the image clickable)" },
        openInNewTab: {
          type: "radio" as const,
          label: "Open link in…",
          options: [
            { label: "New tab", value: "yes" },
            { label: "Same tab", value: "no" },
          ],
        },
      },
      defaultProps: IMAGE_DEFAULTS,
      render: ({ src, alt, caption, maxWidth, rounded, align, spaceAbove, spaceBelow, linkUrl, openInNewTab, shape, zoom, focus }) => {
        const alignItems = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
        const maxW = maxWidth && maxWidth > 0 ? `${maxWidth}px` : undefined;
        const radius = rounded || "16px";
        // No shape chosen => the original behaviour exactly: the whole image, letterboxed to fit.
        // A shape turns on cropping — the frame holds the aspect ratio, the image covers it, and
        // zoom/focus decide which part you see. Nothing is written back to the file.
        const z = typeof zoom === "number" && zoom > 100 ? zoom : 100;
        const pos = focus || "center";
        const img = src ? (
          shape ? (
            <div
              style={{
                width: "100%",
                maxWidth: maxW,
                aspectRatio: shape,
                overflow: "hidden",
                borderRadius: radius,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
              }}
            >
              <img
                src={src}
                alt={alt || ""}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: "cover" as const,
                  objectPosition: pos,
                  // Scale from the same point the crop favours, so zooming in does not drift
                  // away from whatever you asked to keep in view.
                  transform: z > 100 ? `scale(${z / 100})` : undefined,
                  transformOrigin: pos,
                }}
              />
            </div>
          ) : (
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
          )
        ) : null;
        // When a Link URL is set, the image becomes a clickable link (new tab by default).
        // Empty Link URL => bare image, exactly as before (zero change to existing pages).
        const linked = img && linkUrl ? (
          <a
            href={linkUrl}
            target={openInNewTab === "no" ? undefined : "_blank"}
            rel="noopener noreferrer"
            style={{ display: "block", width: "100%", maxWidth: maxW, cursor: "pointer" }}
          >
            {img}
          </a>
        ) : (
          img
        );
        return (
          <figure style={{ display: "flex", flexDirection: "column", alignItems, marginTop: 0, marginBottom: 0, paddingTop: `${typeof spaceAbove === "number" ? spaceAbove : 24}px`, paddingBottom: `${typeof spaceBelow === "number" ? spaceBelow : 0}px` }}>
            {src ? (
              linked
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
      label: "Chat bubbles (text conversation)",
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
    // Med-Spa page sections — full field schemas, copy editable in the builder.
    // Industry deep page (HVAC / Roofing / Garage Doors …) — full template, copy editable.
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
            props: { id: "s5-phone", label: "Or call me directly: (210) 851-4906", tel: "+12108514906" },
          },
        ],
      },
    },
  ],
};
