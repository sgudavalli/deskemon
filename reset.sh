#!/usr/bin/env bash
# Completely tear down and rebuild the Docker stack from scratch:
# stops containers, wipes the Postgres volume (all events/nudges lost),
# rebuilds every image with no cache, and starts everything fresh.
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Stopping containers and wiping volumes..."
docker compose down -v --remove-orphans

echo "==> Rebuilding images (no cache)..."
docker compose build --no-cache

echo "==> Starting fresh..."
docker compose up -d

echo "==> Done. Current status:"
docker compose ps
