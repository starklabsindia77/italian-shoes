#!/bin/bash
# Runs ON the app instance, as root, via SSM Run Command (never via SSH —
# there is no SSH). Uploaded to S3 by the deploy workflow alongside the
# release artifact; the SSM command downloads and executes it.
#
# Required environment:
#   ARTIFACTS_BUCKET  bucket holding releases/<sha>/release.tar.gz
#   RELEASE_SHA       git SHA being deployed
#
# Layout it maintains:
#   /opt/app/releases/<timestamp>-<sha>   immutable release dirs (last 5 kept)
#   /opt/app/current                      symlink to the live release
#   /opt/app/shared/app.env               env file from Parameter Store (0400 app)
set -euo pipefail

: "${ARTIFACTS_BUCKET:?ARTIFACTS_BUCKET is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

S3_PREFIX="s3://${ARTIFACTS_BUCKET}/releases/${RELEASE_SHA}"
RELEASE_DIR="/opt/app/releases/$(date +%Y%m%d%H%M%S)-${RELEASE_SHA:0:7}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> downloading release ${RELEASE_SHA}"
aws s3 cp "${S3_PREFIX}/release.tar.gz" "$WORK/release.tar.gz"
aws s3 cp "${S3_PREFIX}/release.tar.gz.sha256" "$WORK/release.tar.gz.sha256"

echo "==> verifying checksum"
(cd "$WORK" && sha256sum -c release.tar.gz.sha256)

echo "==> extracting to ${RELEASE_DIR}"
mkdir -p "$RELEASE_DIR"
tar -xzf "$WORK/release.tar.gz" -C "$RELEASE_DIR"
chown -R app:app "$RELEASE_DIR"

echo "==> refreshing environment from Parameter Store"
/usr/local/bin/refresh-app-env

echo "==> running database migrations"
# Prisma CLI version comes from the release's own lockfile so migrate and
# client can never skew. npx fetches it from the registry over 443 (allowed
# egress). A migration failure aborts the deploy BEFORE the symlink swap,
# leaving the previous release live.
PRISMA_VERSION="$(node -p "require('${RELEASE_DIR}/package-lock.json').packages['node_modules/prisma'].version")"
set -a
# shellcheck disable=SC1091
source /opt/app/shared/app.env
set +a
(cd "$RELEASE_DIR" && runuser -u app -- env \
  DATABASE_URL="$DATABASE_URL" \
  HOME=/opt/app \
  npm_config_cache=/opt/app/.npm-cache \
  npx --yes "prisma@${PRISMA_VERSION}" migrate deploy)

echo "==> activating release (atomic symlink swap)"
ln -sfn "$RELEASE_DIR" /opt/app/current.tmp
mv -T /opt/app/current.tmp /opt/app/current

echo "==> restarting service"
systemctl restart app

echo "==> waiting for service to become active"
for _ in $(seq 1 30); do
  systemctl is-active --quiet app && break
  sleep 2
done
if ! systemctl is-active --quiet app; then
  echo "!! app.service failed to start — journal follows"
  journalctl -u app -n 100 --no-pager
  exit 1
fi

echo "==> waiting for local health endpoint"
HEALTH_OK=0
for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:3000/api/healthz" > /dev/null 2>&1; then
    HEALTH_OK=1
    break
  fi
  sleep 2
done
if [ "$HEALTH_OK" != "1" ]; then
  echo "!! /api/healthz never returned 200 — journal follows"
  journalctl -u app -n 100 --no-pager
  exit 1
fi

echo "==> pruning old releases (keeping last 5)"
ls -1dt /opt/app/releases/*/ | tail -n +6 | xargs -r rm -rf

echo "==> deploy of ${RELEASE_SHA} complete"
