const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

export const WEBSITES_PHONE = "(210) 298-2343";
export const WEBSITES_PHONE_HREF = "tel:+12102982343";

// Stripped header for /websites ONLY — deliberately NOT the global <Nav />.
// The global nav carries a "DIY" link to the free Skool community that teaches people to build
// the exact thing this page sells for $795. A sales page can't hand the buyer a free way out
// three inches above the price. Brand, phone, one button. No menu, no escape hatches.
export function WebsitesHeader() {
  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 text-white">
        <span className="flex items-center gap-3">
          <img src={LOGO_URL} alt="" className="h-9 w-9 rounded-full" />
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Steven James Consulting
          </span>
        </span>
        <span className="flex items-center gap-4">
          <a
            href={WEBSITES_PHONE_HREF}
            className="hidden text-sm font-semibold tracking-tight sm:inline"
          >
            {WEBSITES_PHONE}
          </a>
          <a
            href="#get-started"
            className="rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)]"
          >
            Get Started &rarr;
          </a>
        </span>
      </div>
    </header>
  );
}

// Matching stripped footer — same reason as the header. No sitemap of links back into the
// rest of SJC. Name, how to reach Steven, legal line. Nothing else.
export function WebsitesFooter() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-10 text-center text-sm text-[color:var(--color-sjc-mute)]">
        <p className="font-semibold text-[color:var(--color-sjc-ink)]">Steven James Consulting</p>
        <p>
          <a href={WEBSITES_PHONE_HREF} className="font-semibold text-[color:var(--color-sjc-blue)]">
            {WEBSITES_PHONE}
          </a>
          <span className="px-2">·</span>
          <a
            href="mailto:support@stevenjamesconsulting.com"
            className="font-semibold text-[color:var(--color-sjc-blue)]"
          >
            support@stevenjamesconsulting.com
          </a>
        </p>
        <p className="mt-2 text-xs">
          &copy; {new Date().getFullYear()} Steven James Consulting. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
