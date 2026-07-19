#!/usr/bin/env bash
# Idempotent VPS deploy for Arb Pulse (Ubuntu/Debian).
# Safe to re-run: installs Docker if missing, clones or fast-forwards the repo,
# pulls the CI-built image from GHCR (or builds locally with BUILD=1) and
# restarts the containers. On first run it creates .env from the example and
# stops so you can fill in DOMAIN + secrets.
#
# NOTE: normal production deploys are automatic — push/merge to `main` triggers
# .github/workflows/vps-deploy.yml (build in CI -> GHCR -> SSH pull + restart).
# This script is the manual/bootstrap path.
#
# Default: runs ONLY the app on 127.0.0.1:8080 (put it behind your host reverse
# proxy — see deploy/nginx/). Set WITH_CADDY=1 to also start the bundled Caddy on
# 80/443 (only for a fresh server with nothing else on those ports).
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/mauricioabh/arbpulse.git}"
APP_DIR="${APP_DIR:-/root/projects/arbpulse}"
BRANCH="${BRANCH:-main}"
WITH_CADDY="${WITH_CADDY:-0}"
# BUILD=1 builds the image locally instead of pulling from GHCR (fallback).
BUILD="${BUILD:-0}"

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

# 4) Image: pull from GHCR (default) or build locally (BUILD=1)
if [ "$BUILD" = "1" ]; then
  echo "==> Building image locally..."
  docker compose build app
else
  echo "==> Pulling image from GHCR..."
  docker compose pull app
fi

# 5) Run
if [ "$WITH_CADDY" = "1" ]; then
  echo "==> Starting app + bundled Caddy (ports 80/443)..."
  docker compose --profile caddy up -d
else
  echo "==> Starting app only (127.0.0.1:8080)..."
  docker compose up -d app
fi

echo "==> Waiting for health..."
sleep 8
docker compose ps
echo
if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
  echo "==> App healthy on 127.0.0.1:8080."
else
  echo "!! Health check not passing yet. Inspect: docker compose logs -f app"
fi

if [ "$WITH_CADDY" = "1" ]; then
  echo "==> Bundled Caddy will issue HTTPS once DNS for \$DOMAIN points here."
  echo "==> Verify: curl -s https://\$DOMAIN/api/health"
else
  echo "==> App is bound to 127.0.0.1:8080. Put it behind your host reverse proxy:"
  echo "    see $APP_DIR/deploy/nginx/arbpulse.wayool.com.conf (nginx + certbot)."
fi
