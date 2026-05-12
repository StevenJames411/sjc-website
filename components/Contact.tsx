// GHL calendar embed code goes inside the marked block below.
// When Steven drops the iframe/script in, paste it inside <div id="ghl-calendar"> ... </div>
// and remove the placeholder text.

export default function Contact() {
  return (
    <section id="contact" style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="tel:+12102982343"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-3 font-semibold text-white shadow hover:bg-[color:var(--color-sjc-blue-hover)] sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293a13.51 13.51 0 01-6.07-6.07l1.293-.97c.362-.271.527-.733.417-1.173L8.617 3.852A1.125 1.125 0 007.526 3H6.75A4.5 4.5 0 002.25 7.5v-.75z" />
            </svg>
            Call Us
          </a>
          <a
            href="sms:+12102982343"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-sjc-blue)] px-6 py-3 font-semibold text-white shadow hover:bg-[color:var(--color-sjc-blue-hover)] sm:w-auto"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
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

          <div id="ghl-calendar" className="mt-6 min-h-[640px] rounded-xl bg-[color:var(--color-sjc-bg-soft)] p-6">
            {/*
              PASTE GHL CALENDAR EMBED HERE.
              GoHighLevel will provide an <iframe> snippet — drop it in this div
              and delete this placeholder block.
            */}
            <p className="text-center text-sm text-[color:var(--color-sjc-mute)]">
              [ GHL calendar embed will load here ]
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
