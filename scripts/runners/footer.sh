#!/bin/bash
# Thin runner so the terminal paste is ONE SHORT LINE.
#   bash ~/SJC/footer.sh      -> dry run, writes nothing
#   bash ~/SJC/footer.sh go   -> actually does it
# The real work is projects/sjc-website/scripts/stripped-footer.mjs.
set -e
cd ~/SJC/AI-Employee-Dashboard/projects/sjc-website

npx vercel env pull .env.migrate --environment=production --yes >/dev/null 2>&1
trap 'rm -f .env.migrate' EXIT

export ENV_FILE=.env.migrate
export SITE=sjc-2026

if [ "$1" = "go" ]; then
  node scripts/stripped-footer.mjs --write
else
  node scripts/stripped-footer.mjs
fi
