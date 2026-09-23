#!/bin/sh
# Container entrypoint: validate configuration, then start the server.
# Runs on every container start; safe to re-run.

set -e   # any failing command aborts the start — fail loud, fail early

# The app itself does not exit when API_KEY is missing; it just returns broken
# APOD responses at runtime. Checking here converts a silent half-working deploy
# into an obvious refusal in `docker compose logs`.
if [ -z "$API_KEY" ]; then
  echo "[entrypoint] API_KEY is not set — refusing to start."
  echo "[entrypoint] Get a key at https://api.nasa.gov, then check that .env"
  echo "[entrypoint] sits next to docker-compose.yml and is readable."
  exit 1
fi

echo "[entrypoint] Starting Project Red Rover on :${PORT:-3000}…"

# `exec node` rather than `exec npm start`, deliberately.
#
# With npm in between, npm becomes PID 1 and node is its child. On
# `docker compose up -d` the old container gets SIGTERM, npm reports
# "command failed / signal SIGTERM" and exits 1 — so every redeploy logs a
# spurious failure. Running node directly makes it PID 1, so it receives
# SIGTERM itself and exits 0. The app spawns no children, so nothing needs an
# init process to reap.
exec node src/server/index.js
