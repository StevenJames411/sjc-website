#!/bin/bash
# One-shot: commit the whole sjc-website to GitHub, then remove this helper.
cd /Users/stevenbarchetti/SJC/AI-Employee-Dashboard/projects/sjc-website || exit 1
git add -A
git reset -- _push.sh 2>/dev/null   # don't commit this helper itself
git commit -m "Migrate whole SJC site onto a self-owned Puck visual builder

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git push origin main
rm -f _push.sh
echo "Done — pushed to github.com/StevenJames411/sjc-website (main)."
