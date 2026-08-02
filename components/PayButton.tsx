"use client";
// The Stripe buy button, mounted from two stored ids.
//
// ── WHY THIS ISN'T THE PASTED SNIPPET ─────────────────────────────────────────────────────────
// Stripe hands you a block of HTML and the obvious thing to do is keep it and drop it on the page
// with dangerouslySetInnerHTML. This doesn't, and it's worth being clear why: that snippet is
// typed into an admin box, and rendering an admin box straight onto a page a customer opens is the
// shape of every stored-XSS bug there is. Only two ids are ever stored (see parseBuyButton in
// lib/invoicesShared) and the element below is written here, in code. Nothing pasted becomes markup.
//
// `<stripe-buy-button>` is a custom element, not a React component. React 19 passes unknown
// attributes through to the DOM as-is, which is exactly what a custom element needs — on React 18
// this same code would have silently dropped the props and rendered an empty tag.
import Script from "next/script";

// The element is defined by Stripe's script at runtime, so TypeScript has to be told it exists.
// Declared on the "react" module, not `declare global`: React 19 moved JSX off the global
// namespace, so the global form compiles to nothing and the tag stays unknown.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "stripe-buy-button": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "buy-button-id": string;
        "publishable-key": string;
      };
    }
  }
}

export default function PayButton({
  buttonId,
  publishableKey,
}: {
  buttonId: string;
  publishableKey: string;
}) {
  if (!buttonId || !publishableKey) return null;

  return (
    <>
      {/* afterInteractive, not lazyOnload: this is the one thing the page exists to do, and a
          payment button that appears a second late reads as a page that didn't finish loading. */}
      <Script src="https://js.stripe.com/v3/buy-button.js" strategy="afterInteractive" />
      <stripe-buy-button buy-button-id={buttonId} publishable-key={publishableKey} />
    </>
  );
}
