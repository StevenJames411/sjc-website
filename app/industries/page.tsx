import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import IndustriesStrip from "@/components/IndustriesStrip";
import CtaButton from "@/components/CtaButton";
import EditablePage from "@/components/edit/EditablePage";
import Editable from "@/components/edit/Editable";
import PublishedOrFallback from "@/components/puck/PublishedOrFallback";
import { readPublished } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Industries | Steven James Consulting",
  description:
    "The fields, and the playbook inside each one. Med spa, roofing, HVAC, garage doors — one engine, every owner-run vertical.",
};

// The Industries hub — "find your field." Reuses the IndustriesStrip card grid (the single
// INDUSTRIES list), so the page grows as fields are added. Each card drills into a deep
// field page.
export default async function IndustriesPage() {
  const published = await readPublished("industries");
  return (
    <>
      <Nav />
      <main>
       <PublishedOrFallback page="industries">
        <EditablePage pageKey="industries" published={published}>
          <section style={{ backgroundColor: "#f3f4f6" }} className="w-full">
            <div className="mx-auto max-w-4xl px-6 pt-10 pb-12 text-center md:pt-14 md:pb-16">
              <Editable tid="industries.eyebrow" as="p" className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--color-sjc-blue)]">
                Industries
              </Editable>
              <Editable tid="industries.h1" as="h1" className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-5xl">
                The fields — and the playbook inside each one.
              </Editable>
              <Editable tid="industries.intro" as="p" className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[color:var(--color-sjc-ink)] md:text-xl">
                Every owner-run business runs the same playbook. Find your field and go deep — the list keeps growing.
              </Editable>
            </div>
          </section>

          <IndustriesStrip />

          <section className="bg-white">
            <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
              <Editable tid="industries.cta" as="p" className="text-lg leading-relaxed text-[color:var(--color-sjc-ink)]">
                Don&apos;t see your field yet? It&apos;s probably next. Let&apos;s talk.
              </Editable>
              <div className="mt-8 flex justify-center">
                <CtaButton title="Book the Call" subtitle="One operator to another." />
              </div>
            </div>
          </section>
        </EditablePage>
       </PublishedOrFallback>
      </main>
      <Footer />
    </>
  );
}
