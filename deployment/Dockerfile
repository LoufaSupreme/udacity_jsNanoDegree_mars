# Project Red Rover — production image.
# Build context is the REPO ROOT (CI uses: context=. , file=deployment/Dockerfile).
# syntax=docker/dockerfile:1

# ── Build stage: install production dependencies ─────────────────────────────
# No native modules here (no better-sqlite3 or similar), so there is no
# python3/make/g++ toolchain to install — npm ci is pure JavaScript and fast.
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Dependencies first — this layer stays cached unless package*.json changes, so
# ordinary code deploys pull only a small top layer from GHCR.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# App source last, since it changes most often
COPY . .

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    TZ=America/Toronto \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

COPY --from=build /app /app

# The app is stateless: no database, no cache, no log files. It writes only to
# stdout/stderr, which Docker captures (`docker compose logs -f app`). Nothing
# to persist means no volume, and no volume means no ownership mismatch to fix —
# but still drop to the unprivileged `node` user (uid 1000) out of habit.
RUN chown -R node:node /app
USER node
EXPOSE 3000

# Liveness. /api/status is a plain JSON endpoint with no upstream calls, so it
# reports whether this process can serve a request — not whether NASA is up.
# The server binds immediately, hence the short start period.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Invoked via `sh` so the script's execute bit does not matter — this repo is
# edited on Windows. NOTE: `sh` does NOT save you from CRLF line endings; a
# CRLF entrypoint fails with "set: Illegal option -". The repo's .gitattributes
# (`* text=auto eol=lf`) is what actually guarantees LF here.
ENTRYPOINT ["sh", "/app/deployment/entrypoint.sh"]
