CREATE TABLE IF NOT EXISTS tooling_projects (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'PLANNING',
    start_date TIMESTAMP,
    expected_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tooling_projects_rfq_id ON tooling_projects(rfq_id);
CREATE INDEX idx_tooling_projects_quotation_id ON tooling_projects(quotation_id);


-- Postgres RLS Policies injected automatically
ALTER TABLE tooling_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON tooling_projects;
CREATE POLICY tenant_isolation_policy ON tooling_projects USING (tenant_id = current_setting('app.current_tenant', true));

