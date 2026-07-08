-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seed company
INSERT INTO companies (id, name, code, gst_number, pan_number, address, city, state, country, pincode, phone, email, website, logo_url, settings, status)
VALUES ('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'ToolRoom Inc.', 'TR-INC', '27AAAAA1111A1Z1', 'AAAAA1111A', '123 Industrial Area', 'Pune', 'Maharashtra', 'India', '411018', '020-123456', 'contact@toolroom.com', 'www.toolroom.com', '', '{}', 'active')
ON CONFLICT (code) DO NOTHING;

-- Seed plant
INSERT INTO plants (id, company_id, name, code, location, address)
VALUES ('b8c4c1e4-cfef-4c6e-8d59-3fb182ea8d88', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Main Plant', 'PL-MAIN', 'Building A', '123 Industrial Area')
ON CONFLICT (company_id, code) DO NOTHING;

-- Seed department
INSERT INTO departments (id, plant_id, company_id, name, code)
VALUES ('f7be3c41-86ea-45a2-850f-2b2165cd819a', 'b8c4c1e4-cfef-4c6e-8d59-3fb182ea8d88', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Tool Room', 'DEPT-TR')
ON CONFLICT (plant_id, code) DO NOTHING;

-- Seed roles
INSERT INTO roles (id, company_id, name, slug, description, hierarchy_level, is_system_role) VALUES
('d6b5e3c1-cf8d-4e92-baef-c21d8b7364cf', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Super Admin', 'super_admin', 'Full system access', 100, TRUE),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Admin', 'admin', 'Company administrator', 90, TRUE),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'CRM Manager', 'crm_manager', 'CRM manager access', 80, TRUE),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Tool Room Manager', 'tool_room_manager', 'Tool room manager access', 80, TRUE),
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Design Engineer', 'design_engineer', 'Design engineer access', 70, TRUE),
('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'APQP Coordinator', 'apqp_coordinator', 'APQP coordinator access', 70, TRUE),
('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Production Manager', 'production_manager', 'Production manager access', 80, TRUE),
('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d', '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Quality Manager', 'quality_manager', 'Quality manager access', 80, TRUE)
ON CONFLICT (company_id, slug) DO NOTHING;

-- Seed modules
INSERT INTO modules (id, name, slug, icon, description, sort_order, is_active) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'CRM', 'crm', 'Users', 'Customer relationship management', 1, TRUE),
('2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', 'Quotation', 'quotation', 'DollarSign', 'RFQ and quotation management', 2, TRUE),
('3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'APQP', 'apqp', 'FileText', 'Advanced Product Quality Planning', 3, TRUE),
('4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Tool Development', 'tool_development', 'Cpu', 'Tool and mold design and development', 4, TRUE),
('5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'Procurement', 'procurement', 'ShoppingCart', 'Purchase orders and vendor management', 5, TRUE),
('6f7a8b9c-0d1e-2f3a-4b5c-6d7e8f9a0b1c', 'Inventory', 'inventory', 'Archive', 'Inventory and warehouse control', 6, TRUE),
('7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d', 'Production', 'production', 'Activity', 'Shop floor scheduling and execution', 7, TRUE),
('8b9c0d1e-2f3a-4b5c-6d7e-8f9a0b1c2d3e', 'Quality', 'quality', 'CheckCircle', 'FAI, PPAP, and quality control checks', 8, TRUE),
('9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f', 'Maintenance', 'maintenance', 'Settings', 'Preventive and breakdown maintenance', 9, TRUE),
('0d1e2f3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a', 'Dispatch', 'dispatch', 'Truck', 'Dispatch and logistics', 10, TRUE),
('1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b', 'HRMS', 'hrms', 'Users', 'Human resource management', 11, TRUE),
('2f3a4b5c-6d7e-8f9a-0b1c-2d3e4f5a6b7c', 'Finance', 'finance', 'Briefcase', 'Financial accounting and costing', 12, TRUE),
('3a4b5c6d-7e8f-9a0b-1c2d-3e4f5a6b7c8d', 'Analytics', 'analytics', 'BarChart2', 'ERP dashboards and reports', 13, TRUE),
('4b5c6d7e-8f9a-0b1c-2d3e-4f5a6b7c8d9e', 'Admin', 'admin', 'Shield', 'System settings and configurations', 14, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Seed permissions for each module dynamically
INSERT INTO permissions (id, module_id, action, resource, description)
SELECT
    gen_random_uuid(),
    m.id,
    a.action,
    m.slug || ':' || a.action,
    'Allows ' || a.action || ' on ' || m.name
FROM modules m
CROSS JOIN (
    VALUES ('read'), ('create'), ('update'), ('delete'), ('approve'), ('export')
) AS a(action)
ON CONFLICT (module_id, action, resource) DO NOTHING;

-- User and role mapping moved to global_seeder.sql
