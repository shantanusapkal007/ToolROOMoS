-- Revert Phase 9: Performance Engineering

-- 1. Drop Materialized Views
DROP MATERIALIZED VIEW IF EXISTS mv_machine_downtime_analytics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_inventory_valuation CASCADE;
DROP MATERIALIZED VIEW IF EXISTS mv_vendor_performance_analytics CASCADE;

-- 2. Unpartition machine_telemetry_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'machine_telemetry_logs' AND c.relkind = 'p'
    ) THEN
        ALTER TABLE machine_telemetry_logs RENAME TO machine_telemetry_logs_partitioned;

        CREATE TABLE machine_telemetry_logs (
            tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
            id SERIAL PRIMARY KEY,
            machine_id UUID NOT NULL REFERENCES machines(id),
            status VARCHAR(50) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO machine_telemetry_logs (tenant_id, id, machine_id, status, timestamp, created_at)
        SELECT tenant_id, id, machine_id, status, timestamp, created_at FROM machine_telemetry_logs_partitioned;

        DROP TABLE machine_telemetry_logs_partitioned CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping machine_telemetry_logs unpartitioning due to error: %', SQLERRM;
END;
$$;

-- 3. Unpartition audit_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'audit_logs' AND c.relkind = 'p'
    ) THEN
        ALTER TABLE audit_logs RENAME TO audit_logs_partitioned;

        CREATE TABLE audit_logs (
            tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            table_name VARCHAR(255) NOT NULL,
            record_id VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL,
            old_data JSONB,
            new_data JSONB,
            changed_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO audit_logs (tenant_id, id, table_name, record_id, action, old_data, new_data, changed_by, created_at)
        SELECT tenant_id, id, table_name, record_id, action, old_data, new_data, changed_by, created_at FROM audit_logs_partitioned;

        DROP TABLE audit_logs_partitioned CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping audit_logs unpartitioning due to error: %', SQLERRM;
END;
$$;

-- 4. Drop dynamic indexes for foreign keys
DO $$
DECLARE
    rec RECORD;
    idx_name TEXT;
    q TEXT;
BEGIN
    FOR rec IN
        SELECT
            tc.table_name,
            kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
    LOOP
        idx_name := left('idx_' || rec.table_name || '_' || rec.column_name, 63);
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = rec.table_name 
              AND indexname = idx_name
        ) THEN
            q := format('DROP INDEX IF EXISTS %I;', idx_name);
            EXECUTE q;
        END IF;
    END LOOP;
END;
$$;

-- 5. Drop indexes for deleted_at
DO $$
DECLARE
    rec RECORD;
    idx_name TEXT;
    q TEXT;
BEGIN
    FOR rec IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'deleted_at'
          AND table_schema = 'public'
    LOOP
        idx_name := left('idx_' || rec.table_name || '_deleted_at', 63);
        IF EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = rec.table_name 
              AND indexname = idx_name
        ) THEN
            q := format('DROP INDEX IF EXISTS %I;', idx_name);
            EXECUTE q;
        END IF;
    END LOOP;
END;
$$;
