CREATE TABLE IF NOT EXISTS auth_attendance (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id),
    shift VARCHAR(50) NOT NULL,
    checked_in BOOLEAN NOT NULL DEFAULT FALSE,
    last_clock_in TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Postgres RLS Policies injected automatically
ALTER TABLE auth_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON auth_attendance;
CREATE POLICY tenant_isolation_policy ON auth_attendance USING (tenant_id = current_setting('app.current_tenant', true));

