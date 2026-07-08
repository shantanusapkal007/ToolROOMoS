CREATE TABLE IF NOT EXISTS inventory_delivery_challans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    challan_number VARCHAR(100) NOT NULL,
    client VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    vehicle_num VARCHAR(100) NOT NULL,
    dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Postgres RLS Policies injected automatically
ALTER TABLE inventory_delivery_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_delivery_challans;
CREATE POLICY tenant_isolation_policy ON inventory_delivery_challans USING (tenant_id = current_setting('app.current_tenant', true));

