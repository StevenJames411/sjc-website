const CONTROL_POINTS = [
  {
    title: "You keep the keys",
    body: "Your accounts, your data, your customer list — all stay in your name. Nothing moves into a black box you can't see into.",
  },
  {
    title: "I run the plumbing",
    body: "I install it, operate it, and keep it running in the background — like your CRM or your email provider. You never touch the technical layer.",
  },
  {
    title: "Plumbing, not boss",
    body: "I don't sit above your business. I sit underneath it. I'm the infrastructure you rent — the same way you rent the software you already pay for.",
  },
];

export default function TwoTierModel() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
          Control, Not Dependence
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
          You become the AI-first company. You never hand over the keys.
        </h2>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <p>
            &ldquo;I operate it for you&rdquo; doesn&apos;t mean I take over.
            It means I run the technical side so you don&apos;t have to &mdash;
            exactly the way you rent your CRM, your email, and your phone
            system today. You keep your hand on every lead and every dollar.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {CONTROL_POINTS.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <h3 className="text-lg font-bold leading-snug text-[color:var(--color-sjc-blue)]">
                {c.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-[color:var(--color-sjc-ink)]">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[color:var(--color-sjc-blue)] bg-[color:var(--color-sjc-blue)] px-8 py-8 text-center text-white md:px-10">
          <p className="text-xl font-bold leading-snug md:text-2xl">
            You stay in control. I&apos;m just the infrastructure you rent to
            keep it that way.
          </p>
        </div>
      </div>
    </section>
  );
}
