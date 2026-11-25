-- Make projectId optional on purchase_order_headers and goods_receipt_headers
-- Allows general stores, tooling consumables, and multi-project procurement without dummy project hacks
ALTER TABLE "purchase_order_headers" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "goods_receipt_headers" ALTER COLUMN "projectId" DROP NOT NULL;

-- Clean up any historical POs created from PRNs with no project to have projectId = NULL
UPDATE "purchase_order_headers"
SET "projectId" = NULL
WHERE "purchaseRequestId" IN (
  SELECT id FROM "purchase_request_headers" WHERE "projectId" IS NULL
);

-- Delete any dummy general projects that were previously created
DELETE FROM "projects" WHERE "projectNumber" IN ('GENERAL', 'GENERAL-STORES', 'KTD-GENERAL');
