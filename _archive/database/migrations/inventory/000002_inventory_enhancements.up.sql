ALTER TABLE inventory_items ADD COLUMN expiry_date TIMESTAMP;

CREATE TABLE warehouses (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE cycle_counts (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    warehouse_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    completed_date TIMESTAMP,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE abc_analysis (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    item_id VARCHAR(36) PRIMARY KEY,
    tier VARCHAR(10) NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL
);


-- Postgres RLS Policies injected automatically
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON warehouses;
CREATE POLICY tenant_isolation_policy ON warehouses USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE cycle_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON cycle_counts;
CREATE POLICY tenant_isolation_policy ON cycle_counts USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE abc_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON abc_analysis;
CREATE POLICY tenant_isolation_policy ON abc_analysis USING (tenant_id = current_setting('app.current_tenant', true));

