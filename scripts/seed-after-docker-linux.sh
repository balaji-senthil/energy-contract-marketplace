#!/usr/bin/env bash
set -euo pipefail

compose_cmd="docker compose"
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  if command -v docker-compose >/dev/null 2>&1; then
    compose_cmd="docker-compose"
  else
    echo "Docker Compose not found. Install Docker or docker-compose." >&2
    exit 1
  fi
fi

db_service="db"
db_name="energy_contracts"
db_user="postgres"
seed_path="/docker-entrypoint-initdb.d/seed.sql"

${compose_cmd} up -d "${db_service}"

printf "Waiting for Postgres to accept connections"
until ${compose_cmd} exec -T "${db_service}" pg_isready -U "${db_user}" -d "${db_name}" >/dev/null 2>&1; do
  printf "."
  sleep 1
done
printf "\n"

${compose_cmd} exec -T "${db_service}" psql -U "${db_user}" -d "${db_name}" -f "${seed_path}"
echo "Seed applied."
