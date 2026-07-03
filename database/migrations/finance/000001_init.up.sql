CREATE TABLE IF NOT EXISTS invoices (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client VARCHAR(255) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    gst NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Postgres RLS Policies injected automatically
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON invoices;
CREATE POLICY tenant_isolation_policy ON invoices USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON expenses;
CREATE POLICY tenant_isolation_policy ON expenses USING (tenant_id = current_setting('app.current_tenant', true));

