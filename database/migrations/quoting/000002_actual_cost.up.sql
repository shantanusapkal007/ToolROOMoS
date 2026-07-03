CREATE TABLE IF NOT EXISTS project_cost_analysis (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    est_material_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    act_material_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    est_machining_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    act_machining_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    est_labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    act_labor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    est_vendor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    act_vendor_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    est_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    act_profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);


-- Postgres RLS Policies injected automatically
ALTER TABLE project_cost_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON project_cost_analysis;
CREATE POLICY tenant_isolation_policy ON project_cost_analysis USING (tenant_id = current_setting('app.current_tenant', true));

