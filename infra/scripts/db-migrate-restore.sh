#!/bin/bash
# Migration step 2 — run ON THE APP INSTANCE (via an SSM session, as root).
# Downloads the dump this project's dump script uploaded and restores it into
# the new private RDS instance using the DATABASE_URL from Parameter Store.
#
# Usage:  sudo DUMP_KEY='migration/italianshoes-<timestamp>.sql.gz' ./db-migrate-restore.sh
set -euo pipefail

: "${DUMP_KEY:?DUMP_KEY is required (S3 key printed by db-migrate-dump.sh)}"
BUCKET="italian-shoes-artifacts-145023126353"

# psql client — the server executes the SQL, so the client major doesn't
# need to match the server's; take the newest AL2023 offers.
if ! command -v psql > /dev/null; then
  dnf -y install postgresql18 2>/dev/null || dnf -y install postgresql17 2>/dev/null || dnf -y install postgresql16
fi

echo "==> pulling DATABASE_URL from Parameter Store"
/usr/local/bin/refresh-app-env
set -a
# shellcheck disable=SC1091
source /opt/app/shared/app.env
set +a

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> downloading dump"
aws s3 cp --no-progress "s3://${BUCKET}/${DUMP_KEY}" "$TMP/dump.sql.gz"

# If a deploy ran before the restore, `prisma migrate deploy` already
# created every table, and the dump's CREATE TABLE statements would abort
# the restore. WIPE_SCHEMA_FIRST=yes drops and recreates the public schema
# first. DESTRUCTIVE: only ever use it on a database whose current content
# you are certain is disposable (empty schema from migrations, or a failed
# earlier restore).
if [ "${WIPE_SCHEMA_FIRST:-no}" = "yes" ]; then
  echo "==> WIPE_SCHEMA_FIRST=yes — dropping and recreating schema 'public'"
  psql "$DATABASE_URL" --set ON_ERROR_STOP=1 --quiet \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
fi

echo "==> restoring (ON_ERROR_STOP=1 — any failed statement aborts)"
gunzip -c "$TMP/dump.sql.gz" | psql "$DATABASE_URL" \
  --set ON_ERROR_STOP=1 --quiet

echo "==> verification: tables and row counts"
psql "$DATABASE_URL" --quiet -c \
  "SELECT relname AS table, n_live_tup AS approx_rows
     FROM pg_stat_user_tables ORDER BY relname;"
psql "$DATABASE_URL" --quiet -c \
  "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;"

echo
echo "Restore complete. Compare the row counts against the old DB, then"
echo "delete the dump from S3 (from your laptop):"
echo "  aws s3 rm s3://${BUCKET}/${DUMP_KEY} --profile italian-shoes"
