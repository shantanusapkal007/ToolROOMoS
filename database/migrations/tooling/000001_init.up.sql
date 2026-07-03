CREATE TABLE IF NOT EXISTS tool_assets (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    expected_life_strokes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tooling_life_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) REFERENCES tool_assets(id),
    strokes_added INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refurbishment_tickets (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) REFERENCES tool_assets(id),
    issue_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drawing_vault_documents (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) REFERENCES tool_assets(id),
    document_url VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE tool_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON tool_assets;
CREATE POLICY tenant_isolation_policy ON tool_assets USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE tooling_life_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON tooling_life_logs;
CREATE POLICY tenant_isolation_policy ON tooling_life_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE refurbishment_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON refurbishment_tickets;
CREATE POLICY tenant_isolation_policy ON refurbishment_tickets USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE drawing_vault_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON drawing_vault_documents;
CREATE POLICY tenant_isolation_policy ON drawing_vault_documents USING (tenant_id = current_setting('app.current_tenant', true));

