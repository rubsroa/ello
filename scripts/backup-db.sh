#!/bin/sh
set -eu
umask 077

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
backup_dir=${BACKUP_DIR:-"$project_dir/backups"}
retention_days=${BACKUP_RETENTION_DAYS:-14}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$backup_dir/salon-$timestamp.sql.gz"

mkdir -p "$backup_dir"
cd "$project_dir"
docker compose exec -T db sh -c 'exec mysqldump --single-transaction --quick --routines --triggers -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' | gzip -9 > "$target"
gzip -t "$target"
chmod 600 "$target"
find "$backup_dir" -type f -name 'salon-*.sql.gz' -mtime "+$retention_days" -delete
printf '%s\n' "$target"
