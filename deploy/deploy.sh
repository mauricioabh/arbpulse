#!/usr/bin/env bash
# Idempotent VPS deploy for Arb Pulse (Ubuntu/Debian).
# Safe to re-run: installs Docker if missing, clones or fast-forwards the repo,
# then (re)builds and restarts the containers. On first run it creates .env from
# the example and stops so you can fill in DOMAIN + secrets.
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mauricioabh/arbpulse.git}"
APP_DIR="${APP_DIR:-/opt/arbpulse}"
BRANCH="${BRANCH:-main}"

echo "==> Arb Pulse VPS deploy (branch: $BRANCH, dir: $APP_DIR)"

# 1) Docker + compose plugin
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker Engine..."
  curl -fsSL https://get.docker.com | sh
fi
docker --version
if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: 'docker compose' plugin not available. Install docker-compose-plugin." >&2
  exit 1
fi

# 2) Repo (clone or fast-forward)
if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Cloning $REPO_URL into $APP_DIR"
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(id -un)":"$(id -gn)" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "==> Updating existing repo in $APP_DIR"
  git -C "$APP_DIR" fetch origin "$BRANCH"
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR/deploy"

# 3) Environment file
if [ ! -f .env ]; then
  cp .env.vps.example .env
  echo
  echo "==> Created $APP_DIR/deploy/.env from the example."
  echo "    Edit it now (set DOMAIN, and optionally SENTRY_DSN / UPSTASH_*),"
  echo "    then run this script again to build and start."
  exit 0
fi

# 4) Build + run
echo "==> Building and starting containers..."
docker compose up -d --build

echo "==> Waiting for health..."
sleep 8
docker compose ps
echo
if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
  echo "==> App healthy on 127.0.0.1:8080."
else
  echo "!! Health check not passing yet. Inspect: docker compose logs -f app"
fi
echo "==> If your domain's A record points here, Caddy will issue HTTPS automatically."
echo "==> Verify: curl -s https://\$DOMAIN/api/health"
