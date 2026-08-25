#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  printf 'Usage: %s /chemin/backup.sql.gz\n' "$0" >&2
  exit 64
fi

backup_file=$1
if [ ! -f "$backup_file" ]; then
  printf 'Backup introuvable: %s\n' "$backup_file" >&2
  exit 66
fi

gzip -t "$backup_file"
project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_dir"
printf 'Cette opération remplace les données de la base salon. Tapez RESTAURER pour continuer: '
read -r confirmation
[ "$confirmation" = "RESTAURER" ] || exit 1
gunzip -c "$backup_file" | docker compose exec -T db sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
docker compose exec -T db sh -c 'mysqlcheck -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
