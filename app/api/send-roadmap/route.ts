import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

// === Tunable constants ============================================================
const BUILD_FEE = 22000;
const MONTHLY_TOOLING = 1100;
const TRADITIONAL_PAYROLL = 532000;
const BOOKING_URL = "https://www.stevenjamesconsulting.com";
// ==================================================================================

type RolePayload = {
  name: string;
  description: string;
  hoursPerWeek: number;
  humanCost: number;
  aiCost: number;
};

type Payload = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;

  worn_count: number;
  staff_count: number;
  vacant_count: number;

  worn_hours_per_week: number;
  staff_hours_per_week: number;
  vacant_hours_per_week: number;
  total_hours_per_week: number;

  // HTML-formatted (kept for GHL email/PDF templates)
  worn_jobs: string;
  staff_jobs: string;
  vacant_jobs: string;

  // Structured (used to render the PDF on Vercel)
  worn_roles: RolePayload[];
  staff_roles: RolePayload[];
  vacant_roles: RolePayload[];

  worn_human_cost: number;
  worn_ai_cost: number;
  vacant_human_cost: number;
  vacant_ai_cost: number;

  source: string;
};

const fmt$ = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// --- PDF styles ------------------------------------------------------------------

const SJC_BLUE = "#1d4ed8";
const SJC_INK = "#0f172a";
const SUBTLE = "#475569";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    padding: 44,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: SJC_INK,
    backgroundColor: "#ffffff",
    lineHeight: 1.45,
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: SJC_BLUE,
    paddingBottom: 12,
  },
  brand: {
    fontSize: 9,
    color: SUBTLE,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
    lineHeight: 1.15,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: SUBTLE,
    lineHeight: 1.3,
  },

  intro: {
    marginBottom: 16,
  },
  introBody: {
    fontSize: 11,
    color: SJC_INK,
    lineHeight: 1.55,
  },

  bucketCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    overflow: "hidden",
  },
  bucketHeader: {
    backgroundColor: SJC_INK,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bucketTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bucketCount: {
    fontSize: 10,
    color: "#cbd5e1",
  },
  bucketEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 10,
    color: SUBTLE,
    fontStyle: "italic",
  },
  roleRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  roleIndex: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SJC_BLUE,
    width: 18,
  },
  roleBody: {
    flex: 1,
  },
  roleTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  roleName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
  },
  roleHours: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: SJC_BLUE,
  },
  roleDesc: {
    fontSize: 9.5,
    color: SUBTLE,
    marginTop: 2,
    lineHeight: 1.4,
  },
  bucketTotal: {
    backgroundColor: SJC_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "center",
  },
  bucketTotalText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.4,
  },

  // Cost comparison
  costSection: {
    marginTop: 6,
    marginBottom: 14,
  },
  sectionHead: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 9.5,
    color: SUBTLE,
    marginBottom: 10,
  },
  tierRow: {
    flexDirection: "row",
    gap: 10,
  },
  tier: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
  },
  tierRecommended: {
    borderColor: SJC_BLUE,
    borderWidth: 2,
    backgroundColor: "#eff6ff",
  },
  tierEyebrow: {
    fontSize: 8.5,
    color: SUBTLE,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  tierEyebrowBlue: {
    fontSize: 8.5,
    color: SJC_BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  tierName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
    marginBottom: 6,
  },
  tierPrice: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
    marginBottom: 1,
  },
  tierPriceUnit: {
    fontSize: 9,
    color: SUBTLE,
    marginBottom: 8,
  },
  tierLine: {
    fontSize: 9.5,
    color: SJC_INK,
    marginBottom: 3,
    lineHeight: 1.4,
  },

  // CTA
  ctaBox: {
    backgroundColor: SJC_BLUE,
    borderRadius: 10,
    padding: 18,
    marginTop: 4,
  },
  ctaTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  ctaBody: {
    fontSize: 10.5,
    color: "#dbeafe",
    marginBottom: 10,
    lineHeight: 1.45,
  },
  ctaLink: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textDecoration: "underline",
  },

  footer: {
    marginTop: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: SUBTLE,
  },
});

