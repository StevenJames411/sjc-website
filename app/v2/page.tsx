import type { Metadata } from "next";
import Buckets from "./Buckets";
import WorkReel from "./WorkReel";

// The rebuilt SJC home page, at /v2 until Steven approves the swap.
//
// One argument, in this order: he tells his own story → he finds his own problem →
// the solution is the only sequence it could be done in. Every deep-linked page is one
// link in that chain, so landing directly on it still makes sense to someone who
// arrived from a Loom rather than from here.

export const metadata: Metadata = {
  title: "Steven James Consulting — websites for high-end trades",
  description:
    "Websites, reviews and follow-up for contractors, builders and specialty shops. Forty years running my own businesses — you deal with me, not an account manager.",
};

export const dynamic = "force-static";

const CHAIN = [
  { k: "Maps", d: "is the storefront. It is where a homeowner actually starts, and it is the one you did not build." },
  { k: "Reviews", d: "are the entry fee. Below a certain count you are not compared, you are skipped." },
  { k: "The site", d: "confirms. Nobody is sold by it — but plenty are lost by it." },
  { k: "Social", d: "is rented ground. It builds an audience you do not own on land you cannot keep." },
  { k: "Referrals", d: "are feast or famine. Wonderful, and impossible to schedule around." },
  { k: "Ads", d: "only amplify. They do not fix any of the above. They send more people to see it." },
];

const SOLUTION = [
  {
    n: "01", t: "The website", href: "/designs",
    p: "Everything else points at it, so it goes first. Built to look like the work you actually do — not a template with your logo dropped in the corner.",
  },
  {
    n: "02", t: "The reviews", href: "/reviews",
    p: "A system that asks every customer at the right moment, instead of you remembering to. Three reviews after ten years is not a reputation problem, it is a process problem.",
  },
  {
    n: "03", t: "The back end", href: "/ai-implementation",
    p: "What happens to the call at 6pm, the form at midnight, the lead you meant to ring back on Thursday. This is where the money already in your pipeline leaks out.",
  },
  {
    n: "04", t: "Then the ads", href: "/ads",
    p: "Only once the first three hold. Paid traffic is the fastest way to find out what is broken — and the most expensive.",
  },
];

