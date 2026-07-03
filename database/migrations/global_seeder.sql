-- Default System Seed Data

-- 1. Create Default Company (to act as the default tenant representation for users)
INSERT INTO companies (id, tenant_id, name, code, email, status, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000000', 'default-tenant', 'ToolRoom Default Company', 'TRC-01', 'admin@toolroom.local', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Default Admin User (admin@toolroom.com, password: Admin@123456)
INSERT INTO users (id, tenant_id, company_id, email, password_hash, first_name, last_name, employee_code, phone, avatar_url, status, created_at, updated_at)
VALUES ('a0f7e1b5-8fe9-4e52-baef-3c2d8b76a143', 'default-tenant', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'admin@toolroom.com', '$2a$12$R9h/lIPzMRF.7VpxvEw8Se.X.Lg1B56aK9fVwBwKqN/6Hec/H0yTq', 'System', 'Administrator', 'EMP-001', '9876543210', '', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;

-- 3. Assign Default Roles
INSERT INTO user_roles (user_id, role_id)
VALUES ('a0f7e1b5-8fe9-4e52-baef-3c2d8b76a143', 'd6b5e3c1-cf8d-4e92-baef-c21d8b7364cf')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Commit the global seeder transaction
COMMIT;

-- Seed mock audit logs for timeline demo
BEGIN;
INSERT INTO audit_logs (id, tenant_id, user_id, resource, entity_id, action, old_value, new_value, created_at, created_by, updated_by)
VALUES
('11111111-1111-1111-1111-111111111111', 'default-tenant', NULL, 'machine', 'VMC-01', 'Shift Started', '{}', '{"status":"active"}', NOW() - INTERVAL '2 hours', NULL, NULL),
('22222222-2222-2222-2222-222222222222', 'default-tenant', NULL, 'machine', 'VMC-01', 'Tool Replaced', '{"toolWear":"85%"}', '{"toolWear":"0%"}', NOW() - INTERVAL '1 hour', NULL, NULL),
('33333333-3333-3333-3333-333333333333', 'default-tenant', NULL, 'production_run', 'JOB-2026-X', 'Run Dispatched', '{}', '{"targetCycles": 500}', NOW() - INTERVAL '30 minutes', NULL, NULL),
('44444444-4444-4444-4444-444444444444', 'default-tenant', NULL, 'production_run', 'JOB-2026-X', 'Operator Assigned', '{}', '{"operator":"OP-024"}', NOW() - INTERVAL '25 minutes', NULL, NULL)
ON CONFLICT DO NOTHING;
COMMIT;

-- 4. Link all permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd6b5e3c1-cf8d-4e92-baef-c21d8b7364cf', id FROM permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;
