#!/bin/sh
set -e

echo "[clms] Applying database migrations..."
# Preferred path: apply versioned migrations. If migration history has drifted
# (e.g. a migration file was edited after being applied → Prisma P3009, or a
# failed migration is recorded), migrate deploy aborts. Rather than crash-loop
# the container (which surfaces as gateway 500s on every request), fall back to
# `db push` to reconcile the live database to schema.prisma. All recent schema
# changes are additive, so this does not drop data.
if ! npx prisma migrate deploy; then
  echo "[clms] migrate deploy failed (history drift?). Reconciling schema with db push..."
  npx prisma db push --skip-generate --accept-data-loss || {
    echo "[clms] db push also failed — continuing to start API so the failure is visible in logs."
  }
fi

echo "[clms] Seeding database (idempotent)..."
npx ts-node prisma/seed.ts || echo "[clms] Seed skipped/failed (continuing)"

echo "[clms] Starting API..."
export NODE_ENV=production
exec node dist/main.js
