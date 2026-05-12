import Image from "next/image";
import CtaButton from "./CtaButton";

export default function About() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <p className="text-lg font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">About</p>
          <h2 className="mt-3 text-2xl font-bold text-[color:var(--color-sjc-ink)] md:text-3xl">
            I&apos;m Steven Barchetti.
          </h2>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-[color:var(--color-sjc-ink)] md:text-lg">
            <p>
              I run Steven James Consulting as a fractional CTO for owners doing $1M–$5M who hit the wall
              where the founder is the system. My background is engineering and systems.
            </p>
            <p>
              I build with the latest software and keep it modular so when ever something changes it&apos;s
              an easy upgrade. Most agencies sell you software. I create and install operating systems.
            </p>
            <p>The audit is how we see what&apos;s broken with your systems.</p>
          </div>
          <div className="mt-8">
            <CtaButton />
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <Image
            src="/about-headshot.webp"
            alt="Steven Barchetti, founder of Steven James Consulting"
            width={490}
            height={766}
            sizes="(min-width: 768px) 288px, 256px"
            priority={false}
            className="w-64 rounded-xl shadow-lg md:w-72"
          />
        </div>
      </div>
    </section>
  );
}
