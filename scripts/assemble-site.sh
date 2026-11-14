#!/usr/bin/env bash
# Assembles the GitHub Pages site (isoloop.dev, ADR 0001) from the built apps
# (deploy.yml):
#   /                                -> the site (apps/site, ADR 0002), once a
#                                       site-v* tag is reachable from HEAD;
#                                       before that a placeholder
#                                       (scripts/placeholder/, plan task 3)
#   /how-it-works/                   -> the site's diagrams page (with the site)
#   /examples/                       -> the hub (with the site), else a list
#   /examples/basic/                 -> basic: four isolates, two of them pooled
#   /examples/dashboards/            -> lists the dashboards
#   /examples/dashboards/markets/    -> the markets dashboard, every build under it
#   /examples/dashboards/plant/      -> the plant dashboard, every build under it
#   /examples/dashboards/plant/architecture/ -> its architecture diagrams
#                                       (Archify, rendered and committed; see the
#                                       folder's README)
#   /examples/markets/**             -> redirects from the old paths (before the
#                                       dashboards/ grouping), query string and
#                                       hash kept
set -euo pipefail

site=${1:-site}

# The site goes live with its first tag (website plan task 10): a site-v* tag
# reachable from HEAD switches it on, and every later deploy keeps it. SITE=1
# forces it (the site's CI job), SITE=0 leaves it out.
if [ -z "${SITE:-}" ]; then
  if git describe --tags --match 'site-v*' HEAD >/dev/null 2>&1; then SITE=1; else SITE=0; fi
fi
markets=apps/dashboards/markets/dist
plant=apps/dashboards/plant/dist
basic=apps/basic/dist

ex=$site/examples

rm -rf "$site"
mkdir -p "$ex/dashboards"
cp scripts/placeholder/* "$site/"
cp -r "$markets" "$ex/dashboards/markets"
cp -r "$plant" "$ex/dashboards/plant"
cp -r "$basic" "$ex/basic"
mkdir -p "$ex/dashboards/plant/architecture"
cp apps/dashboards/plant/architecture/*.html apps/dashboards/plant/architecture/*.js \
  "$ex/dashboards/plant/architecture/"

if [ "$SITE" = 1 ]; then
  rm -f "$site/index.html" "$site/placeholder.css"
  # The site's own pages at the root, its hub and screenshots under /examples/.
  (cd apps/site/dist && find . -type f) | while read -r f; do
    mkdir -p "$site/$(dirname "$f")"
    cp "apps/site/dist/$f" "$site/$f"
  done
fi

page() { # title, body
  printf '%s\n' '<!doctype html><html lang="en"><meta charset="utf-8">' \
    '<meta name="viewport" content="width=device-width, initial-scale=1">' \
    "<title>$1</title>" \
    '<style>body{font:16px/1.5 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>' \
    "$2" \
    '<p><small>Runs in Safari 16.4 or later, or a recent Chrome, Edge or Firefox.</small></p>'
}

if [ "$SITE" = 0 ]; then
page 'Isoloop examples' \
  '<h1>Isoloop examples</h1><ul><li><a href="./basic/">Basic</a>: four isolates on three event loops, two of them sharing a pool. Block or crash any of them and watch what keeps running.</li><li><a href="./dashboards/">Dashboards</a></li></ul>' \
  > "$ex/index.html"

page 'Dashboards · Isoloop examples' \
  '<h1>Dashboards</h1><ul><li><a href="./markets/">Markets</a>: a backend-less markets dashboard on public exchange feeds, as a native app and as an Isoloop app, in Lite, Normal and Heavy sizes.</li><li><a href="./plant/">Plant</a>: telemetry from a fictional plant of eight machines, 72 widgets on high-rate sensor data, as a native app, a native app with workers, and an Isoloop app in four placements.</li></ul>' \
  > "$ex/dashboards/index.html"
fi

# One redirect page per old path: /markets/ and /markets/<build>/.
redirect() { # dir under $ex, target relative to that dir
  mkdir -p "$ex/$1"
  printf '%s\n' '<!doctype html><meta charset="utf-8"><title>Moved</title>' \
    "<meta http-equiv=\"refresh\" content=\"0; url=$2\">" \
    "<script>location.replace('$2' + location.search + location.hash)</script>" \
    "<a href=\"$2\">This page moved.</a>" > "$ex/$1/index.html"
}

# With the site, the hub at /examples/ lists the dashboards too.
if [ "$SITE" = 1 ]; then redirect dashboards ../; fi

redirect markets ../dashboards/markets/
for dir in "$markets"/*/; do
  build=$(basename "$dir")
  [ -f "$dir/index.html" ] || continue
  redirect "markets/$build" "../../dashboards/markets/$build/"
done
