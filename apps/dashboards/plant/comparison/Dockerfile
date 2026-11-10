# The head-to-head comparison's runner (README.md): Playwright's official
# image, at the repo's Playwright version, with the browsers it ships, plus
# Node 26 (the repo's engines field, which pnpm enforces) and pnpm through
# corepack.
FROM mcr.microsoft.com/playwright:v1.64.1-noble
RUN set -eux; \
  apt-get update; apt-get install -y --no-install-recommends curl ca-certificates xz-utils; \
  rm -rf /var/lib/apt/lists/*; \
  cd /tmp; \
  curl -fsSLO https://nodejs.org/dist/latest-v26.x/SHASUMS256.txt; \
  f=$(grep -o 'node-v26[0-9.]*-linux-x64.tar.xz' SHASUMS256.txt | head -1); \
  curl -fsSLO "https://nodejs.org/dist/latest-v26.x/$f"; \
  grep " $f\$" SHASUMS256.txt | sha256sum -c -; \
  tar -xJf "$f" -C /usr/local --strip-components=1; \
  rm -f "$f" SHASUMS256.txt; \
  node --version; \
  corepack enable
WORKDIR /work
