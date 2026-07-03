CREATE TABLE IF NOT EXISTS workflow_definitions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    module VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_steps (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_required VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_instances (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    target_entity_id VARCHAR(100) NOT NULL,
    current_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    status VARCHAR(50) NOT NULL,
    initiator_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_history (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id),
    actor_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    comments TEXT,
    action_date TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Postgres RLS Policies injected automatically
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON workflow_definitions;
CREATE POLICY tenant_isolation_policy ON workflow_definitions USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON workflow_steps;
CREATE POLICY tenant_isolation_policy ON workflow_steps USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON workflow_instances;
CREATE POLICY tenant_isolation_policy ON workflow_instances USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE workflow_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON workflow_history;
CREATE POLICY tenant_isolation_policy ON workflow_history USING (tenant_id = current_setting('app.current_tenant', true));

