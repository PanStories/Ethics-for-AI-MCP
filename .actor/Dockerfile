# Ethics for AI MCP — Apify Standby Actor
#
# Builds in-image: copies source + lockfile, runs `npm ci` with dev dependencies
# INCLUDED (the apify/actor-node base image sets NODE_ENV=production, which makes
# npm omit devDependencies by default — that previously left `tsc` missing),
# compiles TypeScript -> dist/, then prunes dev deps for a lean runtime image.
#
# Image: apify/actor-node:24-slim (Node 24 LTS).
# HTTP mode serves Streamable HTTP on /mcp; readiness probe on GET /.

FROM apify/actor-node:24-slim

WORKDIR /usr/src/app

# Install deps INCLUDING dev/toolchain. `--include=dev` overrides the base
# image's NODE_ENV=production so `typescript` (and thus `tsc`) is present.
COPY package.json package-lock.json* ./
RUN npm ci --include=dev --no-audit --no-fund

# Compile TypeScript -> dist/ (explicit .bin path, no reliance on $PATH).
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN ./node_modules/.bin/tsc

# Drop dev dependencies for a leaner runtime image.
RUN npm prune --omit=dev --no-audit --no-fund

ENV NODE_ENV=production
ENV APIFY_CONTAINER_PORT=4321
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 4321

CMD ["node", "dist/http.js"]
