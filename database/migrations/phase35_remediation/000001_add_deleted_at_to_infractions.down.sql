DROP INDEX IF EXISTS idx_infractions_deleted_at;
ALTER TABLE infractions DROP COLUMN IF EXISTS deleted_at;
