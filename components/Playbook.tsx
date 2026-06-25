"use client";
import Editable from "./edit/Editable";

export default function Playbook() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.playbook.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The Playbook You Already Run
        </Editable>
        <Editable
          tid="home.playbook.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The Playbook You Already Run
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.playbook.p1" as="p">
            You know this cold, so I'll say it back to you the way you'd say it yourself — not to teach you, but so you know I'm not guessing.
          </Editable>
          <Editable tid="home.playbook.p2" as="p">
            You find a fragmented industry. Lots of owner-operated shops, no national brand, no consolidator who's gotten serious yet. Plumbing. HVAC. Dental. Med spas. Roofing. Vet clinics. The kind of business where the owner is the business — he answers the phone, he runs the schedule, he knows every customer by name, and the whole thing lives in his head and his calendar. You build a thesis around it. You find your platform deal first — a real operator with real EBITDA, clean enough books, a number you can defend to your LPs. That's the anchor. Then you go hunting tuck-ins around it.
          </Editable>
          <Editable tid="home.playbook.p3" as="p">
            You buy five, six, seven of them. You don't overpay — you're buying these at four, five, six times earnings because they're small and the seller has no other bidder at the table. You bolt them onto the platform. Then the integration grind starts, and you know exactly how that goes: one accounting system instead of seven, one set of vendor contracts so you've got buying power, shared marketing, shared back office, one phone system, one CRM, one set of SOPs you're trying to push down into shops that have done it their own way for twenty years. You strip the duplicate G&A. You renegotiate the merchant fees, the insurance, the supply contracts. You put in a real GM layer so it doesn't all depend on the founder anymore.
          </Editable>
          <Editable tid="home.playbook.p4" as="p">
            Then comes the arbitrage everyone in your world understands and most outsiders never get: you bought the pieces at five times earnings, and once they're bundled into a platform doing real EBITDA with a professional management layer and clean financials, that same cash flow trades at ten, twelve, fourteen times when you sell it up the chain. Same dollars of earnings, worth double or triple, purely because of size, story, and how clean the platform reads to the next buyer. The multiple arbitrage is the business. The operations work is in service of it.
          </Editable>
          <Editable tid="home.playbook.p5" as="p">
            And you run the whole thing on linear tools. A CRM. A marketing automation stack — the GoHighLevel-class systems, the booking widgets, the email and text sequences. Software that does what software has always done: if this, then that. A lead comes in, fire a text. Seven days no response, fire another. It's a conveyor belt. It moves the lead from A to B in a straight line, and it's been the state of the art for fifteen years. Every operator in your space runs some version of it. It's table stakes. Nobody wins on it anymore — you run it so you don't lose on it.
          </Editable>
          <Editable tid="home.playbook.p6" as="p">
            That's the playbook. Source, buy at a low multiple, integrate, professionalize, run it on linear tools, exit at a high multiple to PE. I'm not here to tell you it's wrong. I'm here because I know it well enough to show you where the lid is.
          </Editable>
        </div>
      </div>
    </section>
  );
}
