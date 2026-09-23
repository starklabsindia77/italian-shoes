#!/bin/bash
# Clone the production database into a LOCAL Postgres for debugging.
#
# Read-only against prod: opens an SSM port-forward through the app instance,
# pg_dumps the prod DB, closes the tunnel, then DROPS and recreates the local
# target DB and restores into it. Nothing is ever written to prod.
#
# Usage:
#   scripts/db-clone-prod.sh                  # target = DATABASE_URL in .env.local
#   LOCAL_DATABASE_URL=postgresql://... scripts/db-clone-prod.sh
#   KEEP_DUMP=1 scripts/db-clone-prod.sh      # keep the .dump file (contains PII!)
#
# Requires: AWS creds with ssm:StartSession on the app instance and
# ssm:GetParameter (+ kms:Decrypt) on /italian-shoes/DATABASE_URL;
# session-manager-plugin; pg_dump/pg_restore major >= 18 (brew install postgresql@18).
set -euo pipefail

PROJECT="italian-shoes"
REGION="ap-south-1"
LOCAL_PORT="${TUNNEL_PORT:-15432}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PGBIN=""
[ -x /opt/homebrew/opt/postgresql@18/bin/pg_dump ] && PGBIN=/opt/homebrew/opt/postgresql@18/bin/
MAJOR="$("${PGBIN}pg_dump" --version | grep -oE '[0-9]+' | head -1)"
if [ "$MAJOR" -lt 18 ]; then
  echo "pg_dump major $MAJOR < prod server major 18. brew install postgresql@18 first." >&2
  exit 1
fi

# Split a postgres URL into shell-quoted PG* assignments with the given prefix.
# Keeps the password out of process args (ps) — libpq reads it from the env.
parse_url() {
  python3 - "$1" "$2" <<'PY'
import sys, shlex
from urllib.parse import urlsplit, unquote
u = urlsplit(sys.argv[1]); p = sys.argv[2]
vals = {
  "HOST": u.hostname or "", "PORT": str(u.port or 5432),
  "USER": unquote(u.username or ""), "PASSWORD": unquote(u.password or ""),
  "DB": u.path.lstrip("/"),
}
for k, v in vals.items():
  print(f"{p}{k}={shlex.quote(v)}")
PY
}

# ---- local target -----------------------------------------------------------
if [ -z "${LOCAL_DATABASE_URL:-}" ]; then
  [ -f "$ROOT/.env.local" ] || { echo "No LOCAL_DATABASE_URL and no .env.local" >&2; exit 1; }
  LOCAL_DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/.env.local" | tail -1 | cut -d= -f2- | sed -E 's/^"(.*)"$/\1/')"
fi
eval "$(parse_url "$LOCAL_DATABASE_URL" L_)"
case "$L_HOST" in
  localhost|127.0.0.1|::1) ;;
  *) echo "Refusing: local target host is '$L_HOST', not localhost. This script DROPS the target DB." >&2; exit 1 ;;
esac
[ -n "$L_DB" ] || { echo "Local URL has no database name" >&2; exit 1; }

# ---- prod source ------------------------------------------------------------
echo "==> reading /$PROJECT/DATABASE_URL from SSM"
PROD_URL="$(aws ssm get-parameter --region "$REGION" --name "/$PROJECT/DATABASE_URL" \
  --with-decryption --query Parameter.Value --output text)"
eval "$(parse_url "$PROD_URL" P_)"
unset PROD_URL

INSTANCE_ID="${INSTANCE_ID:-$(aws ec2 describe-instances --region "$REGION" \
  --filters "Name=tag:Name,Values=$PROJECT-app" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)}"
[ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ] || { echo "No running $PROJECT-app instance found" >&2; exit 1; }

TMP="$(mktemp -d)"
TUNNEL_PID=""
cleanup() {
  [ -n "$TUNNEL_PID" ] && kill "$TUNNEL_PID" 2>/dev/null || true
  if [ "${KEEP_DUMP:-0}" = "1" ] && [ -f "$TMP/prod.dump" ]; then
    echo "Dump kept at $TMP/prod.dump — it contains customer PII, delete it when done."
  else
    rm -rf "$TMP"
  fi
}
trap cleanup EXIT

if nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null; then
  echo "Port $LOCAL_PORT already in use (an old tunnel?). Close it or set TUNNEL_PORT." >&2
  exit 1
fi

echo "==> opening tunnel localhost:$LOCAL_PORT -> $P_HOST via $INSTANCE_ID"
aws ssm start-session --region "$REGION" --target "$INSTANCE_ID" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$P_HOST\"],\"portNumber\":[\"$P_PORT\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}" \
  >"$TMP/tunnel.log" 2>&1 &
TUNNEL_PID=$!
for _ in $(seq 1 30); do
  nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null && break
  kill -0 "$TUNNEL_PID" 2>/dev/null || { cat "$TMP/tunnel.log" >&2; exit 1; }
  sleep 1
done
nc -z 127.0.0.1 "$LOCAL_PORT" 2>/dev/null || { echo "Tunnel did not come up" >&2; cat "$TMP/tunnel.log" >&2; exit 1; }

echo "==> dumping $P_DB (read-only)"
# sslmode=require: libpq must not fall back to cleartext. Cert hostname is not
# checked (we connect via localhost), the SSM tunnel itself is encrypted.
PGHOST=127.0.0.1 PGPORT="$LOCAL_PORT" PGUSER="$P_USER" PGPASSWORD="$P_PASSWORD" \
PGDATABASE="$P_DB" PGSSLMODE=require \
  "${PGBIN}pg_dump" --format=custom --no-owner --no-privileges --file="$TMP/prod.dump"
unset P_PASSWORD

kill "$TUNNEL_PID" 2>/dev/null || true
wait "$TUNNEL_PID" 2>/dev/null || true  # reap quietly, no "Terminated" noise
TUNNEL_PID=""
echo "==> tunnel closed, dump $(du -h "$TMP/prod.dump" | cut -f1)"

# ---- restore locally --------------------------------------------------------
export PGHOST="$L_HOST" PGPORT="$L_PORT" PGUSER="$L_USER" PGPASSWORD="$L_PASSWORD"
echo "==> recreating local database $L_DB on $L_HOST:$L_PORT"
"${PGBIN}dropdb" --if-exists --force --maintenance-db=postgres "$L_DB"
"${PGBIN}createdb" --maintenance-db=postgres "$L_DB"

echo "==> restoring"
"${PGBIN}pg_restore" --no-owner --no-privileges --exit-on-error --dbname="$L_DB" "$TMP/prod.dump"

echo
"${PGBIN}psql" -d "$L_DB" -Atc \
  "select 'users: '||(select count(*) from \"User\")||', products: '||(select count(*) from \"Product\")" 2>/dev/null || true
echo "Done. Local $L_DB is now a copy of prod. Run: npm run dev"
