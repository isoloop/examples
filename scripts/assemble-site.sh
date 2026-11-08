#!/usr/bin/env bash
# Assembles the GitHub Pages site from the built apps (deploy.yml):
#   /                       -> links to the example groups
#   /dashboards/            -> lists the dashboards
#   /dashboards/markets/    -> the markets dashboard, every build under it
#   /markets/**             -> redirects from the old paths (before the
#                              dashboards/ grouping), query string and hash kept
set -euo pipefail

site=${1:-site}
markets=apps/dashboards/markets/dist

rm -rf "$site"
mkdir -p "$site/dashboards"
cp -r "$markets" "$site/dashboards/markets"

page() { # title, body
  printf '%s\n' '<!doctype html><html lang="en"><meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width, initial-scale=1">' \
    "<title>$1</title>" \
    '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>' \
    "$2"
}

page 'Isoloop examples' \
  '<h1>Isoloop examples</h1><ul><li><a href="./dashboards/">Dashboards</a></li></ul>' \
  > "$site/index.html"

page 'Dashboards · Isoloop examples' \
  '<h1>Dashboards</h1><ul><li><a href="./markets/">Markets</a>: a backend-less markets dashboard on public exchange feeds, as a native app and as an Isoloop app, in Lite, Normal and Heavy sizes.</li></ul>' \
  > "$site/dashboards/index.html"

# One redirect page per old path: /markets/ and /markets/<build>/.
redirect() { # dir under $site, target relative to that dir
  mkdir -p "$site/$1"
  printf '%s\n' '<!doctype html><meta charset="utf-8"><title>Moved</title>' \
    "<meta http-equiv=\"refresh\" content=\"0; url=$2\">" \
    "<script>location.replace('$2' + location.search + location.hash)</script>" \
    "<a href=\"$2\">This page moved.</a>" > "$site/$1/index.html"
}

redirect markets ../dashboards/markets/
for dir in "$markets"/*/; do
  build=$(basename "$dir")
  [ -f "$dir/index.html" ] || continue
  redirect "markets/$build" "../../dashboards/markets/$build/"
done
