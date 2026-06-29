"use client";

const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

// Stripped-down nav (Steven's call): a HOME ICON (no "Home" word) + ONE call-to-action
// button "How It Works" that scrolls to the on-page section showing the AI employees doing
// the work (#at-work). "Meet Chloe" and "About" removed — they don't earn a slot. The old
// "See It Run on Your Business" button and "How It Works" went to the same place, so they're
// merged into this single button.
const HOW_IT_WORKS_HREF = "/#at-work";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="SJC logo" className="h-9 w-9 rounded-full" />
          <span className="text-base font-semibold tracking-tight">Steven James Consulting</span>
        </a>

        <nav className="flex items-center gap-4">
          <a href="/" aria-label="Home" className="opacity-90 transition hover:opacity-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10v9h5v-5h4v5h5v-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <a
            href={HOW_IT_WORKS_HREF}
            className="rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)]"
          >
            How It Works &rarr;
          </a>
        </nav>
      </div>
    </header>
  );
}
