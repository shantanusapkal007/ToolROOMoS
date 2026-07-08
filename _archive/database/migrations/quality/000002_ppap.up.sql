CREATE TABLE IF NOT EXISTS ppap_submissions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    submission_level INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    customer_approval BOOLEAN NOT NULL DEFAULT FALSE,
    submission_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dimensional_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    characteristic_id UUID NOT NULL,
    measurement DOUBLE PRECISION NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_certifications (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    material_spec VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    heat_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capability_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    characteristic_id UUID NOT NULL,
    cpk DOUBLE PRECISION NOT NULL,
    ppk DOUBLE PRECISION NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appearance_approval_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    color VARCHAR(100) NOT NULL,
    texture VARCHAR(100) NOT NULL,
    master_number VARCHAR(100) NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_flow_diagrams (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    document_url VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS psws (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    engineering_level VARCHAR(100),
    weight DOUBLE PRECISION,
    declaration TEXT,
    authorized_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE ppap_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON ppap_submissions;
CREATE POLICY tenant_isolation_policy ON ppap_submissions USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE dimensional_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON dimensional_reports;
CREATE POLICY tenant_isolation_policy ON dimensional_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE material_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certifications;
CREATE POLICY tenant_isolation_policy ON material_certifications USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE capability_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON capability_reports;
CREATE POLICY tenant_isolation_policy ON capability_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE appearance_approval_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON appearance_approval_reports;
CREATE POLICY tenant_isolation_policy ON appearance_approval_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE process_flow_diagrams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON process_flow_diagrams;
CREATE POLICY tenant_isolation_policy ON process_flow_diagrams USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE psws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON psws;
CREATE POLICY tenant_isolation_policy ON psws USING (tenant_id = current_setting('app.current_tenant', true));

