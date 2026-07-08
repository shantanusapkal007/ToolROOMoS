CREATE TABLE IF NOT EXISTS companies (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    website VARCHAR(255),
    logo_url VARCHAR(255),
    settings JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS plants (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plant_code UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_dept_code UNIQUE (plant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_companies_code ON companies (code);
CREATE INDEX IF NOT EXISTS idx_plants_company ON plants (company_id);
CREATE INDEX IF NOT EXISTS idx_departments_plant ON departments (plant_id);


-- Postgres RLS Policies injected automatically
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON companies;
CREATE POLICY tenant_isolation_policy ON companies USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON plants;
CREATE POLICY tenant_isolation_policy ON plants USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON departments;
CREATE POLICY tenant_isolation_policy ON departments USING (tenant_id = current_setting('app.current_tenant', true));

