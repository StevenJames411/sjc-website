"use client";
import { useState } from "react";

// The client's own screen. Two panels: their details, and their enquiries.
//
// ⚠️ WRITTEN FOR A PHONE IN A TRUCK. The person reading this is a contractor between jobs, not
// somebody at a desk — so: one column, large tap targets, no dense tables, and the save state said
// in words rather than a colour change nobody notices in sunlight.

type Biz = {
  name: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  hours: string;
  reviewUrl: string;
};
type Lead = { at: string; answers: { label: string; value: string }[] };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "22px 22px 24px",
  marginBottom: 20,
};
const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};
const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  padding: "11px 12px",
  fontSize: 16, // ⚠️ 16px or iOS zooms the whole page on focus. Not a style choice.
  marginBottom: 16,
  color: "#111827",
  background: "#fff",
};

function when(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClientSite(props: {
  siteId: string;
  name: string;
  domain: string;
  business: Biz;
  leads: Lead[];
}) {
  const [b, setB] = useState<Biz>(props.business);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const set = (k: keyof Biz, v: string) => {
    setB({ ...b, [k]: v });
    setState("idle");
  };

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // ⛔ ONLY `business` IS SENT, AND ONLY `business` WOULD BE ACCEPTED. The route filters to
        // CLIENT_EDITABLE server-side; this matching it is a convenience, never the control.
        body: JSON.stringify({ id: props.siteId, business: b }),
      });
      const j = await res.json();
      setState(j?.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "36px 18px 80px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111827",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{props.name}</h1>
      {props.domain ? (
        <p style={{ marginBottom: 26 }}>
          <a href={`https://${props.domain}`} style={{ color: "#2563eb", fontSize: 15 }}>
            {props.domain} ↗
          </a>
        </p>
      ) : (
        <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 26 }}>Your website is being set up.</p>
      )}

      {/* ── THEIR DETAILS ─────────────────────────────────────────────────────────────────── */}
      <section style={card}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Your details</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
          Change these and they update everywhere on your website — every page, every call button.
        </p>

        <label style={label}>Business name</label>
        <input style={input} value={b.name} onChange={(e) => set("name", e.target.value)} />

        <label style={label}>Phone number, as you want it shown</label>
        <input
          style={input}
          value={b.phoneDisplay}
          onChange={(e) => set("phoneDisplay", e.target.value)}
          placeholder="(210) 555-0100"
        />

        {/* Two phone fields is a real thing, not a mistake — one is read by a person, one is dialled
            by a phone. Saying which is which stops the second being "the same number again". */}
        <label style={label}>Phone number for the call button</label>
        <input
          style={input}
          value={b.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="+12105550100"
        />

        <label style={label}>Email</label>
        <input style={input} value={b.email} onChange={(e) => set("email", e.target.value)} />

        <label style={label}>Address</label>
        <input style={input} value={b.address} onChange={(e) => set("address", e.target.value)} />

        <label style={label}>Hours</label>
        <input
          style={input}
          value={b.hours}
          onChange={(e) => set("hours", e.target.value)}
          placeholder="Mon–Fri 8–5"
        />

        <label style={label}>Your Google review link</label>
        <input
          style={input}
          value={b.reviewUrl}
          onChange={(e) => set("reviewUrl", e.target.value)}
          placeholder="https://g.page/r/…/review"
        />

        <button
          onClick={save}
          disabled={state === "saving"}
          style={{
            width: "100%",
            background: "#111827",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "14px",
            fontSize: 16,
            fontWeight: 600,
            cursor: state === "saving" ? "default" : "pointer",
            opacity: state === "saving" ? 0.65 : 1,
          }}
        >
          {state === "saving" ? "Saving…" : "Save changes"}
        </button>

        {state === "saved" ? (
          <p style={{ marginTop: 12, color: "#047857", fontSize: 14 }}>
            Saved. Your website is updated.
          </p>
        ) : null}
        {state === "error" ? (
          <p style={{ marginTop: 12, color: "#b91c1c", fontSize: 14 }}>
            That didn&apos;t save. Try once more — if it still won&apos;t, reply to any email from us.
          </p>
        ) : null}
      </section>

      {/* ── THEIR ENQUIRIES ───────────────────────────────────────────────────────────────── */}
      <section style={card}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          Enquiries{props.leads.length ? ` (${props.leads.length})` : ""}
        </h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Everyone who has filled in a form on your website. Newest first.
        </p>

        {props.leads.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: 15 }}>
            Nothing yet. New enquiries land here and in your inbox at the same time.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {props.leads.map((l, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{when(l.at)}</div>
                {l.answers.map((a, j) => (
                  <div key={j} style={{ fontSize: 15, marginBottom: 4, lineHeight: 1.45 }}>
                    <span style={{ color: "#6b7280" }}>{a.label}: </span>
                    {/* A phone number a thumb can dial, and an address a thumb can reply to. The
                        point of the enquiry is the call back; making him copy it out is friction
                        in exactly the wrong place. */}
                    {/^[\d\s()+.-]{7,}$/.test(a.value) ? (
                      <a href={`tel:${a.value.replace(/[^\d+]/g, "")}`} style={{ color: "#2563eb" }}>
                        {a.value}
                      </a>
                    ) : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.value) ? (
                      <a href={`mailto:${a.value}`} style={{ color: "#2563eb" }}>
                        {a.value}
                      </a>
                    ) : (
                      a.value
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
        Steven James Consulting · <a href="/api/logout" style={{ color: "#9ca3af" }}>Sign out</a>
      </p>
    </main>
  );
}
