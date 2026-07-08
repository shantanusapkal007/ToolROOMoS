CREATE TABLE IF NOT EXISTS shifts (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_jobs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    machine_id UUID NOT NULL REFERENCES machines(id),
    shift_id INT REFERENCES shifts(id),
    status VARCHAR(50) DEFAULT 'PLANNED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    quantity_produced INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS downtime_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id),
    job_id INT REFERENCES production_jobs(id),
    reason TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON shifts;
CREATE POLICY tenant_isolation_policy ON shifts USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_jobs;
CREATE POLICY tenant_isolation_policy ON production_jobs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE downtime_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON downtime_logs;
CREATE POLICY tenant_isolation_policy ON downtime_logs USING (tenant_id = current_setting('app.current_tenant', true));

