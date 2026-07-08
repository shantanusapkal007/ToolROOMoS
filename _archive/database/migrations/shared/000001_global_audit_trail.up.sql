-- Create the global audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(255) NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID, -- Set via app.current_user_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the PL/pgSQL function that acts as the trigger
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    v_old_data JSONB;
    v_new_data JSONB;
BEGIN
    -- Attempt to get the user ID from the session variable (set by Go application)
    BEGIN
        current_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        
        -- Insert audit log for UPDATE
        INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME::text, NEW.id::text, TG_OP, v_old_data, v_new_data, current_user_id);
        
        RETURN NEW;
        
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        
        -- Insert audit log for DELETE
        INSERT INTO audit_logs (table_name, record_id, action, old_data, changed_by)
        VALUES (TG_TABLE_NAME::text, OLD.id::text, TG_OP, v_old_data, current_user_id);
        
        RETURN OLD;
        
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        
        -- Insert audit log for INSERT
        INSERT INTO audit_logs (table_name, record_id, action, new_data, changed_by)
        VALUES (TG_TABLE_NAME::text, NEW.id::text, TG_OP, v_new_data, current_user_id);
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Helper function to attach the trigger to a table easily
CREATE OR REPLACE FUNCTION attach_audit_trigger(target_table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER audit_trigger_%I 
         AFTER INSERT OR UPDATE OR DELETE ON %I 
         FOR EACH ROW EXECUTE FUNCTION process_audit_log();', 
         target_table_name, target_table_name
    );
END;
$$ LANGUAGE plpgsql;


-- Postgres RLS Policies injected automatically
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON audit_logs;
CREATE POLICY tenant_isolation_policy ON audit_logs USING (tenant_id = current_setting('app.current_tenant', true));

