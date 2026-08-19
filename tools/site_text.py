#!/usr/bin/env python3
"""
site_text.py — edit live website copy from the terminal, against the SAME source the
design studio writes to.

⛔ WHY THIS EXISTS. Steven edits in the canvas; that is his world and it is the right tool for
moving a block or nudging a size. Claude edits in code; that is its world, and crawling a canvas
to change one sentence is twenty clicks of nothing. Before this script the two had no shared door,
so the only code-shaped copy of the site was `~/SJC/web-builds/sjc-2026/build.py` — which had
stopped being live back in August and quietly fooled a session into "editing" a fossil.
This closes that: ONE source (the studio's store), TWO doors into it. Nothing to keep in sync,
because there is no second copy.

⛔ IT WRITES DRAFTS. NEVER PUBLISHES. `push`/`set`/`replace` land exactly where the canvas's Save
lands — the working draft. The public site keeps serving the published snapshot until someone
runs `publish`, which is its own command on purpose. Steven presses Publish.

── THE CONTRACT (app/api/puck/route.ts) ────────────────────────────────────────────────────────
  GET  /api/puck?page=<slug>&site=<id>[&pub=1]        -> { data }   draft, or published snapshot
  PUT  /api/puck  { page, site, data }                -> { ok, reason }   save draft (409 = refused)
  POST /api/puck?page=<slug>&site=<id>&action=publish -> publish the draft
Auth is the machine credential SITE_EDIT_TOKEN (Bearer), read from .env.local. It never expires,
unlike the browser cookie. ⚠️ The header comment in middleware.ts says to inject it with `op run`
— `op` is NOT installed (verified 2026-08-15), so this reads .env.local directly and never prints
the value.

── THE DOCUMENT SHAPE ──────────────────────────────────────────────────────────────────────────
  data.content = [ block, ... ]                      each block is a Puck component
  block.props.text = [ {key:"t1", label:"...", value:"the words"}, ... ]
  block.props.html = the imported markup, with {{t:t1}} slots pointing at those keys
So a copy edit is: find the text entry, change `value`. Nothing else moves.
⚠️ `label` KEEPS THE ORIGINAL IMPORTED WORDING FOREVER — it does not follow `value`. Searching the
raw JSON for an old sentence therefore returns a FALSE POSITIVE from the label. `find` below reads
`value` only, which is why it is trustworthy and grepping the JSON is not.

── USE ─────────────────────────────────────────────────────────────────────────────────────────
  python3 tools/site_text.py pages
  python3 tools/site_text.py list about
  python3 tools/site_text.py find "solo"                      # every page, value fields only
  python3 tools/site_text.py set about 1.t3 "New sentence."
  python3 tools/site_text.py replace about --find "X" --with "Y"          # dry run
  python3 tools/site_text.py replace about --find "X" --with "Y" --apply
  python3 tools/site_text.py publish about                     # asks for --yes
"""
import argparse, json, os, pathlib, sys, urllib.request, urllib.error

HERE = pathlib.Path(__file__).resolve().parent.parent
BASE = os.environ.get("SJC_SITE_BASE", "https://www.stevenjamesconsulting.com")
DEFAULT_SITE = "sjc-2026"


def token() -> str:
    """Read SITE_EDIT_TOKEN from .env.local. Never printed, never logged."""
    env = HERE / ".env.local"
    if not env.exists():
        sys.exit(f"no {env} — cannot authenticate")
    for line in env.read_text().splitlines():
        if line.startswith("SITE_EDIT_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("SITE_EDIT_TOKEN not found in .env.local")


def call(method: str, path: str, body=None):
    req = urllib.request.Request(
        BASE + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {path}: {e.read().decode()[:300]}")


def get_pages(site):
    return [p.get("slug") for p in call("GET", f"/api/pages?site={site}").get("pages", [])]


def get_doc(site, page):
    d = call("GET", f"/api/puck?page={page}&site={site}").get("data")
    if not d:
        sys.exit(f"no draft document for page '{page}' on site '{site}'")
    return d


def put_doc(site, page, doc):
    r = call("PUT", "/api/puck", {"page": page, "site": site, "data": doc})
    if not r.get("ok"):
        sys.exit(f"⛔ save REFUSED: {r.get('reason') or r}")
    return r


def texts(doc):
    """Yield (block_index, key, entry) for every editable text VALUE in the document."""
    for bi, block in enumerate(doc.get("content") or []):
        for entry in (block.get("props", {}) or {}).get("text") or []:
            if isinstance(entry, dict) and "value" in entry:
                yield bi, entry.get("key"), entry


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=DEFAULT_SITE)
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("pages")
    p = sub.add_parser("list"); p.add_argument("page")
    p = sub.add_parser("find"); p.add_argument("pattern"); p.add_argument("--page")
    p = sub.add_parser("set"); p.add_argument("page"); p.add_argument("ref"); p.add_argument("value")
    p = sub.add_parser("replace"); p.add_argument("page")
    p.add_argument("--find", required=True, dest="needle")
    p.add_argument("--with", required=True, dest="repl")
    p.add_argument("--apply", action="store_true")
    p = sub.add_parser("publish"); p.add_argument("page"); p.add_argument("--yes", action="store_true")
    a = ap.parse_args()

    if a.cmd == "pages":
        for s in get_pages(a.site):
            print(s)

    elif a.cmd == "list":
        doc = get_doc(a.site, a.page)
        for bi, key, e in texts(doc):
            print(f"{bi}.{key:<5} {e['value']}")

    elif a.cmd == "find":
        pages = [a.page] if a.page else get_pages(a.site)
        hits = 0
        for pg in pages:
            try:
                doc = get_doc(a.site, pg)
            except SystemExit:
                continue
            for bi, key, e in texts(doc):
                if a.pattern.lower() in str(e["value"]).lower():
                    hits += 1
                    print(f"{pg:<22} {bi}.{key:<5} {e['value'][:110]}")
        print(f"\n{hits} match(es) in {len(pages)} page(s) — VALUES only, labels ignored.")

    elif a.cmd == "set":
        bi_s, _, key = a.ref.partition(".")
        doc = get_doc(a.site, a.page)
        for bi, k, e in texts(doc):
            if str(bi) == bi_s and k == key:
                print(f"- {e['value']}\n+ {a.value}")
                e["value"] = a.value
                put_doc(a.site, a.page, doc)
                print(f"\n✅ DRAFT saved: {a.page} {a.ref}. Not live until publish.")
                return
        sys.exit(f"no text at {a.ref} on page {a.page}")

    elif a.cmd == "replace":
        doc = get_doc(a.site, a.page)
        changed = 0
        for bi, key, e in texts(doc):
            if a.needle in str(e["value"]):
                new = e["value"].replace(a.needle, a.repl)
                print(f"{bi}.{key}\n- {e['value']}\n+ {new}\n")
                e["value"] = new
                changed += 1
        if not changed:
            print("no matches — nothing to do.")
        elif a.apply:
            put_doc(a.site, a.page, doc)
            print(f"✅ DRAFT saved: {changed} change(s) on {a.page}. Not live until publish.")
        else:
            print(f"DRY RUN — {changed} change(s) shown above. Re-run with --apply to save the draft.")

    elif a.cmd == "publish":
        if not a.yes:
            sys.exit(f"⛔ publish puts '{a.page}' LIVE. Re-run with --yes if that is intended.")
        call("POST", f"/api/puck?page={a.page}&site={a.site}&action=publish")
        print(f"🌐 PUBLISHED {a.page} — live at {BASE}/{a.page}")


if __name__ == "__main__":
    main()
