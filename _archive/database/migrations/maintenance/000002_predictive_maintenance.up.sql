CREATE TABLE IF NOT EXISTS preventive_maintenance_schedules (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    machine_id UUID NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    spindle_hours_threshold NUMERIC(10, 2) NOT NULL,
    last_spindle_hours_checked NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);


-- Postgres RLS Policies injected automatically
ALTER TABLE preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON preventive_maintenance_schedules;
CREATE POLICY tenant_isolation_policy ON preventive_maintenance_schedules USING (tenant_id = current_setting('app.current_tenant', true));

