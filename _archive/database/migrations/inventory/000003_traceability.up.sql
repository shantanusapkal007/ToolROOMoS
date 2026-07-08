CREATE TABLE IF NOT EXISTS material_heat_numbers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL,
    heat_number VARCHAR(100) NOT NULL,
    supplier_po VARCHAR(100),
    received_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS material_certificates (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    heat_number_id VARCHAR(36) NOT NULL,
    certificate_url VARCHAR(255),
    chemical_properties TEXT,
    mechanical_properties TEXT,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (heat_number_id) REFERENCES material_heat_numbers(id)
);


-- Postgres RLS Policies injected automatically
ALTER TABLE material_heat_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_heat_numbers;
CREATE POLICY tenant_isolation_policy ON material_heat_numbers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE material_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certificates;
CREATE POLICY tenant_isolation_policy ON material_certificates USING (tenant_id = current_setting('app.current_tenant', true));

