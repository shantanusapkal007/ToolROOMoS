-- Phase 9: Performance Engineering
-- Adds missing B-Tree indexes for all foreign keys, adds indexes for deleted_at,
-- implements table partitioning for audit_logs and machine_telemetry_logs, and creates Materialized Views.

-- 1. Dynamic B-Tree Indexes for Foreign Keys
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
        -- Truncate name if it's too long
        idx_name := left('idx_' || rec.table_name || '_' || rec.column_name, 63);
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = rec.table_name 
              AND indexname = idx_name
        ) THEN
            q := format('CREATE INDEX IF NOT EXISTS %I ON %I (%I);', idx_name, rec.table_name, rec.column_name);
            EXECUTE q;
        END IF;
    END LOOP;
END;
$$;

-- 2. Indexes for deleted_at
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
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = rec.table_name 
              AND indexname = idx_name
        ) THEN
            q := format('CREATE INDEX IF NOT EXISTS %I ON %I (deleted_at);', idx_name, rec.table_name);
            EXECUTE q;
        END IF;
    END LOOP;
END;
$$;

-- 3. Partitioning machine_telemetry_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'machine_telemetry_logs' AND c.relkind = 'r'
    ) THEN
        ALTER TABLE machine_telemetry_logs RENAME TO machine_telemetry_logs_old;

        CREATE TABLE machine_telemetry_logs (
            tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
            id SERIAL,
            machine_id UUID NOT NULL,
            status VARCHAR(50) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, timestamp)
        ) PARTITION BY RANGE (timestamp);

        CREATE TABLE machine_telemetry_logs_y2025 PARTITION OF machine_telemetry_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
        CREATE TABLE machine_telemetry_logs_y2026 PARTITION OF machine_telemetry_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
        CREATE TABLE machine_telemetry_logs_y2027 PARTITION OF machine_telemetry_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

        INSERT INTO machine_telemetry_logs (tenant_id, id, machine_id, status, timestamp, created_at)
        SELECT tenant_id, id, machine_id, status, timestamp, created_at FROM machine_telemetry_logs_old;

        DROP TABLE machine_telemetry_logs_old CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping machine_telemetry_logs partitioning due to error: %', SQLERRM;
END;
$$;

-- 4. Partitioning audit_logs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'audit_logs' AND c.relkind = 'r'
    ) THEN
        ALTER TABLE audit_logs RENAME TO audit_logs_old;

        CREATE TABLE audit_logs (
            tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
            id UUID DEFAULT gen_random_uuid(),
            table_name VARCHAR(255) NOT NULL,
            record_id VARCHAR(255) NOT NULL,
            action VARCHAR(50) NOT NULL,
            old_data JSONB,
            new_data JSONB,
            changed_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id, created_at)
        ) PARTITION BY RANGE (created_at);

        CREATE TABLE audit_logs_y2025 PARTITION OF audit_logs FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
        CREATE TABLE audit_logs_y2026 PARTITION OF audit_logs FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
        CREATE TABLE audit_logs_y2027 PARTITION OF audit_logs FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

        INSERT INTO audit_logs (tenant_id, id, table_name, record_id, action, old_data, new_data, changed_by, created_at)
        SELECT tenant_id, id, table_name, record_id, action, old_data, new_data, changed_by, created_at FROM audit_logs_old;

        DROP TABLE audit_logs_old CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping audit_logs partitioning due to error: %', SQLERRM;
END;
$$;

-- 5. Materialized Views for Reporting Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_machine_downtime_analytics AS
SELECT 
    m.id AS machine_id,
    m.name AS machine_name,
    COUNT(d.id) AS total_downtime_events,
    SUM(EXTRACT(EPOCH FROM (COALESCE(d.ended_at, NOW()) - d.started_at))/3600) AS total_downtime_hours
FROM machines m
LEFT JOIN downtime_logs d ON m.id = d.machine_id
GROUP BY m.id, m.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_machine_downtime_machine_id ON mv_machine_downtime_analytics(machine_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_valuation AS
SELECT 
    i.id AS item_id,
    i.name AS item_name,
    i.item_type,
    i.quantity,
    i.unit_price,
    (i.quantity * i.unit_price) AS total_value
FROM inventory_items i;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_inventory_valuation_item_id ON mv_inventory_valuation(item_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vendor_performance_analytics AS
SELECT 
    v.id AS vendor_id,
    v.name AS vendor_name,
    AVG(sa.score) AS avg_audit_score,
    COUNT(sn.id) AS total_ncrs
FROM vendors v
LEFT JOIN supplier_audits sa ON v.id = sa.vendor_id
LEFT JOIN supplier_ncrs sn ON v.id = sn.vendor_id
GROUP BY v.id, v.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vendor_performance_vendor_id ON mv_vendor_performance_analytics(vendor_id);
