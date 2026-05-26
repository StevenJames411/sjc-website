const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

const PRIVACY_URL = "https://www.privacypolicies.com/live/1cbbc5dd-5b42-4b68-abdd-a279a5e3b4f7";
const TOS_URL = "https://www.privacypolicies.com/live/34bb5cc7-32b9-4449-ae32-7cfe78f34e45";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ backgroundColor: "#111827" }} className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="SJC logo" className="h-12 w-12 rounded-full" />
              <span className="text-lg font-semibold">Steven James Consulting</span>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/80">
              We install the org chart your business should already have &mdash; every seat filled
              by an AI employee &mdash; so your business runs without you.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href="tel:+12102982343"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                </svg>
                Call Us
              </a>
              <a
                href="sms:+12102982343"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)]"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                </svg>
                Text Us
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Quick Links</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="/" className="text-white/80 hover:text-white">Home</a>
              </li>
              <li>
                <a href="/discover-the-lies" className="text-white/80 hover:text-white">Discover the Lies</a>
              </li>
              <li>
                <a href="/about" className="text-white/80 hover:text-white">About</a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Resources</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="/faqs" className="text-white/80 hover:text-white">FAQs</a>
              </li>
              <li>
                <a href="/assessment" className="text-white/80 hover:text-white">Find Your Gap</a>
              </li>
              <li>
                <a href="mailto:support@stevenjamesconsulting.com" className="text-white/80 hover:text-white">
                  support@stevenjamesconsulting.com
                </a>
              </li>
              <li>
                <a href="tel:+12102982343" className="text-white/80 hover:text-white">(210) 298-2343</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ARV Venture Group LLC Parent Company · Steven James Consulting. All rights reserved.</p>
          <div className="flex gap-6">
            <a href={PRIVACY_URL} className="hover:text-white" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <a href={TOS_URL} className="hover:text-white" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
