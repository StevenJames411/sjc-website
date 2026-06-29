const LOGO_URL =
  "https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/1afcb97f-5140-41e4-eef9-75003ad28b00/public";

export type FooterLink = { label: string; target: string };
export type FooterViewProps = {
  blurb?: string;
  links?: FooterLink[];
  phone?: string;
  phoneDisplay?: string;
  email?: string;
  privacyUrl?: string;
  tosUrl?: string;
  copyright?: string;
};

// The live site footer, rendered from props. Used BOTH on the live site (via Footer.tsx, which
// reads the published "footer" block) AND in the builder preview (via the SiteFooter Puck block),
// so what Steven edits at /edit/footer is exactly what ships. Static (no interactivity).
export default function FooterView({
  blurb = "",
  links = [],
  phone = "+12102982343",
  phoneDisplay = "(210) 298-2343",
  email = "support@stevenjamesconsulting.com",
  privacyUrl = "",
  tosUrl = "",
  copyright = "Steven James Consulting",
}: FooterViewProps) {
  const year = new Date().getFullYear();
  const linkEls = (links || []).filter((l) => l && l.label);
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)]";
  return (
    <footer style={{ backgroundColor: "#111827" }} className="text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="SJC logo" className="h-12 w-12 rounded-full" />
              <span className="text-lg font-semibold">Steven James Consulting</span>
            </div>
            {blurb ? <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/80">{blurb}</p> : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${phone}`} className={btn}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                </svg>
                Call Us
              </a>
              <a href={`sms:${phone}`} className={btn}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
                </svg>
                Text Us
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">More</p>
            <ul className="mt-4 space-y-3 text-sm">
              {linkEls.map((l, i) => (
                <li key={i}>
                  <a href={l.target || "#"} className="text-white/80 hover:text-white">{l.label}</a>
                </li>
              ))}
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="text-white/80 hover:text-white">{email}</a>
                </li>
              ) : null}
              {phoneDisplay ? (
                <li>
                  <a href={`tel:${phone}`} className="text-white/80 hover:text-white">{phoneDisplay}</a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {copyright}. All rights reserved.</p>
          <div className="flex gap-6">
            {privacyUrl ? (
              <a href={privacyUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            ) : null}
            {tosUrl ? (
              <a href={tosUrl} className="hover:text-white" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
