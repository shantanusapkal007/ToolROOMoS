-- DOWN MIGRATION: Remove composite indexes on (tenant_id, deleted_at)

DO $$ 
DECLARE 
    r RECORD;
    idx_name TEXT;
BEGIN
    FOR r IN 
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.columns c2 ON c.table_name = c2.table_name
        WHERE c.table_schema = 'public' 
        AND c.column_name = 'tenant_id'
        AND c2.column_name = 'deleted_at'
        AND c.table_name NOT LIKE 'pg_%'
        AND c.table_name NOT LIKE 'sql_%'
    LOOP
        idx_name := 'idx_' || r.table_name || '_tenant_deleted';
        
        -- Check if index exists
        IF EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = idx_name AND n.nspname = 'public'
        ) THEN
            EXECUTE 'DROP INDEX ' || idx_name;
            RAISE NOTICE 'Dropped index %', idx_name;
        END IF;
    END LOOP;
END $$;
