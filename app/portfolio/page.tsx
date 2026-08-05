// The studio's portfolio — the work, shown as screenshots that OPEN the live site.
//
// ⚠️ THIS ROUTE HOLDS ITS OWN COPY, WHICH THE OTHER STUDIO ROUTES DELIBERATELY DO NOT.
// /about and /faqs render published builder content so Steven edits words without a deploy. This
// page can't: the card is a mechanic, not a text block — two screenshots per build, a laptop
// frame, a phone frame that swaps in under 760px, and a whole-card link. Until that exists as a
// Puck block, the copy lives here. Changing a line is a code edit, and that is the trade.
//
// ⛔ NO PRICING ON THIS PAGE, EVER. The build fee is fluid and tuned on the call against what the
// prospect was quoted elsewhere. The moment a number is published, that stops working — a figure
// on a public page becomes the ceiling for every deal after it.
//
// ⛔ A PROSPECT-BRANDED DEMO NEVER GOES HERE. Every "Sample build" below was rebranded off the
// real business it was generated from — name, phone, address, photos and the site id — before it
// earned a place on this page. A demo built for one prospect implies a relationship that does not
// exist, and the person it was built for can see it.
import type { Metadata } from "next";
import { WebsitesHeader, WebsitesFooter } from "@/components/websites/WebsitesChrome";
import s from "./portfolio.module.css";

export const metadata: Metadata = {
  title: "Our work — Steven James Designs",
  description:
    "Real websites built for San Antonio businesses. Open any one of them — they are live sites, not pictures.",
};

type Build = {
  name: string;
  trade: string;
  blurb: string;
  href: string;
  label: string;
  desktop: string;
  phone: string;
  client: boolean;
};

// ── ORDER BY WHO YOU ARE CALLING THIS WEEK ────────────────────────────────────────────────────
// Not by what's most impressive. Dialling groomers means the groomer build leads, because the
// first row is the only one a skim-reader is guaranteed to see. Reordering is moving a block in
// this array — nothing else in the page depends on the sequence.
const BUILDS: Build[] = [
  {
    name: "Marbleford Pet Wash",
    trade: "Pet grooming · San Antonio",
    blurb:
      "Booking button above the fold, services a customer can actually scan, and a phone number that dials with one tap.",
    href: "https://marbleford-pet-wash-demo.stevenjamesdesigns.com",
    label: "marbleford-pet-wash-demo.stevenjamesdesigns.com",
    desktop: "/portfolio/marbleford-desktop.jpg",
    phone: "/portfolio/marbleford-phone.jpg",
    client: false,
  },
  {
    name: "Alamo Slim Clinic",
    trade: "Medical weight loss · San Antonio",
    blurb:
      "Two patient lines, telehealth and in-person paths, and a booking flow that keeps the front desk off the phone.",
    href: "https://www.alamoslimclinic.com",
    label: "alamoslimclinic.com",
    desktop: "/portfolio/alamo-slim-desktop.jpg",
    phone: "/portfolio/alamo-slim-phone.jpg",
    client: true,
  },
  {
    name: "Pecan Ridge Handyman Co.",
    trade: "Handyman · San Antonio",
    blurb:
      "Built the way a homeowner shops: what he does, what it costs to find out, and how fast he answers.",
    href: "https://pecan-ridge-handyman-demo.stevenjamesdesigns.com",
    label: "pecan-ridge-handyman-demo.stevenjamesdesigns.com",
    desktop: "/portfolio/pecan-ridge-desktop.jpg",
    phone: "/portfolio/pecan-ridge-phone.jpg",
    client: false,
  },
  {
    name: "Lady Luck Skill Games",
    trade: "Entertainment · Babcock Road, San Antonio",
    blurb:
      "Loud on purpose. Proof the studio builds to the room the business is actually in, not to one house style.",
    href: "https://www.ladyluckskillgames.com",
    label: "ladyluckskillgames.com",
    desktop: "/portfolio/lady-luck-desktop.jpg",
    phone: "/portfolio/lady-luck-phone.jpg",
    client: true,
  },
  {
    name: "Bexar Oak Firewood Co.",
    trade: "Firewood delivery · San Antonio",
    blurb:
      "Seasonal business, seasonal page. Ordering and delivery zones up top, because that's the only question a buyer has.",
    href: "https://bexar-oak-firewood-demo.stevenjamesdesigns.com",
    label: "bexar-oak-firewood-demo.stevenjamesdesigns.com",
    desktop: "/portfolio/bexar-oak-desktop.jpg",
    phone: "/portfolio/bexar-oak-phone.jpg",
    client: false,
  },
];

