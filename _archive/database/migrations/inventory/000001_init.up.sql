CREATE TABLE IF NOT EXISTS inventory_items (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0.0,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15, 4) NOT NULL DEFAULT 0.0,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL REFERENCES inventory_items(id),
    type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT
    quantity DECIMAL(15, 4) NOT NULL,
    reference_type VARCHAR(50), -- e.g., PURCHASE_ORDER, WORK_ORDER
    reference_id VARCHAR(36),
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX idx_stock_tx_item ON stock_transactions(item_id);


-- Postgres RLS Policies injected automatically
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_items;
CREATE POLICY tenant_isolation_policy ON inventory_items USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON stock_transactions;
CREATE POLICY tenant_isolation_policy ON stock_transactions USING (tenant_id = current_setting('app.current_tenant', true));

