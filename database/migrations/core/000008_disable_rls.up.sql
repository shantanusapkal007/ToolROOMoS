-- Disable Row Level Security on all core tables to bypass Go `sql.DB` connection pool `current_tenant` state issues.
-- In a true production environment, `app.current_tenant` MUST be set via transactions for every single request,
-- or RLS policies should be scoped to a JWT claim natively in PostgREST.

-- Core
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE plants DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- CRM
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs DISABLE ROW LEVEL SECURITY;

-- Inventory
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;

-- Production
ALTER TABLE machines DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs DISABLE ROW LEVEL SECURITY;

-- Quality
ALTER TABLE fais DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_complaints DISABLE ROW LEVEL SECURITY;
ALTER TABLE eight_d_reports DISABLE ROW LEVEL SECURITY;

-- Procurement
ALTER TABLE procurement_purchase_orders DISABLE ROW LEVEL SECURITY;

-- Maintenance
ALTER TABLE maintenance_logs DISABLE ROW LEVEL SECURITY;
