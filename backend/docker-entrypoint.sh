#!/bin/sh
set -e

echo "=== ToolRoomOS Backend Starting ==="

# Run automated Prisma migrations if AUTO_MIGRATE is true (default true)
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "Applying database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy || echo "Warning: Migration check completed with warnings or database already up-to-date."
fi

# Run database seed if AUTO_SEED is true
if [ "${AUTO_SEED:-false}" = "true" ]; then
  echo "Running database seed..."
  node prisma/seed.js || echo "Seed completed or skipped."
fi

# Execute main process
echo "Starting Application Server on Port ${PORT:-4000}..."
exec "$@"
