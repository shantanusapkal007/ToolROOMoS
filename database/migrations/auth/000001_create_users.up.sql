CREATE TABLE IF NOT EXISTS users (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_company ON users (company_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users (employee_code);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (refresh_token);


-- Postgres RLS Policies injected automatically
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON sessions;
CREATE POLICY tenant_isolation_policy ON sessions USING (tenant_id = current_setting('app.current_tenant', true));