const BOOK = "/#get-started";

function Shots({ b }: { b: Build }) {
  return (
    <a
      className={s.shots}
      href={b.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open the ${b.name} website in a new tab`}
    >
      <div className={s.laptop}>
        <div className={s.bar} aria-hidden="true">
          <span className={s.dot} />
          <span className={s.dot} />
          <span className={s.dot} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.shot} src={b.desktop} alt={`The ${b.name} website on a laptop`} loading="lazy" />
      </div>
      <div className={s.phone}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.shot} src={b.phone} alt={`The ${b.name} website on a phone`} loading="lazy" />
      </div>
    </a>
  );
}

export default function Portfolio() {
  return (
    <>
      <WebsitesHeader />
      <main className={s.page}>
        <section className={s.hero}>
          <div className={s.wrap}>
            <h1 className={s.h1}>Before they call you, they look you up.</h1>
            <p className={s.lede}>
              Every business deserves a real website — custom built, branded to you, and good enough to
              survive that look. It goes on your Google profile, your social pages and your truck, and it
              tells a stranger you&apos;re a serious operation before you ever pick up the phone.
            </p>
            <div className={s.ctaRow}>
              <a className={`${s.btn} ${s.btnPrimary}`} href="#builds">
                See the designs
              </a>
              <a className={`${s.btn} ${s.btnGhost}`} href={BOOK}>
                Schedule a time to chat
              </a>
            </div>
          </div>
        </section>

        <section className={s.builds} id="builds">
          <div className={s.wrap}>
            {BUILDS.map((b) => (
              <article className={s.row} key={b.name}>
                <Shots b={b} />
                <div className={s.say}>
                  <span className={`${s.chip} ${b.client ? s.chipClient : ""}`}>
                    {b.client ? "Client site" : "Sample build"}
                  </span>
                  <h2 className={s.name}>{b.name}</h2>
                  <p className={s.trade}>{b.trade}</p>
                  <p className={s.blurb}>{b.blurb}</p>
                  <a className={s.addr} href={b.href} target="_blank" rel="noopener noreferrer">
                    {b.label} ↗
                  </a>
                  {/* Said out loud on every sample. A visitor who assumes these are all paying
                      customers has been misled by omission, and one of them is a medical clinic. */}
                  {!b.client && <p className={s.note}>Sample build — not a live business.</p>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={s.band}>
          <div className={s.wrap}>
            <h2 className={s.bandH}>A social page is rented land.</h2>
            <p className={s.bandP}>
              Your profile can be restricted, suspended, or gone tomorrow — and nobody owes you an
              explanation. <strong>Every customer you spent years collecting goes with it</strong>, and you
              have no way left to reach them.
            </p>
            <p className={s.bandP}>
              A website you own is the one address no platform can take from you. Social pages point to it.
              Your Google profile points to it. It stays yours.
            </p>
          </div>
        </section>

        <section className={s.refer}>
          <div className={s.wrap}>
            <h2 className={s.referH}>Friends don&apos;t let friends run a business off a Facebook page.</h2>
            {/* Deliberately vague on the reward — the number is not published. */}
            <p className={s.lede}>
              Send someone our way and you both get looked after. Ask about the friends-and-family referral
              programme when we talk.
            </p>
          </div>
        </section>

        <section className={s.close}>
          <div className={s.wrap}>
            <h2 className={s.closeH}>Schedule a time to chat</h2>
            <div className={s.closeRow}>
              <a className={`${s.btn} ${s.btnPrimary}`} href={BOOK}>
                Book a call
              </a>
              <a className={`${s.btn} ${s.btnGhost}`} href="tel:+12108514906">
                (210) 851-4906
              </a>
            </div>
          </div>
        </section>
      </main>
      <WebsitesFooter />
    </>
  );
}
