# Ethics for AI MCP — Apify Standby Actor
#
# Builds in-image: copies source + lockfile, runs `npm ci` (full, to get the
# TypeScript toolchain), compiles with `tsc`, then prunes dev dependencies to
# shrink the runtime image. No dist/ needed in the push context.
#
# Image: apify/actor-node:20-slim (Node 20 LTS, matches engines >=18.18).
# HTTP mode serves Streamable HTTP on /mcp; readiness probe on GET /.

FROM apify/actor-node:20-slim

WORKDIR /usr/src/app

# Install deps (full, dev included for the build step)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Compile TypeScript -> dist/
COPY tsconfig.json ./tsconfig.json
COPY src ./src
RUN npm run build

# Drop dev dependencies for a leaner runtime image
RUN npm prune --omit=dev --no-audit --no-fund

ENV NODE_ENV=production
ENV APIFY_CONTAINER_PORT=4321
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 4321

CMD ["node", "dist/http.js"]