// --- PDF component ----------------------------------------------------------------

function pluralizeJob(n: number) {
  return n === 1 ? "job" : "jobs";
}

function BucketCard({
  title,
  emptyLine,
  roles,
  totalHours,
}: {
  title: string;
  emptyLine: string;
  roles: RolePayload[];
  totalHours: number;
}) {
  if (roles.length === 0) {
    return React.createElement(
      View,
      { style: styles.bucketCard },
      React.createElement(
        View,
        { style: styles.bucketHeader },
        React.createElement(Text, { style: styles.bucketTitle }, title),
        React.createElement(Text, { style: styles.bucketCount }, "0 jobs")
      ),
      React.createElement(Text, { style: styles.bucketEmpty }, emptyLine)
    );
  }

  return React.createElement(
    View,
    { style: styles.bucketCard, wrap: false },
    React.createElement(
      View,
      { style: styles.bucketHeader },
      React.createElement(Text, { style: styles.bucketTitle }, title),
      React.createElement(
        Text,
        { style: styles.bucketCount },
        `${roles.length} ${pluralizeJob(roles.length)}`
      )
    ),
    ...roles.map((r, i) =>
      React.createElement(
        View,
        { key: r.name, style: styles.roleRow },
        React.createElement(Text, { style: styles.roleIndex }, `${i + 1}.`),
        React.createElement(
          View,
          { style: styles.roleBody },
          React.createElement(
            View,
            { style: styles.roleTopline },
            React.createElement(Text, { style: styles.roleName }, r.name),
            React.createElement(Text, { style: styles.roleHours }, `${r.hoursPerWeek} hrs/week`)
          ),
          React.createElement(Text, { style: styles.roleDesc }, r.description)
        )
      )
    ),
    React.createElement(
      View,
      { style: styles.bucketTotal },
      React.createElement(Text, { style: styles.bucketTotalText }, `Total: ${totalHours} hrs/week`)
    )
  );
}

