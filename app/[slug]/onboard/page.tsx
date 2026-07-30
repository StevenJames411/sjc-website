// The onboarding form for one business.
//
//   https://stevenjamesconsulting.com/lucky-dog-wash-house/onboard
//
// The address is her business name plus "onboard", because that is what she can be told over the
// phone and what looks legitimate in a text message. A static `onboard` segment outranks the
// dynamic `[page]` beside it, so this wins without touching client-site page routing.
//
// The URL is guessable by design; the OPEN/CLOSED state is the guard. See lib/intakeLinks.ts.
import type { Metadata } from "next";
import { checkIntakeOpen, CLOSED_MESSAGE } from "@/lib/intakeLinks";
import { findSite } from "@/lib/sites";
import { readIntake } from "@/lib/intake";
import { questionsFor } from "@/lib/intakeShared";
import IntakeForm from "@/components/intake/IntakeForm";

export const dynamic = "force-dynamic";

// Never index one of these — it's a live write path into one business's record.
export const metadata: Metadata = {
  title: "Tell me about your business",
  robots: { index: false, follow: false },
};

export default async function OnboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const site = await findSite(slug);
  // Same message whether the business doesn't exist or was never opened — a different one would
  // let someone map which businesses are real by trying names.
  if (!site) return <Blocked message={CLOSED_MESSAGE["never-opened"]} />;

  const open = await checkIntakeOpen(slug);
  if (!open.ok) return <Blocked message={CLOSED_MESSAGE[open.reason]} />;

  const record = await readIntake(slug);

  return (
    <IntakeForm
      site={slug}
      businessName={site.business?.name || site.name || ""}
      // The whole prospect-vs-inbound mechanism: she is only asked what we don't already know.
      questions={questionsFor(site)}
      initialAnswers={record.answers}
      initialPhotos={record.photos}
      alreadySubmitted={Boolean(record.submittedAt)}
      stoppedBecause={record.stoppedBecause}
    />
  );
}

function Blocked({ message }: { message: string }) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 10 }}>
          Steven James Consulting
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: "#4b5563" }}>{message}</p>
        <p style={{ marginTop: 22, fontSize: 17 }}>
          <a href="tel:+12102982343" style={{ color: "#2563eb", fontWeight: 600 }}>
            (210) 298-2343
          </a>
        </p>
      </div>
    </main>
  );
}
