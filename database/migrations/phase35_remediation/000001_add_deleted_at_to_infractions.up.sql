ALTER TABLE infractions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_infractions_deleted_at ON infractions(deleted_at);
