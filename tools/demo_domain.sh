#!/usr/bin/env bash
# demo_domain.sh — give a site its public demo address.
#
# ⛔ WHY THIS EXISTS (2026-08-24). A new site's demo URL fails with ERR_CONNECTION_CLOSED
# until its subdomain is registered on the Vercel project, because there is NO WILDCARD
# CERTIFICATE for *.stevenjamesconsulting.com — only per-name certs.
#
# Why there is no wildcard cert, and why that is not a bug to go fix:
#   A wildcard cert can only be issued by DNS-01 validation, which requires Vercel to control
#   the domain's DNS. stevenjamesconsulting.com is on GoDaddy's nameservers and ⛔ MUST STAY
#   THERE — its MX records are Google Workspace, so moving nameservers moves the mail.
#   (lib/hostShared.ts says the same thing. `*.stevenjamesconsulting.com` IS attached to the
#   project; it simply cannot get a cert, and every per-name cert works because those use
#   HTTP-01, which needs no DNS control.)
#
# So each demo address gets registered once. This makes that one command, not a hunt.
#
#   ./tools/demo_domain.sh <site-id>
#   ./tools/demo_domain.sh steven-james-consulting
#
# Needs the Vercel CLI logged in as the account owner (`vercel whoami`).
set -euo pipefail

SITE="${1:-}"
[ -z "$SITE" ] && { echo "usage: $0 <site-id>"; exit 2; }

HOST="${SITE}-demo.stevenjamesconsulting.com"
SCOPE="stevenjames411s-projects"
PROJECT="sjc-website"
VERCEL="${VERCEL_BIN:-vercel}"

command -v "$VERCEL" >/dev/null 2>&1 || {
  echo "⛔ vercel CLI not found. npm i -g vercel, or set VERCEL_BIN=/path/to/vercel"; exit 1; }

echo "→ registering $HOST on $PROJECT"
"$VERCEL" domains add "$HOST" "$PROJECT" --scope "$SCOPE" >/dev/null 2>&1 || true

# The cert is issued asynchronously; until it exists the handshake is REFUSED, not slow —
# curl reports 000. Poll rather than declare success on the add command's exit code.
echo -n "→ waiting for the certificate "
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$HOST/" || true)
  if [ "$code" != "000" ]; then
    echo
    echo "✅ https://$HOST  →  HTTP $code"
    [ "$code" = "404" ] && echo "   (404 = cert fine, site still in draft — set it to demo in the studio)"
    exit 0
  fi
  echo -n "."
  sleep 10
done
echo
echo "⚠️  still no certificate after ~3 minutes. Check: $VERCEL domains inspect $HOST --scope $SCOPE"
exit 1
