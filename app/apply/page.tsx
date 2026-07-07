import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ApplyForm from "@/components/ApplyForm";

// Public discovery-call intake. NOTE: /apply and /api/apply are explicitly allowed through
// the site password gate in middleware.ts so real prospects can reach this while the rest of
// the site stays private pre-launch.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply — Steven James Consulting",
  description: "Tell us about your business. If it's a fit, we'll talk.",
};

export default function Apply() {
  return (
    <>
      <Nav />
      <main className="bg-[color:var(--color-sjc-bg-soft)]">
        <section className="w-full">
          <div className="mx-auto max-w-2xl px-6 pt-14 text-center md:pt-20">
            <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-sjc-blue)]">
              Apply to work with me
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-[color:var(--color-sjc-ink)] md:text-4xl">
              We&apos;re not for everybody — and that&apos;s on purpose.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--color-sjc-mute)]">
              A few quick questions so we can see if we can actually help you. Takes under two
              minutes — then pick a time and we&apos;ll talk. No pitch, just a real conversation.
            </p>
          </div>
        </section>
        <ApplyForm />
      </main>
      <Footer />
    </>
  );
}
