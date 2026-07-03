DROP TABLE IF EXISTS abc_analysis;
DROP TABLE IF EXISTS cycle_counts;
DROP TABLE IF EXISTS warehouses;

ALTER TABLE inventory_items DROP COLUMN IF EXISTS expiry_date;
