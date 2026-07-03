CREATE TABLE IF NOT EXISTS rfqs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rfq_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    part_name VARCHAR(255) NOT NULL,
    estimated_value NUMERIC(12, 2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'rfq',
    priority VARCHAR(50) DEFAULT 'medium',
    days_left INT DEFAULT 14,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    draw_number VARCHAR(100),
    spec_notes TEXT
);

CREATE INDEX idx_rfqs_stage ON rfqs(stage);
CREATE INDEX idx_rfqs_customer_id ON rfqs(customer_id);


-- Postgres RLS Policies injected automatically
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON rfqs;
CREATE POLICY tenant_isolation_policy ON rfqs USING (tenant_id = current_setting('app.current_tenant', true));

