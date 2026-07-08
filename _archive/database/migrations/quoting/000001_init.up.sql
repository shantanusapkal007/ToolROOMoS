CREATE TABLE IF NOT EXISTS quotations (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    rfq_code VARCHAR(100) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    material VARCHAR(100),
    weight NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    final_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_calculations (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    material_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    machining_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    labor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    overhead_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    profit_margin NUMERIC(5, 4) NOT NULL DEFAULT 0, -- e.g. 0.2000 for 20%
    simulated_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON quotations;
CREATE POLICY tenant_isolation_policy ON quotations USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE cost_calculations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON cost_calculations;
CREATE POLICY tenant_isolation_policy ON cost_calculations USING (tenant_id = current_setting('app.current_tenant', true));

