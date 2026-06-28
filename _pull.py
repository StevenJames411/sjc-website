#!/usr/bin/env python3
"""Proof call: confirm GHL lets us list the whole Alamo location's conversations
and returns message bodies under HIPAA mode. Read-only. Nothing saved to disk.
Throwaway — delete after the pull."""
import sys, json, urllib.request, urllib.error

ENV = "/Users/stevenbarchetti/SJC/AI-Employee-Dashboard/sjc-server/.env"
LOC = "cTQ1CZSUZ7zWt1Nsu96K"
BASE = "https://services.leadconnectorhq.com"

tok = None
try:
    for line in open(ENV):
        s = line.strip()
        if s.startswith("GHL_PIT_ALAMO_SLIM"):
            tok = s.split("=", 1)[1].strip().strip('"').strip("'")
            break
except FileNotFoundError:
    sys.exit(f"Could not find .env at {ENV}")
if not tok:
    sys.exit("GHL_PIT_ALAMO_SLIM not found in .env")

H = {"Authorization": f"Bearer {tok}", "Version": "2021-04-15"}

def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=30))

print("== Step 1: list 2 conversations for the whole location ==")
try:
    d = get(f"{BASE}/conversations/search?locationId={LOC}&limit=2")
except urllib.error.HTTPError as e:
    body = e.read().decode()[:300]
    sys.exit(f"LISTING FAILED ({e.code}): {body}\n-> location-wide listing may be restricted; report back to Claude.")

convos = d.get("conversations", [])
print(f"total conversations reported by GHL: {d.get('total')}")
print(f"returned in this call: {len(convos)}")
for c in convos:
    print(f"  id={c.get('id')}  lastBody={((c.get('lastMessageBody') or '')[:60])!r}")
if not convos:
    sys.exit("No conversations returned — location-wide listing may be blocked. Report back to Claude.")

print("\n== Step 2: pull messages for the first thread ==")
cid = convos[0]["id"]
m = get(f"{BASE}/conversations/{cid}/messages?limit=5")
msgs = m.get("messages", {}).get("messages", [])
print(f"messages returned: {len(msgs)}")
for x in msgs:
    print(f"  [{x.get('direction')}] {((x.get('body') or '')[:80])!r}")

print("\nIf you see message bodies above, the bulk pull is GREEN.")
