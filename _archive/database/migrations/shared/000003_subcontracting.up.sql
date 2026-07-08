-- Subcontracting Schema
CREATE TABLE IF NOT EXISTS job_work_challans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challan_number VARCHAR(100) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL,
    process VARCHAR(100) NOT NULL,
    project_id VARCHAR(100) NOT NULL,
    part_details TEXT NOT NULL,
    qty_sent INT NOT NULL DEFAULT 0,
    qty_received INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    expected_eta TIMESTAMP WITH TIME ZONE,
    issued_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS vendor_quality_scores (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    vendor_id UUID PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    total_jobs INT DEFAULT 0,
    on_time_delivery_pct NUMERIC(5, 2) DEFAULT 0.00,
    quality_acceptance_pct NUMERIC(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attach the automated Global Audit Trail trigger to our new tables
SELECT attach_audit_trigger('job_work_challans');
SELECT attach_audit_trigger('vendor_quality_scores');


-- Postgres RLS Policies injected automatically
ALTER TABLE job_work_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON job_work_challans;
CREATE POLICY tenant_isolation_policy ON job_work_challans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE vendor_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON vendor_quality_scores;
CREATE POLICY tenant_isolation_policy ON vendor_quality_scores USING (tenant_id = current_setting('app.current_tenant', true));

