ALTER TABLE expenses DROP COLUMN IF EXISTS status;

DROP TABLE IF EXISTS payment_receipts;
DROP TABLE IF EXISTS journal_lines;
DROP TABLE IF EXISTS journal_entries;
DROP TABLE IF EXISTS chart_of_accounts;
