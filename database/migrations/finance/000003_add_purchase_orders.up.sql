CREATE TABLE IF NOT EXISTS finance_purchase_orders (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    qty DECIMAL(10, 2) NOT NULL,
    total_amount VARCHAR(100) NOT NULL,
    delivery_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Postgres RLS Policies injected automatically
ALTER TABLE finance_purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_purchase_orders;
CREATE POLICY tenant_isolation_policy ON finance_purchase_orders USING (tenant_id = current_setting('app.current_tenant', true));

