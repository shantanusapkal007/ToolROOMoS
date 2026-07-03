CREATE TABLE IF NOT EXISTS maintenance_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON maintenance_logs;
CREATE POLICY tenant_isolation_policy ON maintenance_logs USING (tenant_id = current_setting('app.current_tenant', true));

