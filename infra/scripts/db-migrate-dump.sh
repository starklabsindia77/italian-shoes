#!/bin/bash
# Migration step 1 — run on YOUR LAPTOP.
# Dumps the old public us-east-1 database and uploads the dump to the private
# artifacts bucket. The password is prompted, never passed on the command line.
#
# Requires: pg_dump major >= 18 (brew install postgresql@18), AWS profile
# with s3:PutObject on the artifacts bucket.
set -euo pipefail

OLD_HOST="italian-shoes-db.conyuyc0gfdn.us-east-1.rds.amazonaws.com"
OLD_DB="italianshoes"
OLD_USER="postgres"
PROFILE="${AWS_PROFILE:-italian-shoes}"
BUCKET="italian-shoes-artifacts-145023126353"
KEY="migration/italianshoes-$(date +%Y%m%d%H%M%S).sql.gz"

PG_DUMP="pg_dump"
[ -x /opt/homebrew/opt/postgresql@18/bin/pg_dump ] && PG_DUMP=/opt/homebrew/opt/postgresql@18/bin/pg_dump
MAJOR="$($PG_DUMP --version | grep -oE '[0-9]+' | head -1)"
if [ "$MAJOR" -lt 18 ]; then
  echo "pg_dump major $MAJOR < source server major 18. brew install postgresql@18 first." >&2
  exit 1
fi

read -r -s -p "Master password for ${OLD_USER}@${OLD_HOST}: " PGPASSWORD
echo
export PGPASSWORD
# TLS always: without this, libpq retries a failed connection WITHOUT SSL,
# which both leaks the attempt in cleartext and muddies the error output.
export PGSSLMODE=require

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
DUMP="$TMP/dump.sql.gz"

echo "==> dumping ${OLD_DB} from ${OLD_HOST}"
# --no-owner --no-privileges: objects will be owned by the NEW db's master
# user (app_admin); the old 'postgres' role doesn't exist there.
"$PG_DUMP" \
  --host="$OLD_HOST" --port=5432 --username="$OLD_USER" --dbname="$OLD_DB" \
  --no-owner --no-privileges --format=plain \
  | gzip > "$DUMP"
unset PGPASSWORD

echo "==> uploading to s3://${BUCKET}/${KEY}"
aws s3 cp "$DUMP" "s3://${BUCKET}/${KEY}" --profile "$PROFILE"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
aws s3 cp "$SCRIPT_DIR/db-migrate-restore.sh" "s3://${BUCKET}/migration/db-migrate-restore.sh" --profile "$PROFILE"

echo
echo "Done. Now open a session on the instance and restore:"
echo "  aws ssm start-session --target \$(terraform output -raw instance_id) --region ap-south-1 --profile ${PROFILE}"
echo "Inside the session:"
echo "  sudo -i"
echo "  aws s3 cp s3://${BUCKET}/migration/db-migrate-restore.sh /root/db-migrate-restore.sh && chmod +x /root/db-migrate-restore.sh"
echo "  DUMP_KEY='${KEY}' /root/db-migrate-restore.sh"
echo
echo "The dump contains ALL production data. After a verified restore, delete it:"
echo "  aws s3 rm s3://${BUCKET}/${KEY} --profile ${PROFILE}"
