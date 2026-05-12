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
              Premium Smart Websites for busy owners — with a 24/7 AI receptionist and done-for-you
              automation.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Quick Links</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a href="/" className="text-white/80 hover:text-white">Home</a>
              </li>
              <li>
                <a href="#contact" className="text-white/80 hover:text-white">Book A Systems Audit Call</a>
              </li>
              <li>
                <a href="https://ai-audit-tool-pearl.vercel.app" className="text-white/80 hover:text-white">
                  60-Second AI Audit
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/90">Contact</p>
            <ul className="mt-4 space-y-3 text-sm">
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
