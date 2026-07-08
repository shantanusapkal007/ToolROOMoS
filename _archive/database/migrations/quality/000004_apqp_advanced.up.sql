CREATE TABLE IF NOT EXISTS apqp_project_timelines (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    target_completion_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apqp_milestones (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    timeline_id VARCHAR(36) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    target_date TIMESTAMP NOT NULL,
    actual_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE apqp_project_timelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_project_timelines;
CREATE POLICY tenant_isolation_policy ON apqp_project_timelines USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE apqp_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_milestones;
CREATE POLICY tenant_isolation_policy ON apqp_milestones USING (tenant_id = current_setting('app.current_tenant', true));