export default function V2() {
  return (
    <main style={{ background: "#0b0b0b", color: "#fff" }}>
      <WorkReel />

      {/* ---------- his story, not ours ---------- */}
      <Band>
        <Eyebrow>How It Usually Goes</Eyebrow>
        <H2>You didn&rsquo;t plan any of this. It just accumulated.</H2>
        <div style={{ maxWidth: "68ch", margin: "clamp(30px,4vw,52px) auto 0" }}>
          {[
            "You built the business on word of mouth, and it worked. For years it was the only thing that worked.",
            "Then it got quieter. So you had a website made — by a cousin, an agency, a guy off Facebook. It was fine.",
            "Then somebody sold you ads. Then somebody called about SEO. Then you set up the Google listing yourself one evening, and a review or two showed up on their own.",
            "Every one of those was a separate purchase from a separate vendor. Not one of them asked what the others were doing.",
          ].map((p, i) => (
            <p key={i} style={{ color: "rgba(255,255,255,.72)", fontSize: "clamp(16px,1.25vw,19px)", lineHeight: 1.9, margin: "0 0 22px", fontWeight: 300 }}>
              {p}
            </p>
          ))}
          <p style={{ color: "#fff", fontSize: "clamp(18px,1.5vw,23px)", lineHeight: 1.7, margin: "34px 0 0", fontFamily: "Georgia, serif" }}>
            That is not a marketing problem. That is four things in a row that don&rsquo;t know
            the others exist.
          </p>
        </div>
      </Band>

      <Rule />

      {/* ---------- the diagnosis ---------- */}
      <Band>
        <Eyebrow>The Diagnosis</Eyebrow>
        <H2>Your marketing doesn&rsquo;t talk to itself.</H2>
        <Lede>
          There is an order to this, and almost nobody gets sold it. A customer moves through your
          business in a sequence, and every piece hands off to the next one. Break a link and
          everything downstream of it is paid for and wasted.
        </Lede>

        <div style={{ maxWidth: 900, margin: "clamp(38px,5vw,64px) auto 0" }}>
          {CHAIN.map((c, i) => (
            <div key={c.k} style={{
              display: "grid", gridTemplateColumns: "auto 1fr", gap: "clamp(16px,2vw,28px)",
              padding: "20px 0", borderBottom: i < CHAIN.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
              alignItems: "baseline",
            }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(19px,1.7vw,25px)", color: i === CHAIN.length - 1 ? "#c9a227" : "#fff", whiteSpace: "nowrap" }}>
                {c.k}
              </div>
              <div style={{ color: "rgba(255,255,255,.62)", fontSize: "clamp(15px,1.15vw,17.5px)", lineHeight: 1.8, fontWeight: 300 }}>
                {c.d}
              </div>
            </div>
          ))}
        </div>

        <p style={{
          maxWidth: "52ch", margin: "clamp(40px,5vw,64px) auto 0", textAlign: "center",
          fontFamily: "Georgia, serif", fontSize: "clamp(21px,2.2vw,32px)", lineHeight: 1.5, color: "#fff",
        }}>
          Ads don&rsquo;t fix any of this. They just send more people to see it.
        </p>
      </Band>

      <Rule />

      {/* ---------- he diagnoses himself — the hinge of the page ---------- */}
      <Buckets />

      <Rule />

      {/* ---------- the solution, in the only order it works ---------- */}
      <Band>
        <Eyebrow>What I Do About It</Eyebrow>
        <H2>Same order, rebuilt.</H2>
        <Lede>
          You can start anywhere. But this is the sequence, and the sequence is the part nobody
          else sold you.
        </Lede>

        <div style={{
          display: "grid", gap: 20, maxWidth: 1180, margin: "clamp(40px,5vw,64px) auto 0",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
        }}>
          {SOLUTION.map((s) => (
            <a key={s.n} href={s.href} style={{
              display: "block", textDecoration: "none", color: "inherit", background: "#101010",
              border: "1px solid rgba(255,255,255,.09)", padding: "32px 30px 34px",
            }} className="sol-card">
              <div style={{ fontFamily: "Georgia, serif", fontSize: 19, color: "#c9a227", marginBottom: 18 }}>{s.n}</div>
              <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(24px,2vw,29px)", margin: 0 }}>{s.t}</h3>
              <p style={{ margin: "14px 0 0", color: "rgba(255,255,255,.64)", fontSize: "clamp(15px,1.1vw,17px)", lineHeight: 1.8, fontWeight: 300 }}>{s.p}</p>
              <span style={{ display: "inline-block", marginTop: 18, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "#c9a227" }}>
                Read more &rarr;
              </span>
            </a>
          ))}
        </div>
      </Band>

      <Rule />

      {/* ---------- proof ---------- */}
      <Band>
        <Eyebrow>The Work</Eyebrow>
        <H2>Built, not mocked up.</H2>
        <Lede>
          Every site below is a real build. The photography is placeholder on the demonstration
          builds and the businesses are invented — the design, the motion and the engineering are not.
        </Lede>
        <div style={{
          display: "grid", gap: 18, maxWidth: 1180, margin: "clamp(38px,5vw,60px) auto 0",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
        }}>
          {[
            { img: "/work/landscape.jpg", t: "Landscape Architecture", s: "Sixteen years of awards, invisible to search" },
            { img: "/work/detail.jpg", t: "Ceramic Coating", s: "A $1,500 service that looked like a $150 one" },
            { img: "/work/offgrid.jpg", t: "Off-Grid Architecture", s: "Four houses a year, chosen carefully" },
            { img: "/work/customcar.jpg", t: "Restoration &amp; Restomod", s: "Nine builds a year, eighteen months each" },
          ].map((w) => (
            <figure key={w.t} style={{ margin: 0, border: "1px solid rgba(255,255,255,.09)", background: "#101010" }}>
              <div style={{ aspectRatio: "16/10", backgroundImage: `url('${w.img}')`, backgroundSize: "cover", backgroundPosition: "top center" }} />
              <figcaption style={{ padding: "20px 22px 24px" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 21 }} dangerouslySetInnerHTML={{ __html: w.t }} />
                <div style={{ color: "rgba(255,255,255,.5)", fontSize: 14, marginTop: 6 }}>{w.s}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div style={{
          maxWidth: 900, margin: "clamp(48px,6vw,80px) auto 0", border: "1px solid rgba(201,162,39,.3)",
          background: "rgba(201,162,39,.05)", padding: "clamp(28px,3.4vw,44px)",
        }}>
          <div style={{ fontSize: 10, letterSpacing: ".26em", textTransform: "uppercase", color: "#c9a227" }}>Case Study &middot; Live Client</div>
          <h3 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(24px,2.4vw,34px)", margin: "14px 0 0" }}>
            A clinic that was losing every call after five o&rsquo;clock.
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(24px,4vw,56px)", marginTop: 26 }}>
            {[["28", "appointments booked in month one"], ["$9.69", "cost per lead"], ["Week 5", "and still converting"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(30px,3.2vw,44px)", color: "#fff" }}>{n}</div>
                <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13.5, marginTop: 4, maxWidth: "22ch" }}>{l}</div>
              </div>
            ))}
          </div>
          <a href="/ai-implementation" style={{ display: "inline-block", marginTop: 28, fontSize: 10, letterSpacing: ".24em", textTransform: "uppercase", color: "#c9a227", textDecoration: "none" }}>
            How it was built &rarr;
          </a>
        </div>
      </Band>

      <Rule />

      {/* ---------- who — placed AFTER he already agrees ---------- */}
      <Band>
        <Eyebrow>Who You&rsquo;d Be Working With</Eyebrow>
        <H2>Forty years, five businesses, and the technology in every one of them.</H2>
        <div style={{ maxWidth: "68ch", margin: "clamp(30px,4vw,50px) auto 0" }}>
          {[
            "A restaurant in 1986. Then mortgage. Then roofing. Then trucking. Then this. I ran all five, and I was the one who built the systems in every one of them.",
            "So when I tell you the pieces don't talk to each other, it isn't a theory I read. It is the specific problem I spent four decades solving inside my own businesses, with my own money, while the phone was ringing.",
            "I work with a small number of owners at a time. You deal with me, not with an account manager who repeats what I said.",
          ].map((p, i) => (
            <p key={i} style={{ color: "rgba(255,255,255,.72)", fontSize: "clamp(16px,1.25vw,19px)", lineHeight: 1.9, margin: "0 0 22px", fontWeight: 300 }}>{p}</p>
          ))}
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 27, marginTop: 30 }}>
            Steven Barchetti
            <small style={{ display: "block", fontStyle: "normal", fontFamily: "inherit", fontSize: 10, letterSpacing: ".26em", textTransform: "uppercase", color: "#c9a227", marginTop: 10, fontWeight: 400 }}>
              Steven James Consulting
            </small>
          </div>
        </div>
      </Band>

      {/* ---------- the ask ---------- */}
      <section style={{ padding: "clamp(64px,9vw,120px) clamp(20px,5vw,60px)", borderTop: "1px solid rgba(255,255,255,.08)", textAlign: "center" }}>
        <Eyebrow>One Conversation</Eyebrow>
        <H2>I&rsquo;ll show you your own business first.</H2>
        <Lede>
          Before you decide anything, I&rsquo;ll walk you through what a customer sees when they look
          you up — your listing, your reviews, your site, on the phone they&rsquo;re actually holding.
          That part costs nothing and it is useful whether you hire me or not.
        </Lede>
        <a href="/apply" style={{
          display: "inline-block", marginTop: 36, padding: "17px 46px", border: "1px solid #c9a227",
          background: "rgba(0,0,0,.34)", color: "#e8c65a", textDecoration: "none",
          fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase",
        }}>Book the walkthrough</a>
      </section>
    </main>
  );
}

/* ---------- small shared pieces ---------- */
function Band({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: "clamp(64px,9vw,130px) clamp(20px,5vw,60px)", maxWidth: 1280, margin: "0 auto" }}>
      {children}
    </section>
  );
}
function Rule() {
  return <div style={{ height: 1, background: "rgba(255,255,255,.08)", maxWidth: 1280, margin: "0 auto" }} />;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "clamp(15px,1.35vw,19px)", letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227", textAlign: "center", fontWeight: 500 }}>
      {children}
    </div>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 300, fontSize: "clamp(27px,3.8vw,52px)", textAlign: "center", margin: "24px 0 0", lineHeight: 1.15 }}>
      {children}
    </h2>
  );
}
function Lede({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ maxWidth: "min(86ch,1180px)", margin: "26px auto 0", textAlign: "center", color: "rgba(255,255,255,.66)", fontWeight: 300, lineHeight: 1.78, fontSize: "clamp(15px,1.32vw,21px)" }}>
      {children}
    </p>
  );
}
