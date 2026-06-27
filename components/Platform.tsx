"use client";
import Editable from "./edit/Editable";

export default function Platform() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.platform.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The Platform
        </Editable>
        <Editable
          tid="home.platform.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The Platform — Above Any One Industry
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.platform.p1" as="p">
            Don't let the med spa narrow your thinking, because the business I'm describing isn't a med spa business. It's an AI-implementation company that sits above any single industry.
          </Editable>
          <Editable tid="home.platform.p2" as="p">
            The engine — the AI employee that answers, follows up, qualifies, books, and reactivates; the way it's trained on a specific operator's own playbook; the way it installs on top of the linear software a shop already runs — none of that is specific to clinics. It forks into verticals. Med spas first, because that's where I proved it. Roofing next, because I ran a roofing company and I know exactly where that money leaks. HVAC, because it's the same shape — owner-run, lead-driven, fragmented, bleeding the same leaks. Dental, vet, home services, any field where a fragmented industry of owner-operators is still running the same aging conveyor belt. Same engine, retrained on the new field's playbook, installed in the businesses that run it.
          </Editable>
          <Editable tid="home.platform.p3" as="p">
            That's what this actually is: not a clinic tool, but the company that installs an owned AI workforce on top of whatever business you run — whichever industry, whichever software you already use. Med spa is just where the paint is dry. The platform goes everywhere the playbook goes.
          </Editable>
        </div>
      </div>
    </section>
  );
}
