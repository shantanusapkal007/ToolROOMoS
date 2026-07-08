CREATE TABLE IF NOT EXISTS spc_studies (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    process VARCHAR(255) NOT NULL,
    parameter VARCHAR(255) NOT NULL,
    cp DOUBLE PRECISION,
    cpk DOUBLE PRECISION,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Postgres RLS Policies injected automatically
ALTER TABLE spc_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON spc_studies;
CREATE POLICY tenant_isolation_policy ON spc_studies USING (tenant_id = current_setting('app.current_tenant', true));

