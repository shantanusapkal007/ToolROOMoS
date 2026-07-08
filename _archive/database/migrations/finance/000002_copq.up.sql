CREATE TABLE IF NOT EXISTS copq_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id CHAR(36) PRIMARY KEY,
    source_id VARCHAR(100) NOT NULL,
    material_loss DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    labor_loss DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    machine_loss DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_loss DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE copq_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON copq_logs;
CREATE POLICY tenant_isolation_policy ON copq_logs USING (tenant_id = current_setting('app.current_tenant', true));

