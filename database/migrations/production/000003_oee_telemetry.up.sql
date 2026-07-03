CREATE TABLE IF NOT EXISTS machine_telemetry_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id),
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oee_daily_metrics (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id),
    date VARCHAR(10) NOT NULL,
    availability NUMERIC(10,4) NOT NULL,
    performance NUMERIC(10,4) NOT NULL,
    quality NUMERIC(10,4) NOT NULL,
    oee_score NUMERIC(10,4) NOT NULL,
    planned_production_time NUMERIC(10,4) NOT NULL,
    operating_time NUMERIC(10,4) NOT NULL,
    total_pieces INT NOT NULL,
    good_pieces INT NOT NULL,
    ideal_run_rate NUMERIC(10,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE machine_telemetry_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_telemetry_logs;
CREATE POLICY tenant_isolation_policy ON machine_telemetry_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE oee_daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON oee_daily_metrics;
CREATE POLICY tenant_isolation_policy ON oee_daily_metrics USING (tenant_id = current_setting('app.current_tenant', true));

