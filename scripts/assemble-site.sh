#!/usr/bin/env bash
# Assembles the GitHub Pages site from the built apps (deploy.yml):
#   /                       -> links to the example groups
#   /dashboards/            -> lists the dashboards
#   /dashboards/markets/    -> the markets dashboard, every build under it
#   /dashboards/plant/      -> the plant dashboard, every build under it
#   /dashboards/plant/architecture/ -> its architecture diagrams (Archify,
#                              rendered and committed; see the folder's README)
#   /markets/**             -> redirects from the old paths (before the
#                              dashboards/ grouping), query string and hash kept
set -euo pipefail

site=${1:-site}
markets=apps/dashboards/markets/dist
plant=apps/dashboards/plant/dist

rm -rf "$site"
mkdir -p "$site/dashboards"
cp -r "$markets" "$site/dashboards/markets"
cp -r "$plant" "$site/dashboards/plant"
mkdir -p "$site/dashboards/plant/architecture"
cp apps/dashboards/plant/architecture/*.html apps/dashboards/plant/architecture/*.js \
  "$site/dashboards/plant/architecture/"

page() { # title, body
  printf '%s\n' '<!doctype html><html lang="en"><meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width, initial-scale=1">' \
    "<title>$1</title>" \
    '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>' \
    "$2" \
    '<p><small>Runs in Safari 16.4 or later, or a recent Chrome, Edge or Firefox.</small></p>'
}

page 'Isoloop examples' \
  '<h1>Isoloop examples</h1><ul><li><a href="./dashboards/">Dashboards</a></li></ul>' \
  > "$site/index.html"

page 'Dashboards · Isoloop examples' \
  '<h1>Dashboards</h1><ul><li><a href="./markets/">Markets</a>: a backend-less markets dashboard on public exchange feeds, as a native app and as an Isoloop app, in Lite, Normal and Heavy sizes.</li><li><a href="./plant/">Plant</a>: telemetry from a fictional plant of eight machines, 72 widgets on high-rate sensor data, as a native app, a native app with workers, and an Isoloop app in four placements.</li></ul>' \
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
