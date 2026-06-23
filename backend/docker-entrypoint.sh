#!/bin/sh
set -e

echo "[clms] Applying database migrations..."
npx prisma migrate deploy

echo "[clms] Seeding database (idempotent)..."
npx ts-node prisma/seed.ts || echo "[clms] Seed skipped/failed (continuing)"

echo "[clms] Starting API..."
export NODE_ENV=production
exec node dist/main.js
