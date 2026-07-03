CREATE TABLE IF NOT EXISTS supplier_scorecards (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    ppm NUMERIC NOT NULL,
    delivery_performance NUMERIC NOT NULL,
    overall_score NUMERIC NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_ncrs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    challan_id UUID,
    issue_date TIMESTAMP NOT NULL,
    defect_qty INT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_audits (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    audit_date TIMESTAMP NOT NULL,
    auditor VARCHAR(100) NOT NULL,
    score NUMERIC NOT NULL,
    findings TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE supplier_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_scorecards;
CREATE POLICY tenant_isolation_policy ON supplier_scorecards USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE supplier_ncrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_ncrs;
CREATE POLICY tenant_isolation_policy ON supplier_ncrs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE supplier_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_audits;
CREATE POLICY tenant_isolation_policy ON supplier_audits USING (tenant_id = current_setting('app.current_tenant', true));

