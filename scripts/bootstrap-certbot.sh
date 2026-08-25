#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"
: "${DOMAIN:?DOMAIN doit être défini}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL doit être défini}"

docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.certbot.yml up -d db app nginx
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile certbot run --rm certbot certonly --webroot --webroot-path /var/www/certbot --email "$LETSENCRYPT_EMAIL" --agree-tos --no-eff-email -d "$DOMAIN"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate nginx
