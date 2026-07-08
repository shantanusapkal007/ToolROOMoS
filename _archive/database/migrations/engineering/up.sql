CREATE TABLE IF NOT EXISTS engineering_tool_assets (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    asset_code VARCHAR(100),
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    location VARCHAR(255) DEFAULT 'Main Tool Room',
    expected_life_strokes INT,
    last_maintenance_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pfmeas (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255),
    process_step VARCHAR(255),
    failure_mode VARCHAR(255),
    severity INT,
    occurrence INT,
    detection INT,
    rpn INT,
    action_plan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS control_plans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(255),
    operation_number VARCHAR(100),
    characteristic VARCHAR(255),
    specification VARCHAR(255),
    measurement_method VARCHAR(255),
    sample_quantity INT,
    sample_frequency VARCHAR(255),
    control_method VARCHAR(255),
    reaction_plan VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ecns (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    ecn_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    part_number VARCHAR(255),
    change_type VARCHAR(100),
    status VARCHAR(100),
    requestor VARCHAR(255),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drawings (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    drawing_number VARCHAR(100),
    part_number VARCHAR(255),
    description VARCHAR(255),
    revision VARCHAR(50),
    status VARCHAR(50),
    format VARCHAR(50),
    author VARCHAR(255),
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mold_projects (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    code VARCHAR(100),
    category VARCHAR(100),
    designer VARCHAR(255),
    stage VARCHAR(100),
    progress INT,
    trials_run INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_tasks (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    project_code VARCHAR(100),
    task_id VARCHAR(50),
    name VARCHAR(255),
    owner VARCHAR(255),
    start_week DECIMAL,
    duration_weeks DECIMAL,
    progress INT,
    dependency VARCHAR(100),
    milestone BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE engineering_tool_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON engineering_tool_assets;
CREATE POLICY tenant_isolation_policy ON engineering_tool_assets USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE pfmeas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON pfmeas;
CREATE POLICY tenant_isolation_policy ON pfmeas USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE control_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON control_plans;
CREATE POLICY tenant_isolation_policy ON control_plans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE ecns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON ecns;
CREATE POLICY tenant_isolation_policy ON ecns USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON drawings;
CREATE POLICY tenant_isolation_policy ON drawings USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE mold_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON mold_projects;
CREATE POLICY tenant_isolation_policy ON mold_projects USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON project_tasks;
CREATE POLICY tenant_isolation_policy ON project_tasks USING (tenant_id = current_setting('app.current_tenant', true));

