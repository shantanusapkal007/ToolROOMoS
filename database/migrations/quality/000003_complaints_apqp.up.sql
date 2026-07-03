CREATE TABLE IF NOT EXISTS customer_complaints (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    product_id UUID NOT NULL,
    description TEXT,
    status VARCHAR(50),
    reported_date TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eight_d_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    complaint_id UUID NOT NULL,
    d1_team TEXT,
    d2_problem TEXT,
    d3_ica TEXT,
    d4_rca TEXT,
    d5_pca TEXT,
    d6_implement TEXT,
    d7_prevent TEXT,
    d8_recognize TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apqp_gate_reviews (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    gate INT,
    status VARCHAR(50),
    review_date TIMESTAMP,
    reviewer VARCHAR(255),
    comments TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS open_risk_trackers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    risk_detail TEXT,
    status VARCHAR(50),
    mitigation TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gauge_rnr_studies (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    conducted_by VARCHAR(255),
    study_date TIMESTAMP,
    result TEXT,
    is_acceptable BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibration_matrices (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    last_calibration TIMESTAMP,
    next_calibration TIMESTAMP,
    status VARCHAR(50),
    certificate_url VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE customer_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON customer_complaints;
CREATE POLICY tenant_isolation_policy ON customer_complaints USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE eight_d_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON eight_d_reports;
CREATE POLICY tenant_isolation_policy ON eight_d_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE apqp_gate_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_gate_reviews;
CREATE POLICY tenant_isolation_policy ON apqp_gate_reviews USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE open_risk_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON open_risk_trackers;
CREATE POLICY tenant_isolation_policy ON open_risk_trackers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE gauge_rnr_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnr_studies;
CREATE POLICY tenant_isolation_policy ON gauge_rnr_studies USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE calibration_matrices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON calibration_matrices;
CREATE POLICY tenant_isolation_policy ON calibration_matrices USING (tenant_id = current_setting('app.current_tenant', true));

