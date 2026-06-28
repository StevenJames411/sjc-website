#!/usr/bin/env python3
"""Pull all Alamo (Chloe) conversations from GHL, scan for the 3 'gold' patterns,
write a candidate shortlist for cherry-picking. Read-only against GHL. Local only.
Throwaway — delete after we've got the snapshots."""
import sys, json, time, urllib.request, urllib.error

ENV  = "/Users/stevenbarchetti/SJC/AI-Employee-Dashboard/sjc-server/.env"
LOC  = "cTQ1CZSUZ7zWt1Nsu96K"
BASE = "https://services.leadconnectorhq.com"
OUT  = ("/private/tmp/claude-501/-Users-stevenbarchetti-SJC-CEO/"
        "a8c71e99-e1ed-4637-abb9-cc84927018fd/scratchpad/candidates.txt")
MAX_CONVOS = 800

tok = None
for line in open(ENV):
    s = line.strip()
    if s.startswith("GHL_PIT_ALAMO_SLIM"):
        tok = s.split("=", 1)[1].strip().strip('"').strip("'"); break
if not tok:
    sys.exit("GHL_PIT_ALAMO_SLIM not found in .env")
H = {"Authorization": f"Bearer {tok}", "Version": "2021-04-15"}

def get(path):
    for attempt in range(4):
        try:
            return json.load(urllib.request.urlopen(
                urllib.request.Request(BASE + path, headers=H), timeout=40))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503):
                time.sleep(2 * (attempt + 1)); continue
            raise
    raise SystemExit("repeated API errors talking to GHL")

# ---- 1) list every conversation for the location ----
print("Listing conversations...", flush=True)
convos, seen, cursor = [], set(), None
while len(convos) < MAX_CONVOS:
    q = f"/conversations/search?locationId={LOC}&limit=100"
    if cursor:
        q += f"&startAfterId={cursor}"
    try:
        d = get(q)
    except urllib.error.HTTPError as e:
        sys.exit(f"LISTING FAILED ({e.code}): {e.read().decode()[:300]}\n"
                 "-> location-wide listing may be blocked; tell Claude.")
    batch = d.get("conversations", []) or []
    new = [c for c in batch if c.get("id") not in seen]
    if not new:
        break
    for c in new:
        seen.add(c.get("id"))
    convos.extend(new)
    print(f"  ...{len(convos)} (GHL reports total {d.get('total')})", flush=True)
    if len(batch) < 100:
        break
    cursor = batch[-1].get("id")
    time.sleep(0.1)

if not convos:
    sys.exit("No conversations returned — location-wide listing may be blocked. Tell Claude.")
print(f"Got {len(convos)} conversations. Scanning threads...\n", flush=True)

HEALTHQ = ["side effect","is it safe","safe to","needle","does it hurt","dosage","what does it do",
           "how does it work","semaglutide","tirzepatide","ozempic","wegovy","insurance cover",
           "diabetic","thyroid","pregnan","what the medication","the shot do","drug interact"]
DEFER   = ["your provider","the doctor","our medical","medical team","at your visit","your first visit",
           "during your visit","the nurse","our practitioner","they'll go over","go over that",
           "best to discuss","that's something the","the clinic","our team will","provider will",
           "the physician","not able to give medical"]
BOOKED  = ["you're all set","all set for","see you on","see you at","got you booked","got you scheduled",
           "you're booked","your appointment is","looking forward to seeing","reserved your",
           "got you down for","you're scheduled","confirmed for","booked you"]
REACT   = ["circling back","wanted to reach out","wanted to check","checking in","following up",
           "a while back","haven't heard","still interested","still thinking","touch base","reconnect",
           "reached out a","saw you were interested","wanted to follow up","been a minute"]

def hits(text, kws):
    return [k for k in kws if k in text]

react_c, defer_c, book_c = [], [], []
for i, c in enumerate(convos):
    cid  = c.get("id")
    name = c.get("fullName") or c.get("contactName") or c.get("contactId") or "?"
    try:
        m = get(f"/conversations/{cid}/messages?limit=100")
    except Exception:
        continue
    msgs = (m.get("messages", {}) or {}).get("messages", []) or []
    msgs = sorted(msgs, key=lambda x: x.get("dateAdded") or "")
    seq = [((x.get("direction") or "").lower(), (x.get("body") or "")) for x in msgs if x.get("body")]
    if not seq:
        continue
    inbound  = " \n".join(b for d, b in seq if d.startswith("in")).lower()
    outbound = " \n".join(b for d, b in seq if d.startswith("out")).lower()

    rk = hits(outbound, REACT)
    if seq[0][0].startswith("out") and any(d.startswith("in") for d, _ in seq) and rk:
        react_c.append((len(rk), cid, name, rk, seq))
    hk, dk = hits(inbound, HEALTHQ), hits(outbound, DEFER)
    if hk and dk:
        defer_c.append((len(hk) + len(dk), cid, name, hk + dk, seq))
    bk = hits(outbound, BOOKED)
    if bk:
        book_c.append((len(bk), cid, name, bk, seq))
    if (i + 1) % 50 == 0:
        print(f"  scanned {i+1}/{len(convos)}", flush=True)
    time.sleep(0.05)

def excerpt(seq, kws):
    lines = [f"    [{d[:3]}] {b[:160]}" + ("  <<<" if any(k in b.lower() for k in kws) else "")
             for d, b in seq]
    if len(lines) <= 12:
        return "\n".join(lines)
    return "\n".join(lines[:6] + ["    ..."] + lines[-6:])

def dump(fh, title, cands):
    cands = sorted(cands, key=lambda t: t[0], reverse=True)[:6]
    fh.write(f"\n===== {title} ({len(cands)} shown) =====\n")
    for score, cid, name, kws, seq in cands:
        url = f"https://app.gohighlevel.com/v2/location/{LOC}/conversations/conversations/{cid}"
        fh.write(f"\n-- {name}  (score {score})\n   matched: {', '.join(kws[:6])}\n   {url}\n")
        fh.write(excerpt(seq, kws) + "\n")

with open(OUT, "w") as fh:
    fh.write(f"Chloe gold-conversation candidates  (scanned {len(convos)} threads)\n")
    dump(fh, "REACTIVATION (Chloe opened a cold lead, got a reply)", react_c)
    dump(fh, "STAYS-IN-HER-LANE (health question -> routed to provider, kept going)", defer_c)
    dump(fh, "BOOKINGS (Chloe confirmed an appointment)", book_c)

print(f"\nDONE. Candidate shortlist written to:\n{OUT}")
print(f"Found -> reactivation:{len(react_c)}  redirect:{len(defer_c)}  booking:{len(book_c)}")
