"use client";
import Editable from "./edit/Editable";

export default function Moat() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-6 py-20 md:py-24">
        <Editable
          tid="home.moat.eyebrow"
          as="p"
          className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]"
        >
          The Moat — Why Me
        </Editable>
        <Editable
          tid="home.moat.h2"
          as="h2"
          className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl"
        >
          The Moat — Why Me
        </Editable>

        <div className="mt-8 space-y-6 text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
          <Editable tid="home.moat.p1" as="p">
            Here's the un-fakeable part, and it's the reason this works with me and is very hard to copy.
          </Editable>
          <Editable tid="home.moat.p2" as="p">
            This only works if one person is two things at once: a real operator who has actually run the kind of businesses you buy, and someone who is genuinely AI-native and builds the technology himself. Those two almost never live in the same person. The twenty-two-year-old AI founder can build the system, but he's never made a payroll, never wrangled a control-freak owner, never run a real shop through a slow season — he doesn't understand the businesses you're rolling up or the man who built them, and the owner sniffs that out in the first sentence. The forty-year operator understands all of that in his bones, but he can't suddenly become AI-native and build the thing by hand — so he ends up reselling somebody else's software and re-rates nothing.
          </Editable>
          <Editable tid="home.moat.p3" as="p">
            I'm both. Forty years running businesses across five industries — restaurant in '86, then mortgage, then roofing, twenty years in trucking — and the tech lead in every one of them, the guy who figured out the technology of each era because the company was too small to afford anyone else. And now I build the AI myself. Not a deck I bought, not a vendor I white-label. I sit on top of my own AI workforce and I build it by hand. So when I sit across from one of your owners, I'm not the tech guy he tolerates — I'm a man who ran shops just like his for forty years and happens to be the one who can install the machine. He believes me because I've stood where he's standing. And when I sit across from you, I'm the partner you've been looking for on the tech side of the table and couldn't find, because the overlap you needed — real operator and hands-on builder — barely exists. That overlap is the moat. There's no one to send you to bid against, because the two halves almost never come in one person.
          </Editable>
        </div>
      </div>
    </section>
  );
}
