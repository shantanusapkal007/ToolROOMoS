CREATE TABLE IF NOT EXISTS hrms_employees (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    segment VARCHAR(255) NOT NULL,
    pay_grade VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    joining_date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hrms_tasks (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    segment VARCHAR(255) NOT NULL,
    assignee VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    due_date VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hrms_leaves (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES hrms_employees(id),
    type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    is_half_day BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hrms_attendance (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES hrms_employees(id),
    date DATE NOT NULL,
    clock_in VARCHAR(50),
    clock_out VARCHAR(50),
    total_hours VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE hrms_employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON hrms_employees;
CREATE POLICY tenant_isolation_policy ON hrms_employees USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE hrms_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON hrms_tasks;
CREATE POLICY tenant_isolation_policy ON hrms_tasks USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE hrms_leaves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON hrms_leaves;
CREATE POLICY tenant_isolation_policy ON hrms_leaves USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE hrms_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON hrms_attendance;
CREATE POLICY tenant_isolation_policy ON hrms_attendance USING (tenant_id = current_setting('app.current_tenant', true));

