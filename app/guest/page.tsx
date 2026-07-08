import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ApplyForm, { type Step, type Intro, type Booking } from "@/components/ApplyForm";
import { readPuckPublished } from "@/lib/puckContent";
import { seedFor } from "@/components/puck/seeds";

// Public podcast-GUEST intake. Same wizard as /apply, but fed by the Puck "guest" page (edited at
// /edit/guest) and its own calendar. Every piece of copy + question is editable/deletable there.
// /guest and /api/guest are allow-listed through the site password gate in middleware.ts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Come on the show — Steven James Consulting",
  description: "Want to be a guest? Tell us a bit about you and grab a time to record.",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function extract(data: any): {
  intro: Intro;
  disclaimer: string;
  booking: Booking;
  steps: Step[];
  bookingUrl: string;
} {
  const content: any[] = Array.isArray(data?.content) ? data.content : [];

  // A labeled block's text by id. A PRESENT block wins even if empty (clearing hides that piece);
  // an ABSENT id falls back to the default so older published data never renders blank.
  const textById = (id: string, dflt: string) => {
    const b = content.find((x) => x?.props?.id === id);
    return b ? String(b.props?.text ?? "") : dflt;
  };

  const steps: Step[] = content
    .filter((b) => b?.type === "FormStep")
    .map((b, si) => {
      const kids: any[] = Array.isArray(b.props?.content) ? b.props.content : [];
      return {
        title: String(b.props?.title || ""),
        questions: kids
          .filter((q) => q?.type === "FormQuestion")
          .map((q, i) => ({
            key: String(q.props?.id || `q${si}-${i}`),
            label: String(q.props?.label || ""),
            type: (["text", "email", "phone", "choice", "multi"].includes(q.props?.questionType)
              ? q.props.questionType
              : "text") as Step["questions"][number]["type"],
            options: (Array.isArray(q.props?.options) ? q.props.options : [])
              .map((o: any) => String(o?.text || "").trim())
              .filter(Boolean),
            required: q.props?.required !== false,
          })),
      };
    });

  const intro: Intro = {
    eyebrow: textById("guest-eyebrow", "Come on the show"),
    title: textById("guest-h1", "Let's get you in front of the mic."),
    sub: textById(
      "guest-sub",
      "A few quick questions so we can make it a great conversation. Takes under two minutes."
    ),
  };
  const disclaimer = textById("guest-disclaimer", "");
  const booking: Booking = {
    eyebrow: textById("guest-booking-eyebrow", "Got it"),
    heading: textById("guest-booking-h", "Last step — grab a time to record."),
    sub: textById("guest-booking-sub", "Pick a slot that works and we'll get you on the calendar."),
  };

  // The guest calendar link is an editable block. Pull the first real https URL out of it — strip
  // any rich-text HTML the editor may wrap around it, so the instructive placeholder is ignored
  // until a real link is pasted, and the calendar works however the field is stored.
  const raw = textById("guest-booking-url", "").replace(/<[^>]*>/g, " ");
  const m = raw.match(/https?:\/\/\S+/i);
  const bookingUrl = m ? m[0] : "";

  return { intro, disclaimer, booking, steps, bookingUrl };
}

export default async function Guest() {
  const data = (await readPuckPublished("guest")) || seedFor("guest", "Podcast Guest Intake");
  const { intro, disclaimer, booking, steps, bookingUrl } = extract(data);
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--color-sjc-bg-soft)]">
        <ApplyForm
          steps={steps}
          intro={intro}
          disclaimer={disclaimer}
          booking={booking}
          bookingUrl={bookingUrl}
          submitPath="/api/guest"
        />
      </main>
      <Footer />
    </>
  );
}
