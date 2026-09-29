#!/bin/sh
set -e

echo "=================================================="
echo "POLARIS Backend Container Starting"
echo "Environment: ${NODE_ENV:-production}"
echo "=================================================="

# Check and apply database migrations if configured
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$NODE_ENV" = "production" ]; then
  echo "[POLARIS] Applying Prisma database migrations..."
  npx prisma migrate deploy || {
    echo "[POLARIS WARNING] Migration deploy encountered an issue, proceeding with startup..."
  }
fi

# Optional database seeding
if [ "$SEED_DATABASE" = "true" ]; then
  echo "[POLARIS] Executing deterministic database seed..."
  npx tsx prisma/seed.ts || {
    echo "[POLARIS WARNING] Seed execution failed or already seeded, proceeding..."
  }
fi

echo "[POLARIS] Starting backend process: $@"
exec "$@"
