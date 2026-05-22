import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { put } from "@vercel/blob";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

// === Tunable constants ============================================================
const BUILD_FEE_LIST = 40000;
const BUILD_FEE_FOUNDER = 28000;
const FOUNDER_SPOTS_REMAINING = 5;
// Monthly is two separate components:
//   MONTHLY_UTILITY = AI tokens + cloud hosting, passed through to vendors at cost
//   MONTHLY_RETAINER_* = SJC fractional CTO retainer (founder rate locked for 12 months)
const MONTHLY_UTILITY = 1100;
const MONTHLY_RETAINER_LIST = 3000;
const MONTHLY_RETAINER_FOUNDER = 1500;
const TRADITIONAL_PAYROLL = 532000;
const WEBSITE_URL = "https://www.stevenjamesconsulting.com";
const CALENDAR_URL = "https://api.leadconnectorhq.com/widget/bookings/find-your-gap";
const PHONE_DISPLAY = "(210) 851-4906";
const PHONE_TEL = "+12108514906";
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
    marginBottom: 14,
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

  // Pricing intro & tier panels (vertical layout)
  pricingIntro: {
    fontSize: 10.5,
    color: SJC_INK,
    lineHeight: 1.55,
    marginBottom: 14,
  },
  panel: {
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  panelRecommended: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: SJC_BLUE,
    backgroundColor: "#eff6ff",
  },
  recommendedHeaderCard: {
    borderWidth: 2,
    borderColor: SJC_BLUE,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    padding: 14,
    marginBottom: 14,
    marginTop: 4,
  },
  panelHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  panelHeadLeft: {
    flex: 1,
  },
  panelEyebrow: {
    fontSize: 9,
    color: SUBTLE,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  panelEyebrowRecommended: {
    fontSize: 9,
    color: SJC_BLUE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  panelTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
  },
  panelPriceWrap: {
    alignItems: "flex-end",
  },
  panelPrice: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: SJC_BLUE,
    lineHeight: 1.1,
  },
  panelPriceStrike: {
    fontSize: 13,
    color: "#94a3b8",
    textDecoration: "line-through",
    marginLeft: 6,
    lineHeight: 1.1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  panelPriceUnit: {
    fontSize: 9,
    color: SUBTLE,
    marginTop: 5,
    lineHeight: 1.3,
  },
  founderBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 6,
  },
  founderBadgeText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  founderNote: {
    fontSize: 10,
    color: SUBTLE,
    marginBottom: 12,
    fontFamily: "Helvetica-Oblique",
  },
  panelBody: {
    fontSize: 10.5,
    color: SJC_INK,
    lineHeight: 1.55,
    marginBottom: 6,
  },
  panelBullet: {
    fontSize: 10,
    color: SJC_INK,
    marginLeft: 10,
    marginBottom: 3,
    lineHeight: 1.45,
  },
  panelCallout: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 3,
    borderLeftColor: SJC_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  panelCalloutText: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: SJC_INK,
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
    marginBottom: 12,
    lineHeight: 1.45,
  },
  ctaContactRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "baseline",
  },
  ctaContactLabel: {
    fontSize: 10,
    color: "#bfdbfe",
    width: 78,
  },
  ctaContactValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
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
  const perEmployee = Math.round(BUILD_FEE_FOUNDER / 12);
  const firstName = p.firstName || p.name.split(" ")[0] || "there";

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page, wrap: true },

      // Header — fixed so brand + title repeat on every page.
      React.createElement(
        View,
        { style: styles.header, fixed: true },
        React.createElement(Text, { style: styles.brand }, "Steven James Consulting · 12-Role Roadmap"),
        React.createElement(Text, { style: styles.title }, `${firstName}'s Roadmap`)
      ),

      // Page-1 only subtitle (in-flow, not fixed, so it only appears once at the top of page 1)
      React.createElement(
        Text,
        { style: styles.subtitle },
        `12-Role Assessment · ${p.total_hours_per_week} hrs/week mapped · ${today}`
      ),

      // Intro
      React.createElement(
        View,
        { style: styles.intro },
        React.createElement(
          Text,
          { style: styles.introBody },
          `Here's the picture, ${firstName}. Your business needs 12 roles filled to run without you constantly putting out fires — that's ${p.total_hours_per_week} hours of work per week. You're personally holding ${p.worn_count} of them. Your current staff covers ${p.staff_count}. ${p.vacant_count} ${
            p.vacant_count === 1 ? "seat is" : "seats are"
          } sitting empty. That's your gap — your blind spots — the work nobody is doing, plus the work you're doing instead of running the business. The next pages show what's in the gap, then three ways to plug it.`
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

      // Cost comparison — vertical, layman explanations per tier
      React.createElement(
        View,
        { style: styles.costSection, break: true },
        React.createElement(Text, { style: styles.sectionHead }, "Three ways to fill YOUR org chart"),
        React.createElement(
          Text,
          { style: styles.sectionSub },
          "AI augments the team — it doesn't replace it. Same 12 seats, three different paths to staffing them."
        ),
        React.createElement(
          Text,
          { style: styles.pricingIntro },
          `Your business needs 12 roles filled. Most founders try to do it with 3, 4, or 5 people — that's the gap, and that's why you're working nights and weekends. Here are the three ways to actually plug it.`
        ),

        // ===== TIER 1 =====
        React.createElement(
          View,
          { style: styles.panel, wrap: false },
          React.createElement(
            View,
            { style: styles.panelHeadRow },
            React.createElement(
              View,
              { style: styles.panelHeadLeft },
              React.createElement(Text, { style: styles.panelEyebrow }, "Tier 1"),
              React.createElement(Text, { style: styles.panelTitle }, "Hire 12 humans")
            ),
            React.createElement(
              View,
              { style: styles.panelPriceWrap },
              React.createElement(Text, { style: styles.panelPrice }, fmt$(TRADITIONAL_PAYROLL)),
              React.createElement(Text, { style: styles.panelPriceUnit }, "per year in payroll")
            )
          ),
          React.createElement(
            Text,
            { style: styles.panelBody },
            "Twelve full-time salaries averaging ~$44K each, plus benefits and payroll overhead. That gets the seats filled — but the $532K is just the starting point."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Training is on top of that. Each new hire takes 60–90 days before they're productive. Industry average is $5K–$15K per employee in lost productivity and onboarding. Across 12 hires that's another $60K–$180K in year one."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• You'll need a manager to manage them. Two managers once you cross 8+ employees."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• ~20% annual turnover is normal. You're not hiring once — you're re-hiring 2–3 of them every year."
          ),
          React.createElement(
            View,
            { style: styles.panelCallout },
            React.createElement(
              Text,
              { style: styles.panelCalloutText },
              "Real year-one cost: closer to $700K–$800K once training and management overhead are factored in."
            )
          )
        ),

        // ===== TIER 2 =====
        React.createElement(
          View,
          { style: styles.panel, wrap: false },
          React.createElement(
            View,
            { style: styles.panelHeadRow },
            React.createElement(
              View,
              { style: styles.panelHeadLeft },
              React.createElement(Text, { style: styles.panelEyebrow }, "Tier 2"),
              React.createElement(Text, { style: styles.panelTitle }, "Build it yourself")
            ),
            React.createElement(
              View,
              { style: styles.panelPriceWrap },
              React.createElement(Text, { style: styles.panelPrice }, "$0"),
              React.createElement(Text, { style: styles.panelPriceUnit }, "build fee — you wire it up")
            )
          ),
          React.createElement(
            Text,
            { style: styles.panelBody },
            "You don't pay me. You build all 12 AI employees yourself. That means you become the technical lead for your business. Here's what that actually involves:"
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Learning how to build AI agents that follow instructions reliably and don't make things up."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Wiring up a CRM so your AI employees can read customer info, update records, and communicate with each other and with you."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Connecting email, SMS, calendars, payment systems, and reporting dashboards."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Training each AI employee on your services, pricing, processes, and brand voice."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Maintaining all of it as AI platforms change and your business evolves."
          ),
          React.createElement(
            View,
            { style: styles.panelCallout },
            React.createElement(
              Text,
              { style: styles.panelCalloutText },
              `The price says $0. The real price is hat #13 — another 80–100 hours per week you don't have, learning skills it took me years to develop.`
            )
          )
        ),

        // ===== TIER 3 =====
        // Outer wrapper is `panel` (gray top border + flowing content), same as Tier 1/2.
        // The "Recommended" emphasis lives in a smaller bordered header card at the top
        // (recommendedHeaderCard) — that way the long supporting copy below can span pages
        // without trying to keep an oversized bordered container intact.
        React.createElement(
          View,
          { style: styles.panel, break: true },
          React.createElement(
            View,
            { style: styles.recommendedHeaderCard, wrap: false },
            React.createElement(
              View,
              { style: styles.panelHeadRow },
              React.createElement(
                View,
                { style: styles.panelHeadLeft },
                React.createElement(Text, { style: styles.panelEyebrowRecommended }, "Tier 3 · Recommended"),
                React.createElement(Text, { style: styles.panelTitle }, "I build the AI Operating System for you")
              ),
              React.createElement(
                View,
                { style: styles.panelPriceWrap },
                React.createElement(
                  View,
                  { style: styles.priceRow },
                  React.createElement(Text, { style: styles.panelPrice }, fmt$(BUILD_FEE_FOUNDER)),
                  React.createElement(Text, { style: styles.panelPriceStrike }, fmt$(BUILD_FEE_LIST))
                ),
                React.createElement(
                  Text,
                  { style: styles.panelPriceUnit },
                  "one-time build fee investment"
                ),
                React.createElement(
                  Text,
                  { style: styles.panelPriceUnit },
                  `+ ${fmt$(MONTHLY_RETAINER_FOUNDER)}/mo CTO retainer (${fmt$(MONTHLY_RETAINER_LIST)} list)`
                ),
                React.createElement(
                  Text,
                  { style: styles.panelPriceUnit },
                  `+ ${fmt$(MONTHLY_UTILITY)}/mo utility (pass-through, no markup)`
                )
              )
            ),
            React.createElement(
              View,
              { style: styles.founderBadge },
              React.createElement(
                Text,
                { style: styles.founderBadgeText },
                `Founder Pricing · ${FOUNDER_SPOTS_REMAINING} spots remaining`
              )
            ),
            React.createElement(
              Text,
              { style: [styles.founderNote, { marginBottom: 0 }] },
              `Locked in for the next ${FOUNDER_SPOTS_REMAINING} founders. After spot #${FOUNDER_SPOTS_REMAINING}, list price moves to ${fmt$(BUILD_FEE_LIST)} build + ${fmt$(MONTHLY_RETAINER_LIST)}/mo retainer. Your build fee locks at signing; the ${fmt$(MONTHLY_RETAINER_FOUNDER)}/mo retainer holds for your first 12 months — then we re-evaluate together based on where the technology has moved. Stay, take it over yourself, or move to another vendor — your call.`
            )
          ),

          React.createElement(
            Text,
            { style: [styles.panelBody, { fontFamily: "Helvetica-Bold", marginTop: 4 }] },
            `The ${fmt$(BUILD_FEE_FOUNDER)} founder build fee`
          ),
          React.createElement(
            Text,
            { style: styles.panelBody },
            `That's ~${fmt$(perEmployee)} per AI employee, custom-built for your business. Each one is:`
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Trained on your brand voice. I sit down with you, capture how you talk to customers — the words you use, the words you'd never use, your tone, your sales style — and bake it into the AI employee. When it messages a prospect, it sounds like you wrote it, not like a generic chatbot."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Trained on your services, pricing, processes, and team. On day one, the AI employee knows your business as well as a seasoned human employee would."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Wired into your tech stack — your CRM, email, calendar, and reporting. They actually do the work: book appointments, follow up on leads, send invoices, surface KPIs — not just answer questions."
          ),

          React.createElement(
            Text,
            { style: [styles.panelBody, { fontFamily: "Helvetica-Bold", marginTop: 8 }] },
            `Your monthly costs — two separate line items`
          ),
          React.createElement(
            Text,
            { style: styles.panelBody },
            `${fmt$(MONTHLY_UTILITY)}/month utility (pass-through) + ${fmt$(MONTHLY_RETAINER_FOUNDER)}/month CTO retainer (founder pricing). ${fmt$(MONTHLY_UTILITY + MONTHLY_RETAINER_FOUNDER)}/month total. Here's what each one is:`
          ),
          React.createElement(
            Text,
            { style: [styles.panelBody, { fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 2 }] },
            `Utility — ${fmt$(MONTHLY_UTILITY)}/month, pass-through at cost`
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Tokens — the AI's thinking power. Every time an AI employee responds or processes a request, that's tokens. Like electricity for a machine, except the electricity is brainpower."
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Hosting — the cloud servers your AI employees live on. Same as hosting a website — they need a place to run from."
          ),
          React.createElement(
            Text,
            { style: [styles.panelBody, { fontSize: 10, fontStyle: "italic", marginLeft: 10, marginTop: 2 }] },
            "We pass these straight through to the vendors at cost. No markup. Full transparency on what runs your AI workforce."
          ),
          React.createElement(
            Text,
            { style: [styles.panelBody, { fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 2 }] },
            `Fractional CTO retainer — ${fmt$(MONTHLY_RETAINER_FOUNDER)}/month founder pricing (${fmt$(MONTHLY_RETAINER_LIST)}/month list)`
          ),
          React.createElement(
            Text,
            { style: styles.panelBullet },
            "• Your new fractional Chief Technology Officer (CTO) — that's Steven James Consulting on 24/7 retainer, keeping your system working. \"Fractional\" means we're an outside vendor working on your behalf, not a full-time hire on your payroll. We watch over every AI employee, update workflows as your business grows, and fix issues before they cost you money."
          ),
          React.createElement(
            Text,
            { style: [styles.panelBody, { marginTop: 8 }] },
            `After year one, the ${fmt$(BUILD_FEE_FOUNDER)} build fee is paid in full. From year two onward you're paying ${fmt$(MONTHLY_UTILITY)}/month for the utility pass-through + ${fmt$(MONTHLY_RETAINER_FOUNDER)}/month for the fractional CTO retainer — ${fmt$(MONTHLY_UTILITY + MONTHLY_RETAINER_FOUNDER)}/month total at founder pricing. Your retainer rate holds for 12 months at a time; we re-evaluate together at year-end.`
          ),
          React.createElement(
            Text,
            { style: [styles.panelBody, { marginTop: 6 }] },
            `Here's the math: the cheapest human role on your 12-seat org chart costs $40,000/year — exactly our list price for the entire build of TWELVE AI employees. On the monthly side, small businesses already pay $1,500–$3,000/month to a marketing agency just for Facebook ads. You're paying ${fmt$(MONTHLY_UTILITY + MONTHLY_RETAINER_FOUNDER)}/month at founder pricing for twelve AI employees + a fractional Chief Technology Officer managing your entire tech stack — same range, exponentially more output. Only ${FOUNDER_SPOTS_REMAINING} founder spots remain at ${fmt$(BUILD_FEE_FOUNDER)} build + ${fmt$(MONTHLY_RETAINER_FOUNDER)}/month — after that, list pricing moves to ${fmt$(BUILD_FEE_LIST)} build + ${fmt$(MONTHLY_RETAINER_LIST)}/month.`
          ),

          React.createElement(
            View,
            { style: styles.panelCallout },
            React.createElement(
              Text,
              { style: styles.panelCalloutText },
              `${fmt$(BUILD_FEE_FOUNDER)} to plug the gap. ${fmt$(TRADITIONAL_PAYROLL)} to plug it with humans. Same gap. Same 12 roles. The math isn't close.`
            )
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
          "Ready to plug your gap?"
        ),
        React.createElement(
          Text,
          { style: styles.ctaBody },
          "Bring this PDF to a working call. We'll go seat by seat — the order to fill them, the tools to use, the KPIs to track. Run with it yourself, or let me execute it for you."
        ),
        React.createElement(
          View,
          { style: styles.ctaContactRow },
          React.createElement(Text, { style: styles.ctaContactLabel }, "Book a call:"),
          React.createElement(
            Link,
            { src: CALENDAR_URL, style: styles.ctaLink },
            "Find Your Gap →"
          )
        ),
        React.createElement(
          View,
          { style: styles.ctaContactRow },
          React.createElement(Text, { style: styles.ctaContactLabel }, "Call direct:"),
          React.createElement(
            Link,
            { src: `tel:${PHONE_TEL}`, style: styles.ctaLink },
            PHONE_DISPLAY
          )
        ),
        React.createElement(
          View,
          { style: styles.ctaContactRow },
          React.createElement(Text, { style: styles.ctaContactLabel }, "Website:"),
          React.createElement(
            Link,
            { src: WEBSITE_URL, style: styles.ctaLink },
            "stevenjamesconsulting.com"
          )
        )
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

// Normalize a phone string to E.164 (the format GHL stores). Conservative — assumes US
// when 10 or 11 digits, otherwise just keeps the digits with a leading "+". Returns null
// if the input has no digits at all.
function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// Look up an existing GHL contact by phone. Returns the contactId if a single record
// claims that phone, otherwise null. Used to merge phone-only records (e.g. from FB lead
// forms) with assessment submissions that supply both email + phone — without this guard
// GHL's email-keyed upsert silently drops the phone when it conflicts with another contact.
async function findContactIdByPhone(
  phone: string,
  locationId: string,
  authHeader: string
): Promise<string | null> {
  try {
    const res = await fetch("https://services.leadconnectorhq.com/contacts/search", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        locationId,
        pageLimit: 5,
        filters: [{ field: "phone", operator: "eq", value: phone }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn("[send-roadmap] phone lookup failed:", res.status, body);
      return null;
    }
    const data = (await res.json()) as { contacts?: Array<{ id: string }> };
    return data.contacts?.[0]?.id ?? null;
  } catch (err) {
    console.warn("[send-roadmap] phone lookup error:", err);
    return null;
  }
}

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

  const authHeader = `Bearer ${pit}`;
  const ghlHeaders = {
    Authorization: authHeader,
    "Content-Type": "application/json",
  };

  // Custom fields are shared between the phone-match PUT path and the email-keyed
  // upsert path — define once, reuse below.
  const customFields = [
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
  ];

  // Phone-first lookup. If the submitted phone already belongs to a contact (e.g. they
  // first hit a Facebook lead form months ago), update that record so we don't fork the
  // identity into two contacts (one phone-only, one email-only).
  const normalizedPhone = normalizePhone(payload.phone);
  const phoneMatchId = normalizedPhone
    ? await findContactIdByPhone(normalizedPhone, locationId, authHeader)
    : null;

  let contactId: string | undefined;

  if (phoneMatchId) {
    // PUT path — merge new info into the existing phone-keyed contact. Phone is omitted
    // (already on this record) to avoid format-normalization surprises.
    console.log("[send-roadmap] phone matched existing contact, merging:", phoneMatchId);
    try {
      const patchRes = await fetch(`https://services.leadconnectorhq.com/contacts/${phoneMatchId}`, {
        method: "PUT",
        headers: { ...ghlHeaders, Version: "2021-07-28" },
        body: JSON.stringify({
          firstName: payload.firstName,
          lastName: payload.lastName,
          name: payload.name,
          email: payload.email,
          source: payload.source,
          tags: ["assessment-completed"],
          customFields,
        }),
      });
      if (!patchRes.ok) {
        const body = await patchRes.text();
        console.error("[send-roadmap] GHL phone-match PUT failed:", patchRes.status, body);
        return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
      }
      contactId = phoneMatchId;
    } catch (err) {
      console.error("[send-roadmap] GHL phone-match PUT error:", err);
      return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
    }
  } else {
    // Existing email-keyed upsert path.
    const upsertBody = {
      locationId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      source: payload.source,
      tags: ["assessment-completed"],
      customFields,
    };

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
  }

  if (!contactId) {
    console.error("[send-roadmap] no contact id from GHL");
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }

  // 3. Queue the roadmap email through GHL's Conversations API so it lands in
  //    the contact's conversation thread + uses the location's email sender.
  const firstName = payload.firstName || payload.name.split(" ")[0] || "there";
  const subject = `${firstName}, your 12-Role Roadmap`;
  const perEmployeeFee = Math.round(BUILD_FEE_FOUNDER / 12);
  const monthlyTotalFounder = MONTHLY_UTILITY + MONTHLY_RETAINER_FOUNDER;
  const monthlyTotalList = MONTHLY_UTILITY + MONTHLY_RETAINER_LIST;
  const seatVerb = payload.vacant_count === 1 ? "seat is" : "seats are";
  const filledCount = payload.worn_count + payload.staff_count;
  const pdfFooterBlock = pdfUrl
    ? `<p style="font-size:14px;color:#475569;margin:20px 0 24px 0;text-align:center;">Want to bring a printed copy to the call? <a href="${pdfUrl}" style="color:#1d4ed8;font-weight:bold;">Download the full PDF</a>.</p>`
    : `<p style="font-size:14px;color:#475569;margin:20px 0 24px 0;text-align:center;">Your full PDF is on its way — we'll follow up shortly.</p>`;

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;line-height:1.6;padding:8px;">

  <div style="border-bottom:2px solid #1d4ed8;padding-bottom:14px;margin-bottom:22px;">
    <div style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:1.4px;margin-bottom:6px;">Steven James Consulting · 12-Role Roadmap</div>
    <h1 style="font-size:24px;font-weight:bold;color:#0f172a;margin:0;line-height:1.2;">${firstName}, your roadmap is ready</h1>
  </div>

  <p style="font-size:16px;margin:0 0 16px 0;">Hi ${firstName},</p>

  <p style="font-size:16px;margin:0 0 16px 0;">
    Your assessment exposed your <strong>gap</strong> — the work happening (or not happening) in the 12 roles your business needs to actually run without you putting out fires all day. Here's what we found:
  </p>

  <ul style="font-size:16px;padding-left:22px;margin:0 0 22px 0;">
    <li style="margin-bottom:6px;">You're personally holding <strong>${payload.worn_count}</strong> of the 12 roles.</li>
    <li style="margin-bottom:6px;">A current staff member handles <strong>${payload.staff_count}</strong>.</li>
    <li style="margin-bottom:6px;"><strong>${payload.vacant_count}</strong> ${seatVerb} sitting empty — nobody is doing this work.</li>
    <li style="margin-bottom:6px;">Total work mapped: <strong>${payload.total_hours_per_week} hours per week</strong>.</li>
  </ul>

  <p style="font-size:16px;margin:0 0 22px 0;">
    Those empty seats — plus the work you're personally absorbing instead of running the business — are your blind spots. The hours not being seen, because you're inside doing them.
  </p>

  <h2 style="font-size:20px;color:#0f172a;margin:28px 0 14px 0;border-top:1px solid #e2e8f0;padding-top:22px;">Three ways to plug your gap</h2>

  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#475569;margin:18px 0 4px 0;">Tier 1</div>
  <div style="font-size:17px;font-weight:bold;color:#0f172a;margin:0 0 8px 0;">Hire 12 humans — <span style="color:#475569;font-weight:normal;">$532,000/year</span></div>
  <p style="font-size:15px;margin:0 0 16px 0;">
    Twelve full-time salaries averaging ~$44K, plus benefits and payroll overhead. That gets the seats filled, but $532K is just the starting point. Training is on top — 60–90 days per hire before they're productive, ~$5K–$15K each in onboarding costs. Across 12 hires that's another $60K–$180K in year one. Add ~20% annual turnover and the manager(s) you'll need to run them, and <strong>real year-one cost lands closer to $700K–$800K</strong>.
  </p>

  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#475569;margin:22px 0 4px 0;">Tier 2</div>
  <div style="font-size:17px;font-weight:bold;color:#0f172a;margin:0 0 8px 0;">Build it yourself — <span style="color:#475569;font-weight:normal;">$0 build fee</span></div>
  <p style="font-size:15px;margin:0 0 16px 0;">
    You become the technical lead. Learn to build AI agents that follow instructions reliably and don't hallucinate. Wire up a CRM so the AI employees can read customer info, update records, and communicate with each other and with you. Connect email, SMS, calendars, payments, and reporting. Train each AI employee on your services, pricing, processes, and brand voice. Maintain all of it as AI platforms change. The price says zero. The real price is <strong>hat #13 — another 80–100 hours per week</strong> you don't have, learning skills it took me years to develop.
  </p>

  <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#1d4ed8;font-weight:bold;margin:22px 0 4px 0;">Tier 3 · Recommended</div>
  <div style="font-size:17px;font-weight:bold;color:#0f172a;margin:0 0 10px 0;">I build the AI Operating System for you</div>
  <div style="margin:0 0 4px 0;">
    <span style="font-size:24px;font-weight:bold;color:#1d4ed8;">$${BUILD_FEE_FOUNDER.toLocaleString()}</span>
    <span style="font-size:16px;color:#94a3b8;text-decoration:line-through;margin-left:10px;">$${BUILD_FEE_LIST.toLocaleString()}</span>
    <span style="font-size:14px;color:#475569;margin-left:8px;">one-time build fee investment</span>
  </div>
  <div style="font-size:14px;color:#475569;margin:0 0 2px 0;">
    + <strong style="color:#1d4ed8;">$${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/month</strong>
    <span style="color:#94a3b8;text-decoration:line-through;margin-left:6px;">$${MONTHLY_RETAINER_LIST.toLocaleString()}</span>
    <span style="margin-left:6px;">fractional CTO retainer</span>
  </div>
  <div style="font-size:14px;color:#475569;margin:0 0 8px 0;">
    + <strong style="color:#0f172a;">$${MONTHLY_UTILITY.toLocaleString()}/month</strong> utility (pass-through to vendors at cost, no markup)
  </div>
  <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:bold;padding:5px 12px;border-radius:4px;margin:10px 0 6px 0;text-transform:uppercase;letter-spacing:0.8px;">
    Founder Pricing · ${FOUNDER_SPOTS_REMAINING} spots remaining
  </div>
  <p style="font-size:13px;color:#475569;font-style:italic;margin:0 0 14px 0;">
    Locked in for the next ${FOUNDER_SPOTS_REMAINING} founders. After spot #${FOUNDER_SPOTS_REMAINING}, list price moves to $${BUILD_FEE_LIST.toLocaleString()} build + $${MONTHLY_RETAINER_LIST.toLocaleString()}/mo retainer. Your build fee locks at signing; the $${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/mo retainer holds for your first 12 months — then we re-evaluate together based on where the technology has moved. Stay, take it over yourself, or move to another vendor — your call.
  </p>

  <div style="background:#eff6ff;border:1px solid #c7d7fe;padding:14px 18px;border-radius:6px;margin:0 0 18px 0;">
    <p style="font-size:15px;color:#0f172a;margin:0 0 8px 0;">
      <strong>Your assessment told me exactly what to build for you.</strong> You're personally wearing <strong>${payload.worn_count}</strong> hats. Your staff covers <strong>${payload.staff_count}</strong>. <strong>${payload.vacant_count}</strong> ${seatVerb} sitting empty. Here's how I plug it:
    </p>
    <ul style="font-size:15px;padding-left:22px;margin:0 0 8px 0;color:#0f172a;">
      <li style="margin-bottom:6px;"><strong>${payload.vacant_count} stand-alone AI ${payload.vacant_count === 1 ? "employee" : "employees"}</strong> to fully cover the ${payload.vacant_count === 1 ? "empty seat" : "empty seats"} nobody is running today. They own the job end-to-end.</li>
      <li style="margin-bottom:0;"><strong>${filledCount} AI executive ${filledCount === 1 ? "assistant" : "assistants"}</strong> paired with you and your staff. Each person keeps their seat — the AI does the heavy lifting around them, so the human can focus on the 20% only a human can do.</li>
    </ul>
    <p style="font-size:14px;color:#475569;margin:0;">
      Twelve AI employees total — the exact org chart your business needs to run without you putting out fires.
    </p>
  </div>

  <p style="font-size:15px;margin:0 0 8px 0;">
    <strong>The $${BUILD_FEE_FOUNDER.toLocaleString()} founder build fee</strong> works out to <strong>~$${perEmployeeFee.toLocaleString()} per AI employee</strong>, custom-built for your business. Each one is:
  </p>
  <ul style="font-size:15px;padding-left:22px;margin:0 0 14px 0;">
    <li style="margin-bottom:6px;"><strong>Trained on your brand voice.</strong> I capture how you talk to customers — the words you use, the words you'd never use, your tone, your sales style — and bake it in. When the AI messages a prospect, it sounds like you wrote it, not like a generic chatbot.</li>
    <li style="margin-bottom:6px;"><strong>Trained on your business.</strong> Services, pricing, processes, team. On day one, it knows what a seasoned human employee would know.</li>
    <li style="margin-bottom:6px;"><strong>Wired into your tech stack.</strong> CRM, email, calendar, reporting — it actually does the work (books appointments, follows up on leads, sends invoices, surfaces KPIs), not just answers questions.</li>
  </ul>

  <p style="font-size:15px;margin:0 0 8px 0;">
    <strong>Your monthly costs are two separate line items.</strong> $${MONTHLY_UTILITY.toLocaleString()}/month utility (pass-through) + $${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/month CTO retainer (founder pricing). <strong>$${monthlyTotalFounder.toLocaleString()}/month total.</strong> Here's what each one is:
  </p>

  <p style="font-size:15px;font-weight:bold;color:#0f172a;margin:14px 0 4px 0;">
    Utility &mdash; $${MONTHLY_UTILITY.toLocaleString()}/month, pass-through at cost
  </p>
  <ul style="font-size:15px;padding-left:22px;margin:0 0 6px 0;">
    <li style="margin-bottom:6px;"><strong>Tokens</strong> — the AI's thinking power. Every time an AI employee responds or processes a request, that's tokens. Like electricity for a machine, except the electricity is brainpower.</li>
    <li style="margin-bottom:6px;"><strong>Hosting</strong> — the cloud servers your AI employees live on. Same as hosting a website — they need a place to run from.</li>
  </ul>
  <p style="font-size:13px;color:#475569;font-style:italic;margin:0 0 14px 22px;">
    We pass these straight through to the vendors at cost. No markup. Full transparency on what runs your AI workforce.
  </p>

  <p style="font-size:15px;font-weight:bold;color:#0f172a;margin:14px 0 4px 0;">
    Fractional CTO retainer &mdash; $${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/month founder pricing ($${MONTHLY_RETAINER_LIST.toLocaleString()}/month list)
  </p>
  <ul style="font-size:15px;padding-left:22px;margin:0 0 14px 0;">
    <li style="margin-bottom:6px;"><strong>Your new fractional Chief Technology Officer (CTO).</strong> That's Steven James Consulting on 24/7 retainer, keeping your system working. &ldquo;Fractional&rdquo; means we're an outside vendor working on your behalf, not a full-time hire on your payroll. We watch over every AI employee, update workflows as your business grows, and fix issues before they cost you money.</li>
  </ul>

  <p style="font-size:15px;margin:0 0 16px 0;">
    After year one, the <strong>$${BUILD_FEE_FOUNDER.toLocaleString()} build fee is paid in full</strong>. From year two onward, you're paying <strong>$${MONTHLY_UTILITY.toLocaleString()}/month for the utility pass-through</strong> (tokens + hosting, straight to vendors at cost) + <strong>$${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/month for the fractional CTO retainer</strong> &mdash; <strong>$${monthlyTotalFounder.toLocaleString()}/month total at founder pricing</strong>. Your retainer rate holds for 12 months at a time; we re-evaluate together at year-end.
  </p>

  <p style="font-size:15px;margin:0 0 16px 0;">
    Here's the math: the cheapest human role on your 12-seat org chart costs <strong>$40,000/year</strong> — exactly our list price for the entire build of TWELVE AI employees. On the monthly side, small businesses already pay <strong>$1,500&ndash;$3,000/month to a marketing agency just for Facebook ads</strong>. You're paying <strong>$${monthlyTotalFounder.toLocaleString()}/month at founder pricing</strong> for twelve AI employees + a fractional Chief Technology Officer managing your entire tech stack &mdash; same range, exponentially more output. Only <strong>${FOUNDER_SPOTS_REMAINING} founder spots remain at $${BUILD_FEE_FOUNDER.toLocaleString()} build + $${MONTHLY_RETAINER_FOUNDER.toLocaleString()}/month</strong> — after that, list pricing moves to $${BUILD_FEE_LIST.toLocaleString()} build + $${MONTHLY_RETAINER_LIST.toLocaleString()}/month.
  </p>

  <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:16px 18px;margin:24px 0;">
    <p style="font-size:17px;font-weight:bold;color:#0f172a;margin:0;line-height:1.45;">
      $${BUILD_FEE_FOUNDER.toLocaleString()} to plug the gap. $532,000 to plug it with humans. Same gap. Same 12 roles. The math isn't close.
    </p>
  </div>

  <div style="background:#1d4ed8;border-radius:8px;padding:24px;margin:28px 0;color:#ffffff;">
    <h2 style="font-size:19px;font-weight:bold;color:#ffffff;margin:0 0 8px 0;">Ready to plug your gap?</h2>
    <p style="font-size:15px;color:#dbeafe;margin:0 0 18px 0;line-height:1.5;">
      Bring this PDF to a working call. We'll go seat by seat — the order to fill them, the tools to use, the KPIs to track. Run with it yourself, or let me execute it with you.
    </p>
    <p style="margin:0;">
      <a href="${CALENDAR_URL}" style="display:inline-block;background:#ffffff;color:#1d4ed8;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">Book a call →</a>
    </p>
    <p style="font-size:14px;color:#dbeafe;margin:16px 0 0 0;">
      Or call me direct: <a href="tel:${PHONE_TEL}" style="color:#ffffff;font-weight:bold;text-decoration:underline;">${PHONE_DISPLAY}</a>
    </p>
  </div>

  ${pdfFooterBlock}

  <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:32px;font-size:14px;color:#475569;line-height:1.7;">
    <p style="margin:0 0 2px 0;"><strong style="color:#0f172a;font-size:15px;">Steven Barchetti</strong></p>
    <p style="margin:0 0 10px 0;">Steven James Consulting</p>
    <p style="margin:0;">
      Call direct: <a href="tel:${PHONE_TEL}" style="color:#1d4ed8;text-decoration:none;">${PHONE_DISPLAY}</a><br>
      Book a call: <a href="${CALENDAR_URL}" style="color:#1d4ed8;text-decoration:none;">click here</a><br>
      Website: <a href="${WEBSITE_URL}" style="color:#1d4ed8;text-decoration:none;">stevenjamesconsulting.com</a>
    </p>
  </div>

</div>
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
