import type { Metadata } from "next";
import { tenantPage, tenantPageMetadata } from "@/lib/sjcRoute";
import { LegalPage, LEGAL, Reach } from "@/components/LegalPage";

const SJC_METADATA: Metadata = {
  title: "Privacy Policy — Steven James Consulting",
  description: "How Steven James Consulting collects, uses and protects the information you share on this website, by phone and by text.",
};

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await tenantPageMetadata("privacy");
  return tenant || SJC_METADATA;
}

export default async function PrivacyPage() {
  const tenant = await tenantPage("privacy");
  if (tenant) return tenant;
  return (
    <LegalPage eyebrow="Privacy" title="Privacy Policy">
      <p>
        This website is run by {LEGAL.company}, doing business as {LEGAL.dba}, {LEGAL.place} (&ldquo;we&rdquo;). This
        page explains what information we collect, what we use it for, and the choices you have.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>What you tell us.</strong> Your name, email address, mobile number, business details, and your answers on any form, application or booking.</li>
        <li><strong>Conversations with our AI employee.</strong> When you talk or type to the assistant on this website, the conversation may be recorded and written down so we can follow up properly.</li>
        <li><strong>Purchases.</strong> When you buy something, our payment processor handles your card. We never see or store your full card number.</li>
        <li><strong>Basic visit information.</strong> The pages you view, the kind of device and browser you use, how you arrived here, and the links you click, measured with cookies and similar tools.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To answer your questions and book the calls you ask for.</li>
        <li>To deliver what you bought and the services we agree to provide.</li>
        <li>To contact you by phone, text or email about your inquiry, your appointment or your account.</li>
        <li>To keep the website working, measure what is useful, and improve it.</li>
      </ul>

      <h2>Text messages</h2>
      <p>
        If you give us your mobile number and agree to receive texts, you may get messages about your inquiry, appointment
        confirmations and reminders, and follow-up on your questions. How often depends on your conversation with us.
        Message and data rates may apply. Reply <strong>STOP</strong> at any time to stop the texts, or <strong>HELP</strong> for help.
      </p>
      <p>
        <strong>Your mobile number and your agreement to receive texts are never sold, rented or shared with anyone else for their own marketing.</strong>{" "}
        The only companies that handle them are the ones that deliver the messages for us.
      </p>

      <h2>Who else sees it</h2>
      <p>
        We do not sell your information. We share it only with the companies that help us run this business (website
        hosting, phone and text delivery, email delivery, payments, scheduling and the system that keeps our contact
        records), each only for that job, and when the law requires it.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Reply STOP to any text to stop texts, or use the unsubscribe link in any email.</li>
        <li>Ask what information we hold about you, or ask us to correct or delete it: <Reach />.</li>
        <li>You can block or clear cookies in your browser settings.</li>
      </ul>

      <h2>Keeping it safe</h2>
      <p>
        We keep your information only as long as we need it for the reasons above, and we use reasonable care to protect
        it. This website is not meant for children under 13, and we do not knowingly collect their information.
      </p>

      <h2>Changes</h2>
      <p>If this policy changes, the new version will be posted on this page with a new date at the top.</p>

      <p>
        See also our <a href="/terms">Terms of Service and Text Message Terms</a>. Questions: <Reach />.
      </p>
    </LegalPage>
  );
}
