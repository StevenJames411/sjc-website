# The one-line runners

Steven pastes ONE SHORT LINE into a terminal — a wrapped command is a command that gets
mis-pasted. Each of these is a thin wrapper that pulls production credentials, runs the real
script in `../`, and deletes the credentials again on exit.

Copies live at `~/SJC/<name>.sh` so the paste is short. **These are the backup** — `~/SJC` is not
a repository, so anything that exists only there is laptop-only and one disk away from gone.

| Runner | Wraps | What it does |
|---|---|---|
| `lift.sh` | `lift-chrome.mjs` | Pulls an imported design's header + footer out of every page into the site's global `nav`/`footer`. |
| `footer.sh` | `stripped-footer.mjs` | Banks the full footer in the section library and installs the stripped one. |
| `apex.sh` | `point-apex.mjs` | Moves `stevenjamesconsulting.com` to a registry site and retires the old rows. |

All three dry-run by default. `go` writes.
