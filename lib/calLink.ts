// A Cal.com booking URL → the "user/event" link Cal's embed API wants. Null for anything else.
//
// ⛔ THIS LIVES IN lib/, NOT IN CalEmbed.tsx, AND THAT IS THE WHOLE POINT.
// It started life exported from CalEmbed.tsx, which carries "use client". Next then treats every
// export of that file as a CLIENT REFERENCE: a component can still be rendered from the server, but
// a plain function CANNOT BE CALLED there — "Attempted to call calLinkFrom() from the server."
// config.tsx renders on the server, so the whole site 500'd. **It type-checked and it built; only a
// request revealed it.** A helper shared across the boundary belongs in a module with no directive.
export function calLinkFrom(raw: string): string | null {
  try {
    const u = new URL(String(raw || "").trim());
    if (!/(^|\.)cal\.com$/i.test(u.hostname)) return null;
    const path = u.pathname.replace(/^\/+|\/+$/g, "");
    return path || null;
  } catch {
    return null;
  }
}
