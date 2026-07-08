CREATE TABLE IF NOT EXISTS travelers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES production_jobs(id),
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traveler_stages (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    traveler_id INT NOT NULL REFERENCES travelers(id),
    stage_name VARCHAR(100) NOT NULL,
    operator_id INT,
    machine_id UUID REFERENCES machines(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    digital_signature VARCHAR(255),
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS machine_capacities (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id),
    category VARCHAR(100) NOT NULL,
    max_hours_per_day NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_schedules (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id),
    job_id INT NOT NULL REFERENCES production_jobs(id),
    scheduled_date DATE NOT NULL,
    scheduled_hours NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON travelers;
CREATE POLICY tenant_isolation_policy ON travelers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE traveler_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON traveler_stages;
CREATE POLICY tenant_isolation_policy ON traveler_stages USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE machine_capacities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_capacities;
CREATE POLICY tenant_isolation_policy ON machine_capacities USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_schedules;
CREATE POLICY tenant_isolation_policy ON production_schedules USING (tenant_id = current_setting('app.current_tenant', true));