function RoadmapPDF({ p, today }: { p: Payload; today: string }) {
  const perEmployee = Math.round(BUILD_FEE / 12);
  const firstName = p.firstName || p.name.split(" ")[0] || "there";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page, wrap: true },

      // Header
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        React.createElement(Text, { style: styles.brand }, "Steven James Consulting · 12-Role Roadmap"),
        React.createElement(Text, { style: styles.title }, `${firstName}'s Roadmap`),
        React.createElement(
          Text,
          { style: styles.subtitle },
          `12-Role Assessment · ${p.total_hours_per_week} hrs/week mapped · ${today}`
        )
      ),

      // Intro
      React.createElement(
        View,
        { style: styles.intro },
        React.createElement(
          Text,
          { style: styles.introBody },
          `Here's the picture, ${firstName}. You're personally holding ${p.worn_count} ${pluralizeJob(
            p.worn_count
          )}. Your current staff handles ${p.staff_count}. And ${p.vacant_count} ${
            p.vacant_count === 1 ? "seat is" : "seats are"
          } sitting empty. Below are the three groups, the hours each one demands, and the cost comparison for filling them with a full human team versus an AI-augmented build.`
        )
      ),

      // Three buckets
      BucketCard({
        title: "Seats you're holding right now",
        emptyLine: "None — you're not wearing any of the operational seats.",
        roles: p.worn_roles,
        totalHours: p.worn_hours_per_week,
      }),
      BucketCard({
        title: "Seats your current staff member handles",
        emptyLine: "None — no staff member is covering any operational seat.",
        roles: p.staff_roles,
        totalHours: p.staff_hours_per_week,
      }),
      BucketCard({
        title: "Vacant seats — no one is covering this work",
        emptyLine: "None — every operational seat has someone in it.",
        roles: p.vacant_roles,
        totalHours: p.vacant_hours_per_week,
      }),

      // Cost comparison
      React.createElement(
        View,
        { style: styles.costSection, break: true },
        React.createElement(Text, { style: styles.sectionHead }, "The three ways to fill the org chart"),
        React.createElement(
          Text,
          { style: styles.sectionSub },
          "All twelve seats, three different paths. AI augments the team — it doesn't replace it."
        ),
        React.createElement(
          View,
          { style: styles.tierRow },
          // Tier 1 — Hire 12 humans
          React.createElement(
            View,
            { style: styles.tier },
            React.createElement(Text, { style: styles.tierEyebrow }, "Tier 1"),
            React.createElement(Text, { style: styles.tierName }, "Hire 12 humans"),
            React.createElement(Text, { style: styles.tierPrice }, fmt$(TRADITIONAL_PAYROLL)),
            React.createElement(Text, { style: styles.tierPriceUnit }, "per year in payroll"),
            React.createElement(Text, { style: styles.tierLine }, "• 12 full-time humans, every seat staffed"),
            React.createElement(Text, { style: styles.tierLine }, "• Hiring, benefits, management overhead"),
            React.createElement(Text, { style: styles.tierLine }, "• Training cost not even included")
          ),
          // Tier 2 — Build it yourself
          React.createElement(
            View,
            { style: styles.tier },
            React.createElement(Text, { style: styles.tierEyebrow }, "Tier 2"),
            React.createElement(Text, { style: styles.tierName }, "Build it yourself"),
            React.createElement(Text, { style: styles.tierPrice }, "$0"),
            React.createElement(Text, { style: styles.tierPriceUnit }, "build fee — you wire it up"),
            React.createElement(Text, { style: styles.tierLine }, "• Same 12 seats, you build the AI employees"),
            React.createElement(Text, { style: styles.tierLine }, "• You learn the stack — hat #13"),
            React.createElement(Text, { style: styles.tierLine }, "• Costs nothing, if you know how")
          ),
          // Tier 3 — Build with Steven
          React.createElement(
            View,
            { style: [styles.tier, styles.tierRecommended] },
            React.createElement(Text, { style: styles.tierEyebrowBlue }, "Tier 3 · Recommended"),
            React.createElement(Text, { style: styles.tierName }, "Build with me"),
            React.createElement(Text, { style: styles.tierPrice }, fmt$(BUILD_FEE)),
            React.createElement(
              Text,
              { style: styles.tierPriceUnit },
              `one-time build + ~${fmt$(MONTHLY_TOOLING)}/mo tooling`
            ),
            React.createElement(
              Text,
              { style: styles.tierLine },
              `• 12 AI employees, custom-built (~${fmt$(perEmployee)} each)`
            ),
            React.createElement(Text, { style: styles.tierLine }, "• Trained on your brand voice"),
            React.createElement(Text, { style: styles.tierLine }, "• After year one, just tokens and hosting")
          )
        )
      ),

      // CTA
      React.createElement(
        View,
        { style: styles.ctaBox },
        React.createElement(
          Text,
          { style: styles.ctaTitle },
          "Want to walk through your roadmap together?"
        ),
        React.createElement(
          Text,
          { style: styles.ctaBody },
          "Bring this PDF to a working call. We'll go seat by seat — the order to fill them, the tooling to use, the KPIs to track. Run with it yourself, or let me execute it for you."
        ),
        React.createElement(Link, { src: BOOKING_URL, style: styles.ctaLink }, BOOKING_URL)
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          "Steven James Consulting · stevenjamesconsulting.com"
        ),
        React.createElement(Text, { style: styles.footerText }, `12-Role Roadmap · ${today}`)
      )
    )
  );
}

// --- Route handler ----------------------------------------------------------------

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "roadmap"
  );
}

