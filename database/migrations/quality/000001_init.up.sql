CREATE TABLE IF NOT EXISTS quality_pfmeas (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    process_step VARCHAR(255) NOT NULL,
    failure_mode VARCHAR(255) NOT NULL,
    severity INT NOT NULL,
    occurrence INT NOT NULL,
    detection INT NOT NULL,
    rpn INT NOT NULL,
    action_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_control_plans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    operation_number VARCHAR(100) NOT NULL,
    characteristic VARCHAR(255) NOT NULL,
    specification VARCHAR(255) NOT NULL,
    measurement_method VARCHAR(255) NOT NULL,
    sample_quantity INT NOT NULL,
    sample_frequency VARCHAR(100) NOT NULL,
    control_method VARCHAR(255) NOT NULL,
    reaction_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gauge_rnrs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    appraiser_count INT NOT NULL,
    trial_count INT NOT NULL,
    part_count INT NOT NULL,
    ev DOUBLE PRECISION NOT NULL,
    av DOUBLE PRECISION NOT NULL,
    rnr DOUBLE PRECISION NOT NULL,
    study_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fais (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    work_order_id UUID NOT NULL,
    inspector_id UUID NOT NULL,
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    result VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE quality_pfmeas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON quality_pfmeas;
CREATE POLICY tenant_isolation_policy ON quality_pfmeas USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE quality_control_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON quality_control_plans;
CREATE POLICY tenant_isolation_policy ON quality_control_plans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE gauge_rnrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnrs;
CREATE POLICY tenant_isolation_policy ON gauge_rnrs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE fais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON fais;
CREATE POLICY tenant_isolation_policy ON fais USING (tenant_id = current_setting('app.current_tenant', true));

