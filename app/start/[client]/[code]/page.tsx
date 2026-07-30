// The client intake page — the link Steven texts a business owner after the call.
//
//   https://stevenjamesconsulting.com/start/lucky-dog/7k2m9x4p
//
// Public, so she never signs in. The last segment IS the credential: eight characters, looked up
// in the store. It reads like a normal link, which is the entire point — the first version put a
// signed token in a query string and looked like phishing, so nobody would have tapped it.
//
// The `client` segment is decoration for the human eye. The site this opens comes from the CODE,
// so editing the name in the path gets you nothing.
import type { Metadata } from "next";
import { resolveIntakeCode, CODE_MESSAGE } from "@/lib/intakeLinks";
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
}: {
  params: Promise<{ client: string; code: string }>;
}) {
  const { code } = await params;

  const check = await resolveIntakeCode(code);
  if (!check.ok) return <Blocked message={CODE_MESSAGE[check.reason]} />;

  const site = (await findSite(check.siteId)) || null;
  const record = await readIntake(check.siteId);

  // The whole prospect-vs-inbound mechanism, in one line: she is only asked what we don't know.
  const questions = questionsFor(site);

  return (
    <IntakeForm
      code={code}
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
