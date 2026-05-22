import Script from "next/script";

export default function Contact() {
  return (
    <section id="contact" style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="tel:+12102982343"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-3 font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)] sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
            </svg>
            Call Us
          </a>
          <a
            href="sms:+12102982343"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-3 font-semibold text-white shadow hover:bg-[color:var(--color-sjc-green)] sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.521c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
            </svg>
            Text Us
          </a>
        </div>

        <div className="mt-12 rounded-2xl bg-white p-2 shadow-sm md:p-4">
          <h2 className="px-4 pt-4 text-center text-2xl font-bold text-[color:var(--color-sjc-ink)]">
            Book a free strategy call
          </h2>
          <p className="mt-2 px-4 text-center text-sm text-[color:var(--color-sjc-mute)]">
            Pick a time that works — the audit is free, the systems we install are what change the business.
          </p>

          <div id="ghl-calendar" className="mt-6 overflow-hidden rounded-xl bg-white">
            <iframe
              src="https://api.leadconnectorhq.com/widget/booking/EPyQZsjydJimWRXD1S80"
              style={{ width: "100%", border: "none", overflow: "hidden", minHeight: "700px" }}
              scrolling="no"
              id="3FfjYA4TJ1XIbIBDy1Gh_1778887105184"
              title="Book a strategy call"
            />
            <Script src="https://link.msgsndr.com/js/form_embed.js" strategy="afterInteractive" />
          </div>
        </div>
      </div>
    </section>
  );
}
