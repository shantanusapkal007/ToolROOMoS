DO $$
DECLARE
    t_name text;
BEGIN
    FOR t_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != 'schema_migrations') LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);', t_name);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);', t_name);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;', t_name);
    END LOOP;
END;
$$;
