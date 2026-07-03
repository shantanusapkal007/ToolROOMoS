-- Revert Phase 3: Referential Integrity
-- 1. Inventory & Traceability
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_item_id_fkey;
ALTER TABLE inventory_transactions ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES inventory_items(id);

ALTER TABLE traceability_logs DROP CONSTRAINT IF EXISTS traceability_logs_item_id_fkey;
ALTER TABLE traceability_logs ADD CONSTRAINT traceability_logs_item_id_fkey FOREIGN KEY (item_id) REFERENCES inventory_items(id);

ALTER TABLE material_test_reports DROP CONSTRAINT IF EXISTS material_test_reports_heat_number_id_fkey;
ALTER TABLE material_test_reports ADD CONSTRAINT material_test_reports_heat_number_id_fkey FOREIGN KEY (heat_number_id) REFERENCES material_heat_numbers(id);

-- 2. Production
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS production_jobs_machine_id_fkey;
ALTER TABLE production_jobs ADD CONSTRAINT production_jobs_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES machines(id);

ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS production_jobs_shift_id_fkey;
ALTER TABLE production_jobs ADD CONSTRAINT production_jobs_shift_id_fkey FOREIGN KEY (shift_id) REFERENCES shifts(id);

ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS downtime_logs_machine_id_fkey;
ALTER TABLE downtime_logs ADD CONSTRAINT downtime_logs_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES machines(id);

ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS downtime_logs_job_id_fkey;
ALTER TABLE downtime_logs ADD CONSTRAINT downtime_logs_job_id_fkey FOREIGN KEY (job_id) REFERENCES production_jobs(id);

ALTER TABLE traveler_steps DROP CONSTRAINT IF EXISTS traveler_steps_traveler_id_fkey;
ALTER TABLE traveler_steps ADD CONSTRAINT traveler_steps_traveler_id_fkey FOREIGN KEY (traveler_id) REFERENCES travelers(id);

ALTER TABLE machine_capacity_logs DROP CONSTRAINT IF EXISTS machine_capacity_logs_machine_id_fkey;
ALTER TABLE machine_capacity_logs ADD CONSTRAINT machine_capacity_logs_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES machines(id);

ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS machine_telemetry_logs_machine_id_fkey;
ALTER TABLE machine_telemetry_logs ADD CONSTRAINT machine_telemetry_logs_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES machines(id);

-- 3. Maintenance
ALTER TABLE maintenance_work_orders DROP CONSTRAINT IF EXISTS maintenance_work_orders_machine_id_fkey;
ALTER TABLE maintenance_work_orders ADD CONSTRAINT maintenance_work_orders_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES machines(id);

-- 4. HRMS
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS hrms_attendance_employee_id_fkey;
ALTER TABLE hrms_attendance ADD CONSTRAINT hrms_attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES hrms_employees(id);

ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS hrms_leaves_employee_id_fkey;
ALTER TABLE hrms_leaves ADD CONSTRAINT hrms_leaves_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES hrms_employees(id);

-- 5. Tooling
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS tooling_life_logs_asset_id_fkey;
ALTER TABLE tooling_life_logs ADD CONSTRAINT tooling_life_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES tool_assets(id);

ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS refurbishment_tickets_asset_id_fkey;
ALTER TABLE refurbishment_tickets ADD CONSTRAINT refurbishment_tickets_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES tool_assets(id);

ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS drawing_vault_documents_asset_id_fkey;
ALTER TABLE drawing_vault_documents ADD CONSTRAINT drawing_vault_documents_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES tool_assets(id);

-- 6. Shared & Workflow
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS workflow_history_step_id_fkey;
ALTER TABLE workflow_history ADD CONSTRAINT workflow_history_step_id_fkey FOREIGN KEY (step_id) REFERENCES workflow_steps(id);

ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS workflow_instances_current_step_id_fkey;
ALTER TABLE workflow_instances ADD CONSTRAINT workflow_instances_current_step_id_fkey FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id);

-- 7. Resolving Circular References
ALTER TABLE users ALTER CONSTRAINT IF EXISTS users_company_id_fkey NOT DEFERRABLE;
ALTER TABLE users ALTER CONSTRAINT IF EXISTS users_role_id_fkey NOT DEFERRABLE;
ALTER TABLE roles ALTER CONSTRAINT IF EXISTS roles_company_id_fkey NOT DEFERRABLE;
