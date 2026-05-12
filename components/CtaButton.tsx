const AUDIT_URL = "https://ai-audit-tool-pearl.vercel.app";

export default function CtaButton({ className = "" }: { className?: string }) {
  return (
    <a href={AUDIT_URL} className={`btn-cta ${className}`}>
      <span>Find out where you stand.</span>
      <span className="sub">60-Second AI Audit</span>
    </a>
  );
}
