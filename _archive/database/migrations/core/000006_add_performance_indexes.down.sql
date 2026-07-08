-- Remove performance indexes

DROP INDEX IF EXISTS idx_ecn_requests_status;
DROP INDEX IF EXISTS idx_ecn_requests_company_id;

DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_audit_logs_company_id;

DROP INDEX IF EXISTS idx_plants_department_id;
DROP INDEX IF EXISTS idx_plants_company_id;
DROP INDEX IF EXISTS idx_departments_company_id;

DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_company_id;
