-- Revert Phase 2

-- Reverting users
ALTER TABLE users DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_users_deleted_by;

-- Reverting companies
ALTER TABLE companies DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_companies_deleted_by;

-- Reverting roles
ALTER TABLE roles DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_roles_deleted_by;

-- Reverting user_roles
ALTER TABLE user_roles DROP COLUMN IF EXISTS tenant_id;
DROP INDEX IF EXISTS idx_user_roles_tenant_id;

-- Reverting rfqs
ALTER TABLE rfqs DROP COLUMN IF EXISTS company_id;
ALTER TABLE rfqs DROP COLUMN IF EXISTS version;
DROP INDEX IF EXISTS idx_rfqs_company_id;

-- Reverting invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS company_id;
DROP INDEX IF EXISTS idx_invoices_company_id;

-- Reverting chart_of_accounts
ALTER TABLE chart_of_accounts DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_chart_of_accounts_deleted_by;

-- Reverting journal_entries
ALTER TABLE journal_entries DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_journal_entries_deleted_by;

-- Reverting journal_lines
ALTER TABLE journal_lines DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_journal_lines_deleted_by;

-- Reverting payment_receipts
ALTER TABLE payment_receipts DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_payment_receipts_deleted_by;

-- Reverting machines
ALTER TABLE machines DROP COLUMN IF EXISTS plant_id;
DROP INDEX IF EXISTS idx_machines_plant_id;

-- Reverting fais
ALTER TABLE fais DROP COLUMN IF EXISTS plant_id;
DROP INDEX IF EXISTS idx_fais_plant_id;

-- Reverting quotations
ALTER TABLE quotations DROP COLUMN IF EXISTS company_id;
ALTER TABLE quotations DROP COLUMN IF EXISTS version;
DROP INDEX IF EXISTS idx_quotations_company_id;

-- Reverting supplier_scorecards
ALTER TABLE supplier_scorecards DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_supplier_scorecards_deleted_by;

-- Reverting supplier_ncrs
ALTER TABLE supplier_ncrs DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_supplier_ncrs_deleted_by;

-- Reverting supplier_audits
ALTER TABLE supplier_audits DROP COLUMN IF EXISTS deleted_by;
DROP INDEX IF EXISTS idx_supplier_audits_deleted_by;

-- Reverting tool_assets
ALTER TABLE tool_assets DROP COLUMN IF EXISTS plant_id;
DROP INDEX IF EXISTS idx_tool_assets_plant_id;

