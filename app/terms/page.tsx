import type { Metadata } from "next";
import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import { LegalPage, LEGAL, Reach } from "@/components/LegalPage";

const SJC_METADATA: Metadata = {
  title: "Terms of Service — Steven James Consulting",
  description: "The terms for using the Steven James Consulting website, buying from it, and receiving text messages from us.",
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tenantPageMetadata("terms");
  return tenant || SJC_METADATA;
}

export default async function TermsPage() {
  const tenant = await tenantPage("terms");
  if (tenant) return tenant;
  return (
    <LegalPage eyebrow="Terms" title="Terms of Service and Text Message Terms">
      <p>
        This website is run by {LEGAL.company}, doing business as {LEGAL.dba}, {LEGAL.place} (&ldquo;we&rdquo;). By using
        it you agree to these terms.
      </p>

      <h2>Text message terms</h2>
      <ul>
        <li><strong>Who texts you:</strong> {LEGAL.dba} and its AI employees.</li>
        <li><strong>What the texts are about:</strong> your inquiry, appointment confirmations and reminders, and follow-up on your questions.</li>
        <li><strong>How you sign up:</strong> by giving your mobile number on this website, to our AI employee, or on a call with us, and agreeing to be texted. Agreeing is never a condition of buying anything.</li>
        <li><strong>How often:</strong> it varies with your conversation.</li>
        <li><strong>Cost:</strong> message and data rates may apply, depending on your mobile plan.</li>
        <li><strong>To stop:</strong> reply STOP. You will get one message confirming you are unsubscribed, and no more after that.</li>
        <li><strong>For help:</strong> reply HELP, or <Reach />.</li>
        <li>Mobile carriers are not responsible for messages that are delayed or not delivered.</li>
      </ul>
      <p>
        How your number is handled is in our <a href="/privacy">Privacy Policy</a>. Your mobile number and your agreement
        to receive texts are never shared with anyone else for their marketing.
      </p>

      <h2>Our services</h2>
      <p>
        Services we build or run for a client are covered by the written agreement we sign with that client. Where that
        agreement and these terms differ, the agreement wins.
      </p>

      <h2>Purchases</h2>
      <p>
        Prices and what is included are shown at checkout. Digital products are delivered by download or email after
        payment.
      </p>

      <h2>No guaranteed results</h2>
      <p>
        What we show on this website, including working models and examples, explains what we do. It is not a promise of
        any particular result for your business, and nothing here is legal, tax or financial advice.
      </p>

      <h2>The AI employee on this website</h2>
      <p>
        Our AI employee answers general questions and books calls. If an answer matters to a decision, confirm it with us
        on the call.
      </p>

      <h2>Our content</h2>
      <p>
        The writing, video, images and designs on this website belong to {LEGAL.company} or the people who made them, and
        may not be copied for another use without permission.
      </p>

      <h2>Limits</h2>
      <p>
        The website is provided as it is. To the extent the law allows, we are not responsible for indirect losses from
        using it. These terms are governed by the laws of the State of Texas.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If these terms change, the new version will be posted on this page with a new date at the top. Questions: <Reach />.
      </p>
    </LegalPage>
  );
}
