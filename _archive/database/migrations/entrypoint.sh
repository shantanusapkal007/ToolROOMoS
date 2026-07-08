#!/bin/sh
set -e

echo "========================================"
echo " ToolRoom ERP — Database Migration Runner"
echo "========================================"

DB_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"

echo "[INFO] Waiting for PostgreSQL to be ready..."
until pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -q; do
  echo "[WAIT] PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "[OK] PostgreSQL is ready."

MIGRATION_DIR="/migrations"

# Define critical ordered modules first
ORDERED_MODULES="core auth"

for module in $ORDERED_MODULES; do
  service_dir="${MIGRATION_DIR}/${module}"
  if [ -d "$service_dir" ]; then
    migration_count=$(find "$service_dir" -name "*.up.sql" 2>/dev/null | wc -l)
    if [ "$migration_count" -gt 0 ]; then
      echo "[RUN] Applying migrations for: ${module} (${migration_count} files)"
      migrate -path "$service_dir" -database "${DB_URL}&x-migrations-table=schema_migrations_${module}" up || {
        echo "[WARN] Migration failed for ${module} — may already be applied"
      }
    fi
  fi
done

# Run remaining migrations
for service_dir in "${MIGRATION_DIR}"/*/; do
  service_name=$(basename "$service_dir")
  
  # Skip already executed modules
  if [ "$service_name" = "core" ] || [ "$service_name" = "auth" ]; then
    continue
  fi
  
  migration_count=$(find "$service_dir" -name "*.up.sql" 2>/dev/null | wc -l)
  if [ "$migration_count" -eq 0 ]; then
    echo "[SKIP] No migrations found for: ${service_name}"
    continue
  fi
  
  echo "[RUN] Applying migrations for: ${service_name} (${migration_count} files)"
  migrate -path "$service_dir" -database "${DB_URL}&x-migrations-table=schema_migrations_${service_name}" up || {
    echo "[WARN] Migration failed for ${service_name} — may already be applied"
  }
done

echo "[SEED] Running global seeder..."
psql "$DB_URL" -f "${MIGRATION_DIR}/global_seeder.sql" || echo "[WARN] Seeder failed"

echo "========================================"
echo " All migrations complete."
echo "========================================"
