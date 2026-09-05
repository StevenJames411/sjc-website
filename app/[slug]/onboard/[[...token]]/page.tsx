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
import { readIntake, onboardingQuestions } from "@/lib/intake";
import { findForm } from "@/lib/forms";
import { questionsFor, ONBOARDING_FORM_ID } from "@/lib/intakeShared";
import BrandShell from "@/components/BrandShell";
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

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ slug: string; token?: string[] }>;
}) {
  // ⚠️ OPTIONAL CATCH-ALL SO THE TOKENLESS URL STILL LANDS HERE. The token is always required, but
  // /<business>/onboard with none should show her the same "this form is closed" page as a wrong
  // token does — not a Next 404, which looks like a broken link and invites a phone call. The
  // segment being optional is about the MESSAGE, not about letting anyone in.
  const { slug, token } = await params;
  const key = token?.[0] || "";

  const site = await findSite(slug);
  const contact = await sjcContact();
  // Same message whether the business doesn't exist or was never opened — a different one would
  // let someone map which businesses are real by trying names.
  if (!site) return <Blocked message={CLOSED_MESSAGE["never-opened"]} contact={contact} />;

  const open = await checkIntakeOpen(slug, key);
  if (!open.ok) return <Blocked message={CLOSED_MESSAGE[open.reason]} contact={contact} />;

  const record = await readIntake(slug);
  const business = site.business?.name || site.name || "";

  // The form as Steven has it in his library, not as it was written in code — this is what makes
  // "Client onboarding" on /edit/forms the real thing rather than a description of it.
  // WHICH form this client gets — the website intake unless the site record names another.
  const formId = site.onboardingFormId || ONBOARDING_FORM_ID;
  const [questions, form] = await Promise.all([
    onboardingQuestions(formId),
    findForm(formId),
  ]);

  return (
    // STEVEN JAMES DESIGNS, not Consulting. She just bought a WEBSITE — his name on her setup form
    // is who she paid, which is honest. SJC's chrome here would be an AI-employee pitch arriving
    // in a message from someone she has only ever hired to build a site; see the warning on
    // generateMetadata above, which exists because that already happened once.
    <BrandShell
      brand="designs"
      phone={contact.display}
      heading="Let's build your website"
      sub={
        business
          ? `A few questions about ${business}. Answer them whenever you get a minute — it saves as you go, so you can stop and come back.`
          : "A few questions about your business. It saves as you go, so you can stop and come back."
      }
    >
      <IntakeForm
        site={slug}
        accessToken={key}
        contact={contact}
        businessName={business}
        // The whole prospect-vs-inbound mechanism: she is only asked what we don't already know.
        questions={questionsFor(site, questions)}
        initialAnswers={record.answers}
        initialPhotos={record.photos}
        alreadySubmitted={Boolean(record.submittedAt)}
        // Off would put nine questions on one screen. It's on in the code floor and stays on
        // unless Steven deliberately turns it off in the library.
        oneQuestionPerScreen={form?.oneQuestionPerScreen !== false}
        buttonLabel={form?.buttonLabel}
        successHeading={form?.successHeading}
        successBody={form?.successBody}
      />
    </BrandShell>
  );
}

/**
 * The link is closed, or was never opened. Same shell as the open form — a closed link that looks
 * like a broken page reads as "this company is gone", which is the opposite of what it means. The
 * heading no longer says Steven James Consulting; the shell says who it's from.
 */
function Blocked({
  message,
  contact,
}: {
  message: string;
  contact: { display: string; dial: string };
}) {
  return (
    <BrandShell brand="designs" phone={contact.display} heading="Your website setup">
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          padding: 26,
          boxShadow: "0 18px 46px rgba(0,0,0,.34)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <p style={{ fontSize: 17, lineHeight: 1.55, color: "#374151", margin: 0 }}>{message}</p>
        <p style={{ marginTop: 20, fontSize: 17, margin: "20px 0 0" }}>
          <a href={`tel:${contact.dial}`} style={{ color: "#0369a1", fontWeight: 700 }}>
            {contact.display}
          </a>
        </p>
      </div>
    </BrandShell>
  );
}
