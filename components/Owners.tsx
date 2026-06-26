"use client";
import Editable from "./edit/Editable";

export default function Owners() {
  return (
    <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.owners.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          Your Hardest Adversary Is the Owners
        </Editable>
        <Editable
          tid="home.owners.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          Your Hardest Adversary Isn't the Competition — It's the Owners
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.owners.p1" as="p">
            Here's the part nobody selling to you ever names, because most of them have never sat in the chair: your hardest adversary in this whole game isn't another consolidator bidding against you. It's the owners you're buying.
          </Editable>
          <Editable tid="home.owners.p2" as="p">
            You know the type — you've sat across the table from him a dozen times. He built the place from nothing. He took the risk when nobody would loan him a dime. He's worn every hat in the shop for twenty years because every single time he tried to hand one off, the person let him down — quit, cut corners, didn't care the way he cared. So he stopped handing things off. He does it all himself, and he's proud of that. That pride is the whole reason his shop is worth buying — and it's the exact thing that fights you the moment the deal closes.
          </Editable>
          <Editable tid="home.owners.p3" as="p">
            He won't let go. You bought the business, but you didn't buy his hands off the wheel. He fights the integration at every step. He doesn't want your CRM — his way works fine, thank you. He doesn't want your call center answering his customers, because nobody knows his customers like he does. He slow-walks the SOPs. He keeps the relationships in his own head where you can't see them, half on purpose, because as long as it lives in his head, he still matters. And the worst part: he's not aligned on the exit. You're building toward a sale in three to five years. He's not sure he ever wants to sell, and even when he signed, a part of him is still running his little shop the way he ran it in 1998. Getting him on the same page about a big platform exit — getting him to actually chase it with you instead of dragging on the rope — is the daily grind of your entire job. It's the real bottleneck on every deal you do. Not capital. Not finding targets. The human you bought.
          </Editable>
          <Editable tid="home.owners.p4" as="p">
            I know this because I lived it from the other side. I had my own version of this owner — I'll call him what he is, a control freak, and I mean that with respect because I am one too. He fought me every step. He wouldn't let go of a single thing. Every recommendation got second-guessed, every handoff got clawed back, and the harder I pushed, the tighter he gripped. I have the scar tissue. I'm not theorizing about your toughest problem from a conference stage. I've been the guy on the other end of the table from a man who would rather drown holding the wheel than let anyone else touch it.
          </Editable>
          <Editable tid="home.owners.p5" as="p">
            And here's why that matters to you specifically: the thing that fixes this isn't a softer pitch or a better integration consultant. It's a tool — a specific one — that gets a man like that to climb aboard because it hands him more control, not less. I'll show you exactly what it is. But first, the lid.
          </Editable>
        </div>
      </div>
    </section>
  );
}
