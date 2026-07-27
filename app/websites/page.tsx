import PublishedOrFallback from "@/components/puck/PublishedOrFallback";
import {
  WebsitesHeader,
  WebsitesFooter,
  WEBSITES_PHONE,
  WEBSITES_PHONE_HREF,
} from "@/components/websites/WebsitesChrome";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "A real website for your business — live in three days | Steven James Consulting",
  description:
    "$795 to build it, $25/month to keep it running. Your work, your reviews, your phone number — and a contact form that texts you the second someone fills it out. You never touch any of it.",
  alternates: { canonical: "/websites" },
};

// The bottom rung of the ladder: a plain, real website for a very small business.
// NOT the AI/Chloe offer and NOT a middle tier — no CRM, no automation, no upgrade path shown.
// Ascension to the bigger offers happens on a phone call with Steven, never through this page.
// Wrapped in PublishedOrFallback so it can be taken over in the Puck builder at /edit/websites
// later; until something is published there, this committed version is what ships.
export default function WebsitesPage() {
  return (
    <>
      <WebsitesHeader />

      <main>
        <PublishedOrFallback page="websites">
          {/* ── Hero ───────────────────────────────────────────────────────── */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-3xl px-6 pt-14 pb-16 text-center md:pt-20 md:pb-24">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
                Websites for Small Businesses
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
                A real website for your business — live in three days.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-xl font-semibold text-[color:var(--color-sjc-blue)] md:text-2xl">
                Your work, your reviews, your phone number. Somebody fills out the form and it
                hits your phone before they&apos;ve closed the browser.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg">
                You do good work. People just can&apos;t find you. I build the site, I put it
                online, and I keep it running — you never touch any of it.
              </p>
              <div className="mt-10 flex justify-center">
                <a href="#get-started" className="btn-cta">
                  <span>Get My Website Started</span>
                  <span className="sub">$795 to build it. $25/month to keep it running.</span>
                </a>
              </div>
            </div>
          </section>

          {/* ── What you get ───────────────────────────────────────────────── */}
          <section className="w-full bg-white">
            <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
              <h2 className="text-center text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                What you get
              </h2>
              <div className="mt-12 space-y-8">
                {[
                  {
                    h: "A real website",
                    p: "Three to five pages built around the work you actually do — not a template with your name dropped in the corner.",
                  },
                  {
                    h: "Your reviews on it",
                    p: "The stars you already earned, right where somebody deciding whether to call you can see them.",
                  },
                  {
                    h: "Built for a phone first",
                    p: "Almost everybody checking you out is standing in their kitchen holding a phone. That's what it's built for.",
                  },
                  {
                    h: "A contact form that texts you",
                    p: "Every message lands on your phone with their name and number attached. Hit reply and you're talking to them. Your phone is the whole system.",
                  },
                  {
                    h: "You never touch it",
                    p: "I build it, I host it, and I make the changes when your business changes. You go back to work.",
                  },
                ].map((item) => (
                  <div key={item.h} className="flex gap-4">
                    <span
                      aria-hidden
                      className="mt-1 h-6 w-6 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--color-sjc-green)" }}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-[color:var(--color-sjc-ink)] md:text-xl">
                        {item.h}
                      </h3>
                      <p className="mt-1 text-base leading-relaxed text-[color:var(--color-sjc-mute)] md:text-lg">
                        {item.p}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How it works ───────────────────────────────────────────────── */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
              <h2 className="text-center text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                How it works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-[color:var(--color-sjc-mute)]">
                Three days, start to finish. Ten minutes of that is yours.
              </p>
              <div className="mt-12 grid gap-8 md:grid-cols-3">
                {[
                  {
                    n: "1",
                    h: "You tell me about your business",
                    p: "Ten minutes on the phone. What you do, where you work, and your best photos. That's your whole job.",
                  },
                  {
                    n: "2",
                    h: "I build it",
                    p: "Three days. You look it over before anybody else sees it and tell me what to change.",
                  },
                  {
                    n: "3",
                    h: "It goes live",
                    p: "Your name, your domain, your phone number. From then on the leads come to you.",
                  },
                ].map((step) => (
                  <div key={step.n} className="rounded-2xl bg-white p-7 shadow-sm">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: "var(--color-sjc-blue)" }}
                    >
                      {step.n}
                    </span>
                    <h3 className="mt-5 text-lg font-bold text-[color:var(--color-sjc-ink)] md:text-xl">
                      {step.h}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
                      {step.p}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Who this is for ────────────────────────────────────────────── */}
          <section className="w-full bg-white">
            <div className="mx-auto max-w-3xl px-6 py-20 md:py-24">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                Who this is for
              </h2>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
                <p>
                  You&apos;re good at what you do and nobody can find you online. Maybe you&apos;ve
                  got no website at all. Maybe you&apos;ve got one from years back that you
                  can&apos;t log into and that looks broken on a phone.
                </p>
                <p className="font-semibold">
                  Either way, people are checking you out before they call — and right now
                  there&apos;s nothing there to check.
                </p>
                <p className="text-[color:var(--color-sjc-mute)]">
                  This isn&apos;t for you if you already have a site that works, or if what you
                  want is a full marketing machine with automation and a CRM behind it. That&apos;s
                  a different conversation and I&apos;m happy to have it. This is a real website,
                  done right, at a fair price.
                </p>
              </div>
            </div>
          </section>

          {/* ── Price ──────────────────────────────────────────────────────── */}
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-2xl px-6 py-20 md:py-24">
              <h2 className="text-center text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                What it costs
              </h2>
              <div className="mt-10 rounded-2xl bg-white p-8 text-center shadow-sm md:p-12">
                <p className="text-5xl font-bold tracking-tight text-[color:var(--color-sjc-ink)] md:text-6xl">
                  $795
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--color-sjc-mute)]">
                  one time, to build it
                </p>
                <div className="mx-auto my-8 h-px w-24 bg-gray-200" />
                <p className="text-4xl font-bold tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
                  $25
                  <span className="text-2xl font-semibold text-[color:var(--color-sjc-mute)]">
                    /month
                  </span>
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--color-sjc-mute)]">
                  to host it, run the form, and keep it current
                </p>
                <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-[color:var(--color-sjc-mute)]">
                  That&apos;s the whole price. No contract, no setup fees stacked on top, no
                  packages to pick from. Cancel any time and the site is still yours.
                </p>
              </div>
            </div>
          </section>

          {/* ── CTA — PLACEHOLDER. Action still undecided (form vs. call). ──── */}
          <section id="get-started" className="w-full bg-white">
            <div className="mx-auto max-w-2xl px-6 py-20 text-center md:py-24">
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
                Let&apos;s get you online.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-sjc-mute)]">
                Ten minutes on the phone and I can have your site in front of you in three days.
              </p>
              <div className="mt-10 flex justify-center">
                <a href={WEBSITES_PHONE_HREF} className="btn-cta">
                  <span>Call {WEBSITES_PHONE}</span>
                  <span className="sub">Talk to Steven directly.</span>
                </a>
              </div>
            </div>
          </section>
        </PublishedOrFallback>
      </main>

      <WebsitesFooter />
    </>
  );
}
