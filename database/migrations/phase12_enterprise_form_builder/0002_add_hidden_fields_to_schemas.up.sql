ALTER TABLE entity_schemas ADD COLUMN IF NOT EXISTS hidden_fields JSONB DEFAULT '[]'::jsonb;
