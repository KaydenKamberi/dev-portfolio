#!/usr/bin/env bash
# Scans the demo folders for two problems before you deploy:
#   1. Any mention of a name you pass in (text, titles, meta tags, links, footers)
#   2. Asset paths that start with "/" (these break on GitHub Pages because
#      the site lives in the /dev-portfolio/ subfolder)
# Usage, from the repo root:  bash tools/check-demos.sh "Name To Find"
cd "$(dirname "$0")/.." || exit 1
problems=0

term="${1:-}"
if [ -z "$term" ]; then
  echo "Usage: bash tools/check-demos.sh \"Name To Find\""
  exit 2
fi
# Match the words with or without spaces, dashes or underscores between them
pattern=$(printf '%s' "$term" | sed -E 's/[^A-Za-z0-9 ]//g; s/ +/[ _-]?/g')

echo "1) Looking for \"$term\" mentions..."
if grep -rniE "$pattern" demo; then
  problems=1
else
  echo "   None found."
fi

echo
echo "2) Looking for root-absolute paths (src=\"/...\", href=\"/...\", url(/...))..."
if grep -rnE "(src|href|srcset|action|poster|data-src)=[\"']/[^/]|url\([\"']?/[^/]|fetch\([\"']/[^/]" demo \
     --include=*.html --include=*.css --include=*.js; then
  problems=1
else
  echo "   None found."
fi

echo
if [ "$problems" -eq 0 ]; then
  echo "All clear."
else
  echo "Fix the lines above, then run this again."
  exit 1
fi
