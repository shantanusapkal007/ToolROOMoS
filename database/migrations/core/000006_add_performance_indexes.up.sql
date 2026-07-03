-- Add B-Tree indexes for frequently queried foreign keys and status fields

-- Core Domain Indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_plants_company_id ON plants(company_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(resource, entity_id);

CREATE INDEX IF NOT EXISTS idx_ecn_requests_company_id ON change_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_ecn_requests_status ON change_requests(status);
