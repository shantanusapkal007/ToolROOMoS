CREATE TABLE procurement_purchase_orders (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    item VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL,
    total_amount VARCHAR(100) NOT NULL,
    delivery_date VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE procurement_purchase_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON procurement_purchase_orders;
CREATE POLICY tenant_isolation_policy ON procurement_purchase_orders USING (tenant_id = current_setting('app.current_tenant', true));

