#!/bin/bash
# Thin runner so the terminal paste is ONE SHORT LINE.
#   bash ~/SJC/apex.sh      -> dry run, writes nothing
#   bash ~/SJC/apex.sh go   -> actually does it
# The real work is projects/sjc-website/scripts/point-apex.mjs.
set -e
cd ~/SJC/AI-Employee-Dashboard/projects/sjc-website

npx vercel env pull .env.migrate --environment=production --yes >/dev/null 2>&1
trap 'rm -f .env.migrate' EXIT

export ENV_FILE=.env.migrate

if [ "$1" = "go" ]; then
  node scripts/point-apex.mjs --write
else
  node scripts/point-apex.mjs
fi
