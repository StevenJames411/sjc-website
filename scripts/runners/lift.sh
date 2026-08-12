#!/bin/bash
# Thin runner so the terminal paste is ONE SHORT LINE.
#   bash ~/SJC/lift.sh      -> dry run, writes nothing
#   bash ~/SJC/lift.sh go   -> actually does it
# The real work is projects/sjc-website/scripts/lift-chrome.mjs.
set -e
cd ~/SJC/AI-Employee-Dashboard/projects/sjc-website

# Production DB credentials, pulled fresh and deleted again at the end.
npx vercel env pull .env.migrate --environment=production --yes >/dev/null 2>&1
trap 'rm -f .env.migrate' EXIT

export ENV_FILE=.env.migrate
export SITE=sjc-2026

if [ "$1" = "go" ]; then
  node scripts/lift-chrome.mjs --write
else
  node scripts/lift-chrome.mjs
fi
