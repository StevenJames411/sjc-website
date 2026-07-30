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
import { findSite, sjcContact } from "@/lib/sites";
import { readIntake } from "@/lib/intake";
import { questionsFor } from "@/lib/intakeShared";
import IntakeForm from "@/components/intake/IntakeForm";

export const dynamic = "force-dynamic";

/**
 * THIS PAGE MUST DECLARE ITS OWN IDENTITY.
 *
 * It used to export a static `metadata` carrying only a title, so name, description and preview
 * image all fell through to app/layout.tsx — and a groomer who received her onboarding link by
 * text saw it preview as "AI employees for your business." SJC's pitch, on her page, in a message
 * from someone she has just started paying.
 *
 * layout.tsx carries a written warning about this exact failure from the last time it happened,
 * to the /websites link. Inheriting is only ever correct for an SJC page.
 *
 * `images: []` is deliberate and matches lib/publicSitePage.tsx: a plain text preview is honest,
 * SJC's logo on a groomer's link is not.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await findSite(slug);
  const business = (site?.business?.name || site?.name || "").trim();

  const title = business ? `${business} — your website setup` : "Your website setup";
  const description = business
    ? `A few questions about ${business}, so your website can be built.`
    : "A few questions about your business, so your website can be built.";

  return {
    title,
    description,
    openGraph: { title, description, siteName: business || title, type: "website", images: [] },
    twitter: { card: "summary", title, description },
    // Never index one of these — it's a live write path into one business's record.
    robots: { index: false, follow: false },
  };
}

export default async function OnboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const site = await findSite(slug);
  const contact = await sjcContact();
  // Same message whether the business doesn't exist or was never opened — a different one would
  // let someone map which businesses are real by trying names.
  if (!site) return <Blocked message={CLOSED_MESSAGE["never-opened"]} contact={contact} />;

  const open = await checkIntakeOpen(slug);
  if (!open.ok) return <Blocked message={CLOSED_MESSAGE[open.reason]} contact={contact} />;

  const record = await readIntake(slug);

  return (
    <IntakeForm
      site={slug}
      contact={contact}
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

function Blocked({
  message,
  contact,
}: {
  message: string;
  contact: { display: string; dial: string };
}) {
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
          <a href={`tel:${contact.dial}`} style={{ color: "#2563eb", fontWeight: 600 }}>
            {contact.display}
          </a>
        </p>
      </div>
    </main>
  );
}
