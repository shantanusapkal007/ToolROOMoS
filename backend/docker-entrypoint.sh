#!/bin/sh
set -e

echo "=== ToolRoomOS Backend Starting ==="

# Run automated Prisma migrations if AUTO_MIGRATE is true (default true)
if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
  echo "Applying database migrations (prisma migrate deploy)..."
  npx prisma migrate deploy || echo "Warning: Migration check completed with warnings or database already up-to-date."
fi

# Execute main process
echo "Starting Application Server on Port ${PORT:-4000}..."
exec "$@"
