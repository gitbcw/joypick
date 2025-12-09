#!/bin/bash

BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
cd "$BASE_DIR"
compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "docker compose not installed" >&2
    exit 1
  fi
}
compose down
compose build
docker image prune -f
compose up -d