export async function POST(req: NextRequest) {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // 1. Render PDF + upload to Vercel Blob (if configured).
  let pdfUrl: string | undefined;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const buffer = await renderToBuffer(RoadmapPDF({ p: payload, today }));
    if (blobToken) {
      const slug = slugify(payload.name || payload.email.split("@")[0]);
      const blob = await put(`roadmaps/${slug}-${Date.now()}.pdf`, buffer, {
        access: "public",
        contentType: "application/pdf",
        token: blobToken,
        addRandomSuffix: false,
      });
      pdfUrl = blob.url;
    } else {
      console.warn("[send-roadmap] BLOB_READ_WRITE_TOKEN unset — PDF generated but not uploaded.");
    }
  } catch (pdfErr) {
    console.error("[send-roadmap] PDF generation/upload failed:", String(pdfErr));
  }

  // 2. Push to GHL via Private Integration Token (PIT): upsert contact with all
  //    custom fields + tag, then queue an email through the Conversations API.
  //    Field IDs below are the SJC location's custom field UUIDs — keep them in
  //    lockstep with /settings/fields. If a field is recreated, refresh the ID.
  const GHL_FIELD_IDS = {
    worn_count: "sgxcSPg4HTBqeW8KRxCJ",
    staff_count: "5pomvvrkJRzECscnpCvB",
    vacant_count: "H5Rx2iPeV4XJbaH6bb4L",
    worn_hours_per_week: "4WcoRPPe5Os3mstamxm1",
    staff_hours_per_week: "vYKmzcv6Fdcl0jfFvb6n",
    vacant_hours_per_week: "KEgcr2XBzlQyGesUuVMA",
    total_hours_per_week: "v5WIe36KF34r2rH4fmmE",
    worn_jobs: "wSb9KGtPONUv5bT2ifgT",
    staff_jobs: "m29l8RV094wTLqmtaTXV",
    vacant_jobs: "TuQHsA1lChhR6HkQank3",
    worn_human_cost: "YJSMDLhPEUocVNOI3JPA",
    worn_ai_cost: "WaMqMn4m0mWK7IGnLd57",
    vacant_human_cost: "JUiKzFBU5GPysSKV6ar0",
    vacant_ai_cost: "8sYlGxJXMMhpDMGBqWF5",
    pdfurl: "NeqSLEyUQLDU5umXZJL4",
  } as const;

  const pit = process.env.GHL_PIT_SJC;
  const locationId = process.env.GHL_LOCATION_ID_SJC;

  if (!pit || !locationId) {
    console.log("[send-roadmap] GHL credentials missing — would have upserted:", {
      email: payload.email,
      pdfUrl,
    });
    return NextResponse.json({
      success: true,
      pdfUrl: pdfUrl ?? null,
      note: "placeholder — GHL_PIT_SJC / GHL_LOCATION_ID_SJC not configured",
    });
  }

  const ghlHeaders = {
    Authorization: `Bearer ${pit}`,
    "Content-Type": "application/json",
  };

  const upsertBody = {
    locationId,
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    source: payload.source,
    tags: ["assessment-completed"],
    customFields: [
      { id: GHL_FIELD_IDS.worn_count, field_value: payload.worn_count },
      { id: GHL_FIELD_IDS.staff_count, field_value: payload.staff_count },
      { id: GHL_FIELD_IDS.vacant_count, field_value: payload.vacant_count },
      { id: GHL_FIELD_IDS.worn_hours_per_week, field_value: payload.worn_hours_per_week },
      { id: GHL_FIELD_IDS.staff_hours_per_week, field_value: payload.staff_hours_per_week },
      { id: GHL_FIELD_IDS.vacant_hours_per_week, field_value: payload.vacant_hours_per_week },
      { id: GHL_FIELD_IDS.total_hours_per_week, field_value: payload.total_hours_per_week },
      { id: GHL_FIELD_IDS.worn_jobs, field_value: payload.worn_jobs },
      { id: GHL_FIELD_IDS.staff_jobs, field_value: payload.staff_jobs },
      { id: GHL_FIELD_IDS.vacant_jobs, field_value: payload.vacant_jobs },
      { id: GHL_FIELD_IDS.worn_human_cost, field_value: payload.worn_human_cost },
      { id: GHL_FIELD_IDS.worn_ai_cost, field_value: payload.worn_ai_cost },
      { id: GHL_FIELD_IDS.vacant_human_cost, field_value: payload.vacant_human_cost },
      { id: GHL_FIELD_IDS.vacant_ai_cost, field_value: payload.vacant_ai_cost },
      { id: GHL_FIELD_IDS.pdfurl, field_value: pdfUrl ?? "" },
    ],
  };

  let contactId: string | undefined;
  try {
    const upsertRes = await fetch("https://services.leadconnectorhq.com/contacts/upsert", {
      method: "POST",
      headers: { ...ghlHeaders, Version: "2021-07-28" },
      body: JSON.stringify(upsertBody),
    });

    if (!upsertRes.ok) {
      const body = await upsertRes.text();
      console.error("[send-roadmap] GHL upsert failed:", upsertRes.status, body);
      return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
    }

    const upsertJson = (await upsertRes.json()) as { contact?: { id?: string } };
    contactId = upsertJson.contact?.id;
  } catch (err) {
    console.error("[send-roadmap] GHL upsert error:", err);
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }

  if (!contactId) {
    console.error("[send-roadmap] upsert returned no contact id");
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }

  // 3. Queue the roadmap email through GHL's Conversations API so it lands in
  //    the contact's conversation thread + uses the location's email sender.
  const firstName = payload.firstName || payload.name.split(" ")[0] || "there";
  const subject = `${firstName}, your 12-Role Roadmap`;
  const pdfLine = pdfUrl
    ? `<p>Your roadmap is attached as a PDF: <a href="${pdfUrl}">${pdfUrl}</a></p>`
    : `<p>Your roadmap is on its way — we'll follow up shortly.</p>`;
  const html = `
<p>Hi ${firstName},</p>
<p>Here's the picture from your assessment:</p>
<ul>
  <li>You're personally holding <strong>${payload.worn_count}</strong> of the 12 roles.</li>
  <li>A current staff member handles <strong>${payload.staff_count}</strong>.</li>
  <li><strong>${payload.vacant_count}</strong> ${payload.vacant_count === 1 ? "seat is" : "seats are"} sitting empty.</li>
</ul>
${pdfLine}
<p>The roadmap walks every role, the order to fill them, the tooling to use, and the KPIs to track. Run with it yourself or book a working call and I'll execute it with you: <a href="${BOOKING_URL}">${BOOKING_URL}</a>.</p>
<p>— Steven<br>Steven James Consulting</p>
`.trim();

  try {
    const emailRes = await fetch("https://services.leadconnectorhq.com/conversations/messages", {
      method: "POST",
      headers: { ...ghlHeaders, Version: "2021-04-15" },
      body: JSON.stringify({
        type: "Email",
        contactId,
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const body = await emailRes.text();
      console.error("[send-roadmap] GHL email send failed:", emailRes.status, body);
      // Contact is saved — surface partial success so the visitor still sees the submit confirmation.
      return NextResponse.json({
        success: true,
        pdfUrl: pdfUrl ?? null,
        contactId,
        emailQueued: false,
      });
    }
  } catch (err) {
    console.error("[send-roadmap] GHL email send error:", err);
    return NextResponse.json({
      success: true,
      pdfUrl: pdfUrl ?? null,
      contactId,
      emailQueued: false,
    });
  }

  return NextResponse.json({
    success: true,
    pdfUrl: pdfUrl ?? null,
    contactId,
    emailQueued: true,
  });
}
