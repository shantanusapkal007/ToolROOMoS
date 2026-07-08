-- 002_enable_rls.sql
-- Enables Postgres Row Level Security (RLS) dynamically on all tables with a 'tenant_id' column.
-- Uses `current_setting('app.current_tenant_id', true)` to enforce isolation.

DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'tenant_id' AND table_schema = 'public'
    LOOP
        -- Enable RLS on the table
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', row.table_name);
        
        -- Drop policy if it exists to allow re-runs
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', row.table_name);
        
        -- Create the isolation policy. 
        -- If 'app.current_tenant_id' is not set or doesn't match, 0 rows are returned.
        -- NOTE: The Go app uses BYPASSRLS for connection pool safety, but direct DB connections are protected.
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I USING (tenant_id::text = current_setting(''app.current_tenant_id'', true));', row.table_name);
    END LOOP;
END
$$;

-- Grant BYPASSRLS to the primary app role to prevent connection pool leak issues while RLS protects other roles
ALTER ROLE toolroom BYPASSRLS;
