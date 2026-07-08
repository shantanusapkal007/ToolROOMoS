-- Phase 2: Enterprise Field Standardization

-- Upgrading users
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);

-- Upgrading companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_companies_deleted_by ON companies(deleted_by);

-- Upgrading roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_roles_deleted_by ON roles(deleted_by);

-- Upgrading user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);

-- Upgrading rfqs
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_rfqs_company_id ON rfqs(company_id);

-- Upgrading invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_id UUID;
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);

-- Upgrading chart_of_accounts
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_deleted_by ON chart_of_accounts(deleted_by);

-- Upgrading journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_journal_entries_deleted_by ON journal_entries(deleted_by);

-- Upgrading journal_lines
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_journal_lines_deleted_by ON journal_lines(deleted_by);

-- Upgrading payment_receipts
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_payment_receipts_deleted_by ON payment_receipts(deleted_by);

-- Upgrading machines
ALTER TABLE machines ADD COLUMN IF NOT EXISTS plant_id UUID;
CREATE INDEX IF NOT EXISTS idx_machines_plant_id ON machines(plant_id);

-- Upgrading fais
ALTER TABLE fais ADD COLUMN IF NOT EXISTS plant_id UUID;
CREATE INDEX IF NOT EXISTS idx_fais_plant_id ON fais(plant_id);

-- Upgrading quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_quotations_company_id ON quotations(company_id);

-- Upgrading supplier_scorecards
ALTER TABLE supplier_scorecards ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_supplier_scorecards_deleted_by ON supplier_scorecards(deleted_by);

-- Upgrading supplier_ncrs
ALTER TABLE supplier_ncrs ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_supplier_ncrs_deleted_by ON supplier_ncrs(deleted_by);

-- Upgrading supplier_audits
ALTER TABLE supplier_audits ADD COLUMN IF NOT EXISTS deleted_by UUID;
CREATE INDEX IF NOT EXISTS idx_supplier_audits_deleted_by ON supplier_audits(deleted_by);

-- Upgrading tool_assets
ALTER TABLE tool_assets ADD COLUMN IF NOT EXISTS plant_id UUID;
CREATE INDEX IF NOT EXISTS idx_tool_assets_plant_id ON tool_assets(plant_id);

