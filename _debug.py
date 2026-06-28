#!/usr/bin/env python3
"""Diagnose why the by-contactId conversation pull found 0. Reads the first 3 contacts
from the CSV and does the conversation search with NO error-swallowing — prints the
real outcome (status / count / error) straight to the terminal. Short output."""
import csv, json, urllib.request, urllib.error

ENV  = "/Users/stevenbarchetti/SJC/AI-Employee-Dashboard/sjc-server/.env"
CSVF = "/Users/stevenbarchetti/Downloads/Export_Contacts_undefined_Jun_2026_4_40_PM.csv"
BASE = "https://services.leadconnectorhq.com"
LOC  = "cTQ1CZSUZ7zWt1Nsu96K"

tok = None
for line in open(ENV):
    s = line.strip()
    if s.startswith("GHL_PIT_ALAMO_SLIM"):
        tok = s.split("=", 1)[1].strip().strip('"').strip("'"); break
print("token loaded:", bool(tok), "len", len(tok or ""))
H = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json", "Version": "2021-04-15"}

ids = []
with open(CSVF, newline="") as f:
    for row in csv.DictReader(f):
        cid = (row.get("Contact Id") or "").strip()
        if cid:
            ids.append((cid, ((row.get("First Name") or "") + " " + (row.get("Last Name") or "")).strip()))
        if len(ids) >= 3:
            break

def show(label, url):
    print(f"  {label}: GET {url[:70]}")
    try:
        with urllib.request.urlopen(urllib.request.Request(BASE + url, headers=H), timeout=30) as r:
            data = json.load(r)
        convos = data.get("conversations", [])
        print(f"    STATUS 200 | conversations: {len(convos)} | top-keys: {list(data.keys())}")
        if convos:
            c = convos[0]
            print(f"    first conv id: {c.get('id')} | lastBody: {((c.get('lastMessageBody') or '')[:50])!r}")
    except urllib.error.HTTPError as e:
        print(f"    HTTP {e.code}: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"    ERR: {e!r}")

for cid, name in ids:
    print("=" * 40, name, cid)
    show("contactId only", f"/conversations/search?contactId={cid}")
    show("locationId+contactId", f"/conversations/search?locationId={LOC}&contactId={cid}")
