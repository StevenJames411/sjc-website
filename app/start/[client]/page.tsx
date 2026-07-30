// The client intake page — the link Steven texts a business owner after the call.
//
// Public, so she never signs in; gated by the signed token in `?k=`. The path segment is only
// there so the link reads like something a person sent ("/start/riverbend-grooming"): the site it
// actually opens comes from the token, so editing the URL gets you nothing.
import type { Metadata } from "next";
import { readIntakeToken, TOKEN_MESSAGE } from "@/lib/intakeToken";
import { findSite } from "@/lib/sites";
import { readIntake } from "@/lib/intake";
import { questionsFor } from "@/lib/intakeShared";
import IntakeForm from "@/components/intake/IntakeForm";

export const dynamic = "force-dynamic";

// Never let one of these turn up in a search result — it's a private link to one business's
// answers and photos.
export const metadata: Metadata = {
  title: "Tell me about your business",
  robots: { index: false, follow: false },
};

export default async function StartPage({
  params,
  searchParams,
}: {
  params: Promise<{ client: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { client } = await params;
  const { k } = await searchParams;

  const check = readIntakeToken(k);
  if (!check.ok) return <Blocked message={TOKEN_MESSAGE[check.reason]} />;

  // The token is valid but for a different business — someone edited the path. Say the same thing
  // as any other bad link; a more specific message just tells them what to try next.
  if (client && client !== check.siteId) {
    return <Blocked message={TOKEN_MESSAGE["bad-signature"]} />;
  }

  const site = (await findSite(check.siteId)) || null;
  const record = await readIntake(check.siteId);

  // The whole prospect-vs-inbound mechanism, in one line: she is only asked what we don't know.
  const questions = questionsFor(site);

  return (
    <IntakeForm
      token={k as string}
      siteId={check.siteId}
      businessName={site?.business?.name || site?.name || ""}
      questions={questions}
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
