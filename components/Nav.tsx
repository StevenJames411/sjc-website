"use client";

const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

// Stripped-down nav (Steven's call): the business NAME on the left already links home (the
// universal convention — no redundant house icon needed), and ONE call-to-action button
// "How It Works" on the right that scrolls to the on-page section showing the AI employees
// doing the work (#at-work). "Home"/"Meet Chloe"/"About"/"See It Run" all removed.
const HOW_IT_WORKS_HREF = "/#at-work";

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 w-full" style={{ backgroundColor: "#1e3a6e" }}>
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-white">
        <a href="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="SJC logo" className="h-9 w-9 rounded-full" />
          <span className="text-base font-semibold tracking-tight">Steven James Consulting</span>
        </a>

        {/* Who we are — centered in the empty nav real estate, in the hero green. */}
        <span
          className="absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-sm font-semibold tracking-tight lg:block"
          style={{ color: "#22c55e" }}
        >
          Your Native AI Implementation Partner
        </span>

        <nav className="flex items-center gap-4">
          <a
            href={HOW_IT_WORKS_HREF}
            className="rounded-lg bg-[color:var(--color-sjc-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-sjc-green)]"
          >
            See How It Works &rarr;
          </a>
        </nav>
      </div>
    </header>
  );
}
