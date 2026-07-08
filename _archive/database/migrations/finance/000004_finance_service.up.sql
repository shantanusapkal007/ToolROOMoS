CREATE TABLE IF NOT EXISTS finance_accounts (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_journal_entries (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_journal_lines (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES finance_journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES finance_accounts(id),
    debit NUMERIC(15,2) DEFAULT 0.00,
    credit NUMERIC(15,2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_projects (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    estimated_revenue NUMERIC(15, 2) NOT NULL,
    target_margin_percent NUMERIC(5, 2) NOT NULL,
    actual_material NUMERIC(15, 2) DEFAULT 0.00,
    actual_machine NUMERIC(15, 2) DEFAULT 0.00,
    actual_labor NUMERIC(15, 2) DEFAULT 0.00,
    actual_subcontracting NUMERIC(15, 2) DEFAULT 0.00,
    actual_overhead NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_copq_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(100) NOT NULL,
    material_loss NUMERIC(15, 2) DEFAULT 0.00,
    labor_loss NUMERIC(15, 2) DEFAULT 0.00,
    machine_loss NUMERIC(15, 2) DEFAULT 0.00,
    total_loss NUMERIC(15, 2) DEFAULT 0.00,
    date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_invoices (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS finance_expenses (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    vendor VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


-- Postgres RLS Policies injected automatically
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_accounts;
CREATE POLICY tenant_isolation_policy ON finance_accounts USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_journal_entries;
CREATE POLICY tenant_isolation_policy ON finance_journal_entries USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_journal_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_journal_lines;
CREATE POLICY tenant_isolation_policy ON finance_journal_lines USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_projects;
CREATE POLICY tenant_isolation_policy ON finance_projects USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_copq_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_copq_logs;
CREATE POLICY tenant_isolation_policy ON finance_copq_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_invoices;
CREATE POLICY tenant_isolation_policy ON finance_invoices USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_expenses;
CREATE POLICY tenant_isolation_policy ON finance_expenses USING (tenant_id = current_setting('app.current_tenant', true));

