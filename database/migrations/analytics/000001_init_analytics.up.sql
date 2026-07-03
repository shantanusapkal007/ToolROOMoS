CREATE TABLE IF NOT EXISTS analytics_kpis (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    revenue_mtd NUMERIC(15, 2) NOT NULL DEFAULT 0,
    production_efficiency NUMERIC(5, 2) NOT NULL DEFAULT 0,
    active_subcontracts INTEGER NOT NULL DEFAULT 0,
    net_cash_flow NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_revenue (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    month VARCHAR(20) NOT NULL,
    revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    expenses NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_machine_utilization (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    value NUMERIC(5, 2) NOT NULL DEFAULT 0,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analytics_vendor_defects (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    vendor VARCHAR(100) NOT NULL,
    defect_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total_orders INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE analytics_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_kpis;
CREATE POLICY tenant_isolation_policy ON analytics_kpis USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE analytics_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_revenue;
CREATE POLICY tenant_isolation_policy ON analytics_revenue USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE analytics_machine_utilization ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_machine_utilization;
CREATE POLICY tenant_isolation_policy ON analytics_machine_utilization USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE analytics_vendor_defects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_vendor_defects;
CREATE POLICY tenant_isolation_policy ON analytics_vendor_defects USING (tenant_id = current_setting('app.current_tenant', true));

