import type { Metadata } from "next";
import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import CareersForm from "./CareersForm";

const SJC_METADATA: Metadata = {
  title: "Careers — Steven James Consulting",
  description:
    "Open seats at Steven James Consulting: appointment setters and web builders. Remote, results-paid.",
};

// ⚠️ NOT force-static: this route now has to look at the HOST to decide whose page it is.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tenantPageMetadata("careers");
  return tenant || SJC_METADATA;
}

export default async function CareersPage() {
  // Not SJC's domain? This name belongs to whoever that host is. See lib/sjcRoute.
  const tenant = await tenantPage("careers");
  if (tenant) return tenant;
  return (
    <main style={{ background: "#0b0b0b", color: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "clamp(48px,7vw,96px) clamp(20px,5vw,48px)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227" }}>
          Careers
        </div>
        <h1 style={{ font: "300 clamp(32px,5vw,58px)/1.1 Georgia, serif", margin: "18px 0 0" }}>
          We are hiring in two seats.
        </h1>
        <p style={{ maxWidth: "62ch", margin: "22px 0 0", fontSize: 17, lineHeight: 1.8, color: "rgba(255,255,255,.7)", fontWeight: 300 }}>
          Steven James Consulting builds and runs the digital side of high-end service businesses —
          the website, the reputation, the systems behind them. We are adding people to two teams.
          Both are remote, both are paid on what you produce.
        </p>

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", margin: "clamp(40px,5vw,64px) 0" }}>
          <Seat
            title="Appointment Setter"
            terms="Commission only · remote"
            body="You work a researched list and set demo calls. You do not sell, quote or close —
                  you get the owner on the calendar and hand off. Every row you dial arrives with the
                  research already done: their site, their reviews, one of their own projects, and an
                  opening line. Phone work experience matters more than industry experience."
          />
          <Seat
            title="Web Builder"
            terms="Hourly · remote · long-term"
            body="You assemble premium websites for contractors and design firms from our own kit —
                  harvest the client's photography and words, build, check it on every screen size,
                  hand it in for sign-off. You never contact a client. Experience with modern web
                  layout and an eye for detail matter; a design degree does not."
          />
        </div>

        <CareersForm />
      </div>
    </main>
  );
}

function Seat({ title, terms, body }: { title: string; terms: string; body: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.1)", background: "#111", padding: "30px 28px" }}>
      <h2 style={{ font: "400 25px/1.2 Georgia, serif", margin: 0 }}>{title}</h2>
      <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", color: "#c9a227", marginTop: 9 }}>
        {terms}
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.62)", fontWeight: 300 }}>
        {body}
      </p>
    </div>
  );
}
