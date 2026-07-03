CREATE TABLE IF NOT EXISTS change_requests (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reason_for_change TEXT,
    priority VARCHAR(50) NOT NULL,
    requested_by UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_impact_analyses (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    cost_impact NUMERIC(15,2) DEFAULT 0,
    time_impact_days INT DEFAULT 0,
    tooling_impact TEXT,
    process_impact TEXT,
    analyzed_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_impact_analysis UNIQUE (change_request_id)
);

CREATE TABLE IF NOT EXISTS change_notices (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
    ecn_number VARCHAR(100) UNIQUE NOT NULL,
    implementation_plan TEXT,
    target_date TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_change_notice UNIQUE (change_request_id)
);

CREATE INDEX IF NOT EXISTS idx_change_requests_plant ON change_requests (plant_id);


-- Postgres RLS Policies injected automatically
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_requests;
CREATE POLICY tenant_isolation_policy ON change_requests USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE change_impact_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_impact_analyses;
CREATE POLICY tenant_isolation_policy ON change_impact_analyses USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE change_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_notices;
CREATE POLICY tenant_isolation_policy ON change_notices USING (tenant_id = current_setting('app.current_tenant', true));

