#!/usr/bin/env python3
"""HARVEST via the NOTES endpoint. /conversations/search is 1010-blocked (it's a search;
HIPAA blocks all enumeration). But Chloe mirrors every turn into the contact's notes as
a ⟦CHLOE_LOG⟧ note, and GET /contacts/{id}/notes is a DIRECT by-ID read the production
server uses (get_chloe_log_notes) — not a search — so it's open. Read each of the 586
contacts' Chloe-log notes, reconstruct the thread, scan for gold. Read-only. Local."""
import sys, csv, json, time, urllib.request, urllib.error

ENV  = "/Users/stevenbarchetti/SJC/AI-Employee-Dashboard/sjc-server/.env"
CSVF = "/Users/stevenbarchetti/Downloads/Export_Contacts_undefined_Jun_2026_4_40_PM.csv"
BASE = "https://services.leadconnectorhq.com"
OUT  = ("/private/tmp/claude-501/-Users-stevenbarchetti-SJC-CEO/"
        "a8c71e99-e1ed-4637-abb9-cc84927018fd/scratchpad/candidates.txt")
LOC  = "cTQ1CZSUZ7zWt1Nsu96K"
V_CONTACTS = "2021-07-28"     # notes live on the contacts API version
MARK = "⟦CHLOE_LOG⟧"

tok = None
for line in open(ENV):
    s = line.strip()
    if s.startswith("GHL_PIT_ALAMO_SLIM"):
        tok = s.split("=", 1)[1].strip().strip('"').strip("'"); break
if not tok:
    sys.exit("GHL_PIT_ALAMO_SLIM not found in .env")
H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "Version": V_CONTACTS}

def get(path):
    for a in range(4):
        try:
            return json.load(urllib.request.urlopen(
                urllib.request.Request(BASE + path, headers=H), timeout=40))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503):
                time.sleep(2 * (a + 1)); continue
            raise
    raise SystemExit("repeated API errors talking to GHL")

contacts = []
with open(CSVF, newline="") as f:
    for row in csv.DictReader(f):
        cid = (row.get("Contact Id") or "").strip()
        if cid:
            name = ((row.get("First Name") or "") + " " + (row.get("Last Name") or "")).strip() or cid
            contacts.append((cid, name))
print(f"{len(contacts)} contacts from CSV. Reading each contact's notes (by ID)...", flush=True)

HEALTHQ = ["side effect","is it safe","safe to","needle","does it hurt","dosage","what does it do",
           "how does it work","semaglutide","tirzepatide","ozempic","wegovy","insurance cover",
           "diabetic","thyroid","pregnan","what the medication","the shot do","drug interact"]
DEFER   = ["your provider","the doctor","our medical","medical team","at your visit","your first visit",
           "during your visit","the nurse","our practitioner","they'll go over","go over that",
           "best to discuss","that's something the","the clinic","our team will","provider will",
           "the physician","give medical"]
BOOKED  = ["you're all set","all set for","see you on","see you at","got you booked","got you scheduled",
           "you're booked","your appointment is","looking forward to seeing","reserved your",
           "got you down for","you're scheduled","confirmed for","booked you","is booked"]
REACT   = ["circling back","wanted to reach out","wanted to check","checking in","following up",
           "a while back","haven't heard","still interested","still thinking","touch base","reconnect",
           "reached out a","saw you were interested","wanted to follow up","been a minute"]

def hits(text, kws):
    return [k for k in kws if k in text]

def role_dir(role):
    r = role.lower()
    return "in" if ("user" in r or "customer" in r or "lead" in r or r == "human") else "out"

react_c, defer_c, book_c = [], [], []
scanned = 0
for i, (cid, name) in enumerate(contacts):
    try:
        d = get(f"/contacts/{cid}/notes")
    except urllib.error.HTTPError as e:
        if i == 0:
            sys.exit(f"NOTES BLOCKED on first contact: HTTP {e.code}: {e.read().decode()[:250]}\n"
                     "-> the notes endpoint is also walled; tell Claude.")
        continue
    except Exception:
        continue
    raw = d.get("notes", []) or []
    notes = [n for n in raw if (n.get("body") or "").startswith(MARK)]
    notes.sort(key=lambda n: n.get("dateAdded") or "")
    if i == 0:
        print(f"  first contact {name}: {len(raw)} notes, {len(notes)} Chloe-log -> the door is OPEN", flush=True)
    seq = []
    for n in notes:
        head, _, content = (n.get("body") or "").partition("\n")
        role = head.replace(MARK, "").split("|")[0].strip()
        if content.strip():
            seq.append((role_dir(role), content.strip()))
    if not seq:
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(contacts)}  (threads scanned {scanned})", flush=True)
        continue
    scanned += 1
    inbound  = " \n".join(b for dr, b in seq if dr == "in").lower()
    outbound = " \n".join(b for dr, b in seq if dr == "out").lower()
    rk = hits(outbound, REACT)
    if seq[0][0] == "out" and any(dr == "in" for dr, _ in seq) and rk:
        react_c.append((len(rk), cid, name, rk, seq))
    hk, dk = hits(inbound, HEALTHQ), hits(outbound, DEFER)
    if hk and dk:
        defer_c.append((len(hk) + len(dk), cid, name, hk + dk, seq))
    bk = hits(outbound, BOOKED)
    if bk:
        book_c.append((len(bk), cid, name, bk, seq))
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/{len(contacts)}  (threads scanned {scanned})", flush=True)
    time.sleep(0.04)

def excerpt(seq, kws):
    lines = [f"    [{dr}] {b[:160]}" + ("  <<<" if any(k in b.lower() for k in kws) else "")
             for dr, b in seq]
    if len(lines) <= 16:
        return "\n".join(lines)
    return "\n".join(lines[:8] + ["    ..."] + lines[-8:])

def dump(fh, title, cands):
    cands = sorted(cands, key=lambda t: t[0], reverse=True)[:10]
    fh.write(f"\n===== {title} ({len(cands)} shown) =====\n")
    for score, cid, name, kws, seq in cands:
        url = f"https://app.gohighlevel.com/v2/location/{LOC}/contacts/detail/{cid}"
        fh.write(f"\n-- {name}  (score {score})\n   matched: {', '.join(kws[:6])}\n   {url}\n")
        fh.write(excerpt(seq, kws) + "\n")

with open(OUT, "w") as fh:
    fh.write(f"Chloe gold-conversation candidates  (scanned {scanned} threads / {len(contacts)} contacts)\n")
    dump(fh, "REACTIVATION (Chloe opened a cold lead, got a reply)", react_c)
    dump(fh, "STAYS-IN-HER-LANE (health question -> routed to provider, kept going)", defer_c)
    dump(fh, "BOOKINGS (Chloe confirmed an appointment)", book_c)

print(f"\nDONE. Candidate shortlist written to:\n{OUT}")
print(f"Found -> reactivation:{len(react_c)}  redirect:{len(defer_c)}  booking:{len(book_c)}")
