CREATE TABLE IF NOT EXISTS quotations (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    rfq_code VARCHAR(100),
    project_name VARCHAR(255),
    material VARCHAR(255) DEFAULT 'H13 Steel',
    weight NUMERIC(10, 2) DEFAULT 0,
    total_hours NUMERIC(10, 2) DEFAULT 0,
    total_estimated_cost NUMERIC(12, 2) DEFAULT 0,
    final_price NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_calculations (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    material_cost NUMERIC(12, 2) DEFAULT 0,
    machining_cost NUMERIC(12, 2) DEFAULT 0,
    labor_cost NUMERIC(12, 2) DEFAULT 0,
    overhead_cost NUMERIC(12, 2) DEFAULT 0,
    profit_margin NUMERIC(5, 4) DEFAULT 0,
    simulated_price NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_cost_analysis (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    est_material_cost NUMERIC(12, 2) DEFAULT 0,
    act_material_cost NUMERIC(12, 2) DEFAULT 0,
    est_machining_cost NUMERIC(12, 2) DEFAULT 0,
    act_machining_cost NUMERIC(12, 2) DEFAULT 0,
    est_labor_cost NUMERIC(12, 2) DEFAULT 0,
    act_labor_cost NUMERIC(12, 2) DEFAULT 0,
    est_vendor_cost NUMERIC(12, 2) DEFAULT 0,
    act_vendor_cost NUMERIC(12, 2) DEFAULT 0,
    est_profit NUMERIC(12, 2) DEFAULT 0,
    act_profit NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotations_rfq_code ON quotations(rfq_code);


-- Postgres RLS Policies injected automatically
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON quotations;
CREATE POLICY tenant_isolation_policy ON quotations USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE cost_calculations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON cost_calculations;
CREATE POLICY tenant_isolation_policy ON cost_calculations USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE project_cost_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON project_cost_analysis;
CREATE POLICY tenant_isolation_policy ON project_cost_analysis USING (tenant_id = current_setting('app.current_tenant', true));

