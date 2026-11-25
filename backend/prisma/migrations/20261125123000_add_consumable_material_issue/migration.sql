-- Make projectId optional on material_issue_headers and add operator/machine targeting for consumables
ALTER TABLE "material_issue_headers" ALTER COLUMN "projectId" DROP NOT NULL;

ALTER TABLE "material_issue_headers"
  ADD COLUMN IF NOT EXISTS "issueType" TEXT NOT NULL DEFAULT 'PROJECT',
  ADD COLUMN IF NOT EXISTS "issuedToEmployeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "issuedToMachineId" TEXT;

CREATE INDEX IF NOT EXISTS "material_issue_headers_issuedToEmployeeId_idx"
  ON "material_issue_headers"("issuedToEmployeeId");

CREATE INDEX IF NOT EXISTS "material_issue_headers_issuedToMachineId_idx"
  ON "material_issue_headers"("issuedToMachineId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_issue_headers_issuedToEmployeeId_fkey') THEN
    ALTER TABLE "material_issue_headers"
      ADD CONSTRAINT "material_issue_headers_issuedToEmployeeId_fkey"
      FOREIGN KEY ("issuedToEmployeeId") REFERENCES "employees"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_issue_headers_issuedToMachineId_fkey') THEN
    ALTER TABLE "material_issue_headers"
      ADD CONSTRAINT "material_issue_headers_issuedToMachineId_fkey"
      FOREIGN KEY ("issuedToMachineId") REFERENCES "machines"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
