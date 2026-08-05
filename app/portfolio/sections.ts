// The portfolio page's own sections, authored as design markup.
//
// ⚠️ WHY THE CSS IS EMBEDDED HERE INSTEAD OF USING TAILWIND CLASSES. A bought design's stylesheet
// is COMPILED AT IMPORT from exactly the markup that came in. A class this file invents — even a
// perfectly ordinary `md:block` — compiles to nothing and renders silently unstyled, which is the
// same family of bug that made three social buttons solid white on the handyman build. So these
// sections carry their own rules in a <style> tag, scoped under .pf-, and depend on the design
// only for colour values that are already visible on the page.
//
// <style> survives DesignSection's sanitiser (it strips script/iframe/object/embed/base).

const INK = "#0A0E27";
const CYAN = "#00D9FF";

export type Build = {
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
// this array — nothing else depends on the sequence.
export const BUILDS: Build[] = [
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

const CSS = `
.pf{background:${INK};color:#fff;font-family:'Inter',ui-sans-serif,system-ui,sans-serif}
.pf-wrap{max-width:1152px;margin:0 auto;padding:0 24px;position:relative;z-index:10}
.pf-glow{position:absolute;inset:0;opacity:.2;pointer-events:none;overflow:hidden}
.pf-glow i{position:absolute;width:384px;height:384px;border-radius:9999px;background:${CYAN};filter:blur(130px);display:block}
.pf-chip{display:inline-block;padding:6px 16px;border-radius:9999px;border:1px solid ${CYAN}4d;background:${CYAN}0d;color:${CYAN};font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:500}
.pf-h1{margin:22px 0 0;font-size:clamp(36px,6vw,64px);line-height:1.04;letter-spacing:-.03em;font-weight:800}
.pf-h1 span{color:${CYAN}}
.pf-lede{margin:22px 0 0;font-size:clamp(16px,1.7vw,19px);line-height:1.7;color:rgba(255,255,255,.72);max-width:60ch}
.pf-btns{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
.pf-btn{display:inline-flex;align-items:center;gap:8px;padding:15px 30px;border-radius:9999px;font-weight:600;font-size:16px;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease}
.pf-btn:hover{transform:translateY(-2px)}
.pf-solid{background:${CYAN};color:${INK};box-shadow:0 10px 30px ${CYAN}40}
.pf-ghost{background:rgba(255,255,255,.06);color:#fff;border:1px solid rgba(255,255,255,.18)}
.pf-row{display:grid;grid-template-columns:1.12fr .88fr;gap:56px;align-items:center;padding:60px 0;border-bottom:1px solid rgba(255,255,255,.09)}
.pf-row:last-child{border-bottom:0}
.pf-row.rev .pf-shots{order:2}.pf-row.rev .pf-say{order:1}
.pf-say{min-width:0}
.pf-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 11px;border-radius:9999px;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7)}
.pf-tag.cl{border-color:${CYAN}59;background:${CYAN}14;color:${CYAN}}
.pf-name{margin:14px 0 4px;font-size:clamp(22px,2.6vw,32px);line-height:1.14;letter-spacing:-.02em;font-weight:750}
.pf-trade{margin:0;font-size:14px;color:rgba(255,255,255,.55)}
.pf-blurb{margin:16px 0 0;font-size:16px;line-height:1.65;color:rgba(255,255,255,.75);max-width:46ch}
.pf-url{display:inline-block;margin-top:18px;font-size:14px;font-weight:600;color:${CYAN};text-decoration:none;word-break:break-word}
.pf-url:hover{text-decoration:underline}
.pf-note{margin:10px 0 0;font-size:13px;color:rgba(255,255,255,.42)}
.pf-shots{position:relative;min-width:0;display:block;text-decoration:none}
.pf-lap{border:1px solid rgba(255,255,255,.14);border-radius:14px;overflow:hidden;background:#0d1230;box-shadow:0 26px 60px rgba(0,0,0,.5);transition:transform .18s ease,box-shadow .18s ease}
.pf-shots:hover .pf-lap{transform:translateY(-4px);box-shadow:0 34px 74px rgba(0,0,0,.6)}
.pf-bar{display:flex;gap:6px;padding:10px 13px;background:rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.09)}
.pf-bar b{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.26);display:block}
.pf-img{display:block;width:100%;height:auto}
.pf-ph{position:absolute;right:-16px;bottom:-28px;width:27%;min-width:118px;border:6px solid #05070f;border-radius:24px;overflow:hidden;background:#05070f;box-shadow:0 18px 40px rgba(0,0,0,.6)}
.pf-band{padding:88px 0;background:linear-gradient(180deg,#080b1e 0%,${INK} 100%)}
.pf-h2{margin:0;font-size:clamp(28px,4.2vw,46px);line-height:1.1;letter-spacing:-.025em;font-weight:800;max-width:18ch}
.pf-h2 span{color:${CYAN}}
.pf-p{margin:20px 0 0;font-size:clamp(16px,1.6vw,18px);line-height:1.72;color:rgba(255,255,255,.72);max-width:60ch}
.pf-p b{color:#fff;font-weight:600}
.pf-mid{text-align:center}
.pf-mid .pf-h2,.pf-mid .pf-p{max-width:none;margin-left:auto;margin-right:auto}
.pf-mid .pf-btns{justify-content:center}
@media(max-width:900px){.pf-row{grid-template-columns:1fr;gap:30px;padding:44px 0}.pf-row.rev .pf-shots,.pf-row.rev .pf-say{order:0}}
@media(max-width:760px){.pf-lap{display:none}.pf-ph{position:static;width:min(300px,84%);margin:0 auto;border-width:8px;border-radius:30px}}
`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function shots(b: Build) {
  return `<a class="pf-shots" href="${b.href}" target="_blank" rel="noopener noreferrer" aria-label="Open the ${esc(
    b.name
  )} website in a new tab">
  <span class="pf-lap"><span class="pf-bar"><b></b><b></b><b></b></span><img class="pf-img" src="${b.desktop}" alt="The ${esc(
    b.name
  )} website on a laptop" loading="lazy"></span>
  <span class="pf-ph"><img class="pf-img" src="${b.phone}" alt="The ${esc(
    b.name
  )} website on a phone" loading="lazy"></span>
</a>`;
}

function row(b: Build, i: number) {
  return `<article class="pf-row${i % 2 ? " rev" : ""}">
  ${shots(b)}
  <div class="pf-say">
    <span class="pf-tag${b.client ? " cl" : ""}">${b.client ? "Client site" : "Sample build"}</span>
    <h2 class="pf-name">${esc(b.name)}</h2>
    <p class="pf-trade">${esc(b.trade)}</p>
    <p class="pf-blurb">${esc(b.blurb)}</p>
    <a class="pf-url" href="${b.href}" target="_blank" rel="noopener noreferrer">${esc(b.label)} &#8599;</a>
    ${b.client ? "" : `<p class="pf-note">Sample build &mdash; not a live business.</p>`}
  </div>
</article>`;
}

/** The whole page body as one design section, so it shares the site's chrome and stylesheet. */
export function portfolioHtml(): string {
  return `<section class="pf">
<style>${CSS}</style>
<div style="position:relative;padding:76px 0 40px;overflow:hidden">
  <div class="pf-glow"><i style="top:-80px;left:18%"></i><i style="bottom:-120px;right:14%;filter:blur(150px);opacity:.6"></i></div>
  <div class="pf-wrap">
    <span class="pf-chip">Our Work</span>
    <h1 class="pf-h1">Before they call you,<br><span>they look you up.</span></h1>
    <p class="pf-lede">Every business deserves a real website &mdash; custom built, branded to you, and good enough to survive that look. It goes on your Google profile, your social pages and your truck, and it tells a stranger you&rsquo;re a serious operation before you ever pick up the phone.</p>
    <div class="pf-btns">
      <a class="pf-btn pf-solid" href="#builds">See the designs</a>
      <a class="pf-btn pf-ghost" href="/#contact">Schedule a time to chat</a>
    </div>
  </div>
</div>

<div class="pf-wrap" id="builds" style="padding-top:8px;padding-bottom:8px">
  ${BUILDS.map(row).join("\n")}
</div>

<div class="pf-band">
  <div class="pf-wrap">
    <h2 class="pf-h2">A social page is <span>rented land</span>.</h2>
    <p class="pf-p">Your profile can be restricted, suspended, or gone tomorrow &mdash; and nobody owes you an explanation. <b>Every customer you spent years collecting goes with it</b>, and you have no way left to reach them.</p>
    <p class="pf-p">A website you own is the one address no platform can take from you. Social pages point to it. Your Google profile points to it. It stays yours.</p>
  </div>
</div>

<div style="padding:78px 0;border-top:1px solid rgba(255,255,255,.09)">
  <div class="pf-wrap">
    <h2 class="pf-h2">Friends don&rsquo;t let friends run a business off a Facebook page.</h2>
    <p class="pf-p">Send someone our way and you both get looked after. Ask about the friends-and-family referral programme when we talk.</p>
  </div>
</div>

<div style="padding:84px 0 96px;border-top:1px solid rgba(255,255,255,.09)">
  <div class="pf-wrap pf-mid">
    <h2 class="pf-h2">Ready to be worth looking up?</h2>
    <div class="pf-btns">
      <a class="pf-btn pf-solid" href="/#contact">Get your free quote</a>
      <a class="pf-btn pf-ghost" href="tel:+12108514906">Call (210) 851-4906</a>
    </div>
  </div>
</div>
</section>`;
}
