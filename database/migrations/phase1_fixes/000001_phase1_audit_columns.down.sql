-- Revert fixes for analytics_kpis
ALTER TABLE analytics_kpis DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE analytics_kpis DROP COLUMN IF EXISTS created_by;
ALTER TABLE analytics_kpis DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_analytics_kpis_deleted_at;

-- Revert fixes for analytics_revenue
ALTER TABLE analytics_revenue DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE analytics_revenue DROP COLUMN IF EXISTS created_by;
ALTER TABLE analytics_revenue DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_analytics_revenue_deleted_at;

-- Revert fixes for analytics_machine_utilization
ALTER TABLE analytics_machine_utilization DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE analytics_machine_utilization DROP COLUMN IF EXISTS created_by;
ALTER TABLE analytics_machine_utilization DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_analytics_machine_utilization_deleted_at;

-- Revert fixes for analytics_vendor_defects
ALTER TABLE analytics_vendor_defects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE analytics_vendor_defects DROP COLUMN IF EXISTS created_by;
ALTER TABLE analytics_vendor_defects DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_analytics_vendor_defects_deleted_at;

-- Revert fixes for users
ALTER TABLE users DROP COLUMN IF EXISTS created_by;
ALTER TABLE users DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for sessions
ALTER TABLE sessions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE sessions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE sessions DROP COLUMN IF EXISTS created_by;
ALTER TABLE sessions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_sessions_deleted_at;

-- Revert fixes for auth_attendance
ALTER TABLE auth_attendance DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE auth_attendance DROP COLUMN IF EXISTS created_by;
ALTER TABLE auth_attendance DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_auth_attendance_deleted_at;

-- Revert fixes for companies
ALTER TABLE companies DROP COLUMN IF EXISTS created_by;
ALTER TABLE companies DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for plants
ALTER TABLE plants DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE plants DROP COLUMN IF EXISTS created_by;
ALTER TABLE plants DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_plants_deleted_at;

-- Revert fixes for departments
ALTER TABLE departments DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE departments DROP COLUMN IF EXISTS created_by;
ALTER TABLE departments DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_departments_deleted_at;

-- Revert fixes for modules
ALTER TABLE modules DROP COLUMN IF EXISTS created_at;
ALTER TABLE modules DROP COLUMN IF EXISTS updated_at;
ALTER TABLE modules DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE modules DROP COLUMN IF EXISTS created_by;
ALTER TABLE modules DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_modules_deleted_at;

-- Revert fixes for permissions
ALTER TABLE permissions DROP COLUMN IF EXISTS created_at;
ALTER TABLE permissions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE permissions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE permissions DROP COLUMN IF EXISTS created_by;
ALTER TABLE permissions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_permissions_deleted_at;

-- Revert fixes for roles
ALTER TABLE roles DROP COLUMN IF EXISTS created_by;
ALTER TABLE roles DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for user_roles
ALTER TABLE user_roles DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE user_roles DROP COLUMN IF EXISTS created_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS updated_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE user_roles DROP COLUMN IF EXISTS created_by;
ALTER TABLE user_roles DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_user_roles_tenant_id;
DROP INDEX IF EXISTS idx_user_roles_deleted_at;

-- Revert fixes for role_permissions
ALTER TABLE role_permissions DROP COLUMN IF EXISTS created_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS created_by;
ALTER TABLE role_permissions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_role_permissions_deleted_at;

-- Revert fixes for audit_logs
ALTER TABLE audit_logs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_audit_logs_deleted_at;

-- Revert fixes for change_requests
ALTER TABLE change_requests DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE change_requests DROP COLUMN IF EXISTS created_by;
ALTER TABLE change_requests DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_change_requests_deleted_at;

-- Revert fixes for change_impact_analyses
ALTER TABLE change_impact_analyses DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE change_impact_analyses DROP COLUMN IF EXISTS created_by;
ALTER TABLE change_impact_analyses DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_change_impact_analyses_deleted_at;

-- Revert fixes for change_notices
ALTER TABLE change_notices DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE change_notices DROP COLUMN IF EXISTS created_by;
ALTER TABLE change_notices DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_change_notices_deleted_at;

-- Revert fixes for customers
ALTER TABLE customers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE customers DROP COLUMN IF EXISTS created_by;
ALTER TABLE customers DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_customers_deleted_at;

-- Revert fixes for contacts
ALTER TABLE contacts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE contacts DROP COLUMN IF EXISTS created_by;
ALTER TABLE contacts DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_contacts_deleted_at;

-- Revert fixes for rfqs
ALTER TABLE rfqs DROP COLUMN IF EXISTS created_at;
ALTER TABLE rfqs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE rfqs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE rfqs DROP COLUMN IF EXISTS created_by;
ALTER TABLE rfqs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_rfqs_deleted_at;

-- Revert fixes for invoices
ALTER TABLE invoices DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE invoices DROP COLUMN IF EXISTS created_by;
ALTER TABLE invoices DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_invoices_deleted_at;

-- Revert fixes for expenses
ALTER TABLE expenses DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE expenses DROP COLUMN IF EXISTS created_by;
ALTER TABLE expenses DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_expenses_deleted_at;

-- Revert fixes for copq_logs
ALTER TABLE copq_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE copq_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE copq_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_copq_logs_deleted_at;

-- Revert fixes for chart_of_accounts
ALTER TABLE chart_of_accounts DROP COLUMN IF EXISTS created_by;
ALTER TABLE chart_of_accounts DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for journal_entries
ALTER TABLE journal_entries DROP COLUMN IF EXISTS created_by;
ALTER TABLE journal_entries DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for journal_lines
ALTER TABLE journal_lines DROP COLUMN IF EXISTS created_by;
ALTER TABLE journal_lines DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for payment_receipts
ALTER TABLE payment_receipts DROP COLUMN IF EXISTS created_by;
ALTER TABLE payment_receipts DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for finance_purchase_orders
ALTER TABLE finance_purchase_orders DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_purchase_orders DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_purchase_orders DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_purchase_orders_deleted_at;

-- Revert fixes for finance_accounts
ALTER TABLE finance_accounts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_accounts DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_accounts DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_accounts_deleted_at;

-- Revert fixes for finance_journal_entries
ALTER TABLE finance_journal_entries DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_journal_entries DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_journal_entries DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_journal_entries_deleted_at;

-- Revert fixes for finance_journal_lines
ALTER TABLE finance_journal_lines DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_journal_lines DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_journal_lines DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_journal_lines_deleted_at;

-- Revert fixes for finance_projects
ALTER TABLE finance_projects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_projects DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_projects DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_projects_deleted_at;

-- Revert fixes for finance_copq_logs
ALTER TABLE finance_copq_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_copq_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_copq_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_copq_logs_deleted_at;

-- Revert fixes for finance_invoices
ALTER TABLE finance_invoices DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_invoices DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_invoices DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_invoices_deleted_at;

-- Revert fixes for finance_expenses
ALTER TABLE finance_expenses DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE finance_expenses DROP COLUMN IF EXISTS created_by;
ALTER TABLE finance_expenses DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_finance_expenses_deleted_at;

-- Revert fixes for hrms_employees
ALTER TABLE hrms_employees DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE hrms_employees DROP COLUMN IF EXISTS created_by;
ALTER TABLE hrms_employees DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_hrms_employees_deleted_at;

-- Revert fixes for hrms_tasks
ALTER TABLE hrms_tasks DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE hrms_tasks DROP COLUMN IF EXISTS created_by;
ALTER TABLE hrms_tasks DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_hrms_tasks_deleted_at;

-- Revert fixes for hrms_leaves
ALTER TABLE hrms_leaves DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE hrms_leaves DROP COLUMN IF EXISTS created_by;
ALTER TABLE hrms_leaves DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_hrms_leaves_deleted_at;

-- Revert fixes for hrms_attendance
ALTER TABLE hrms_attendance DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE hrms_attendance DROP COLUMN IF EXISTS created_by;
ALTER TABLE hrms_attendance DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_hrms_attendance_deleted_at;

-- Revert fixes for inventory_items
ALTER TABLE inventory_items DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS created_by;
ALTER TABLE inventory_items DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_inventory_items_deleted_at;

-- Revert fixes for stock_transactions
ALTER TABLE stock_transactions DROP COLUMN IF EXISTS updated_at;
ALTER TABLE stock_transactions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE stock_transactions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_stock_transactions_deleted_at;

-- Revert fixes for inventory_delivery_challans
ALTER TABLE inventory_delivery_challans DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE inventory_delivery_challans DROP COLUMN IF EXISTS created_by;
ALTER TABLE inventory_delivery_challans DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_inventory_delivery_challans_deleted_at;

-- Revert fixes for warehouses
ALTER TABLE warehouses DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE warehouses DROP COLUMN IF EXISTS created_by;
ALTER TABLE warehouses DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_warehouses_deleted_at;

-- Revert fixes for cycle_counts
ALTER TABLE cycle_counts DROP COLUMN IF EXISTS updated_at;
ALTER TABLE cycle_counts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE cycle_counts DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_cycle_counts_deleted_at;

-- Revert fixes for abc_analysis
ALTER TABLE abc_analysis DROP COLUMN IF EXISTS created_at;
ALTER TABLE abc_analysis DROP COLUMN IF EXISTS updated_at;
ALTER TABLE abc_analysis DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE abc_analysis DROP COLUMN IF EXISTS created_by;
ALTER TABLE abc_analysis DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_abc_analysis_deleted_at;

-- Revert fixes for material_heat_numbers
ALTER TABLE material_heat_numbers DROP COLUMN IF EXISTS updated_at;
ALTER TABLE material_heat_numbers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE material_heat_numbers DROP COLUMN IF EXISTS created_by;
ALTER TABLE material_heat_numbers DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_material_heat_numbers_deleted_at;

-- Revert fixes for material_certificates
ALTER TABLE material_certificates DROP COLUMN IF EXISTS updated_at;
ALTER TABLE material_certificates DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE material_certificates DROP COLUMN IF EXISTS created_by;
ALTER TABLE material_certificates DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_material_certificates_deleted_at;

-- Revert fixes for machines
ALTER TABLE machines DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE machines DROP COLUMN IF EXISTS created_by;
ALTER TABLE machines DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_machines_deleted_at;

-- Revert fixes for maintenance_logs
ALTER TABLE maintenance_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE maintenance_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE maintenance_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_maintenance_logs_deleted_at;

-- Revert fixes for preventive_maintenance_schedules
ALTER TABLE preventive_maintenance_schedules DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE preventive_maintenance_schedules DROP COLUMN IF EXISTS created_by;
ALTER TABLE preventive_maintenance_schedules DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_preventive_maintenance_schedules_deleted_at;

-- Revert fixes for machine_telemetry_logs
ALTER TABLE machine_telemetry_logs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE machine_telemetry_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE machine_telemetry_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE machine_telemetry_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_machine_telemetry_logs_deleted_at;

-- Revert fixes for shifts
ALTER TABLE shifts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE shifts DROP COLUMN IF EXISTS created_by;
ALTER TABLE shifts DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_shifts_deleted_at;

-- Revert fixes for production_jobs
ALTER TABLE production_jobs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE production_jobs DROP COLUMN IF EXISTS created_by;
ALTER TABLE production_jobs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_production_jobs_deleted_at;

-- Revert fixes for downtime_logs
ALTER TABLE downtime_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE downtime_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE downtime_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_downtime_logs_deleted_at;

-- Revert fixes for travelers
ALTER TABLE travelers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE travelers DROP COLUMN IF EXISTS created_by;
ALTER TABLE travelers DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_travelers_deleted_at;

-- Revert fixes for traveler_stages
ALTER TABLE traveler_stages DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE traveler_stages DROP COLUMN IF EXISTS created_by;
ALTER TABLE traveler_stages DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_traveler_stages_deleted_at;

-- Revert fixes for machine_capacities
ALTER TABLE machine_capacities DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE machine_capacities DROP COLUMN IF EXISTS created_by;
ALTER TABLE machine_capacities DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_machine_capacities_deleted_at;

-- Revert fixes for production_schedules
ALTER TABLE production_schedules DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE production_schedules DROP COLUMN IF EXISTS created_by;
ALTER TABLE production_schedules DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_production_schedules_deleted_at;

-- Revert fixes for oee_daily_metrics
ALTER TABLE oee_daily_metrics DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE oee_daily_metrics DROP COLUMN IF EXISTS created_by;
ALTER TABLE oee_daily_metrics DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_oee_daily_metrics_deleted_at;

-- Revert fixes for quality_pfmeas
ALTER TABLE quality_pfmeas DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE quality_pfmeas DROP COLUMN IF EXISTS created_by;
ALTER TABLE quality_pfmeas DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_quality_pfmeas_deleted_at;

-- Revert fixes for quality_control_plans
ALTER TABLE quality_control_plans DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE quality_control_plans DROP COLUMN IF EXISTS created_by;
ALTER TABLE quality_control_plans DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_quality_control_plans_deleted_at;

-- Revert fixes for gauge_rnrs
ALTER TABLE gauge_rnrs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE gauge_rnrs DROP COLUMN IF EXISTS created_by;
ALTER TABLE gauge_rnrs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_gauge_rnrs_deleted_at;

-- Revert fixes for fais
ALTER TABLE fais DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE fais DROP COLUMN IF EXISTS created_by;
ALTER TABLE fais DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_fais_deleted_at;

-- Revert fixes for ppap_submissions
ALTER TABLE ppap_submissions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE ppap_submissions DROP COLUMN IF EXISTS created_by;
ALTER TABLE ppap_submissions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_ppap_submissions_deleted_at;

-- Revert fixes for dimensional_reports
ALTER TABLE dimensional_reports DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE dimensional_reports DROP COLUMN IF EXISTS created_by;
ALTER TABLE dimensional_reports DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_dimensional_reports_deleted_at;

-- Revert fixes for material_certifications
ALTER TABLE material_certifications DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE material_certifications DROP COLUMN IF EXISTS created_by;
ALTER TABLE material_certifications DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_material_certifications_deleted_at;

-- Revert fixes for capability_reports
ALTER TABLE capability_reports DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE capability_reports DROP COLUMN IF EXISTS created_by;
ALTER TABLE capability_reports DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_capability_reports_deleted_at;

-- Revert fixes for appearance_approval_reports
ALTER TABLE appearance_approval_reports DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE appearance_approval_reports DROP COLUMN IF EXISTS created_by;
ALTER TABLE appearance_approval_reports DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_appearance_approval_reports_deleted_at;

-- Revert fixes for process_flow_diagrams
ALTER TABLE process_flow_diagrams DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE process_flow_diagrams DROP COLUMN IF EXISTS created_by;
ALTER TABLE process_flow_diagrams DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_process_flow_diagrams_deleted_at;

-- Revert fixes for psws
ALTER TABLE psws DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE psws DROP COLUMN IF EXISTS created_by;
ALTER TABLE psws DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_psws_deleted_at;

-- Revert fixes for customer_complaints
ALTER TABLE customer_complaints DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE customer_complaints DROP COLUMN IF EXISTS created_by;
ALTER TABLE customer_complaints DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_customer_complaints_deleted_at;

-- Revert fixes for eight_d_reports
ALTER TABLE eight_d_reports DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE eight_d_reports DROP COLUMN IF EXISTS created_by;
ALTER TABLE eight_d_reports DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_eight_d_reports_deleted_at;

-- Revert fixes for apqp_gate_reviews
ALTER TABLE apqp_gate_reviews DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE apqp_gate_reviews DROP COLUMN IF EXISTS created_by;
ALTER TABLE apqp_gate_reviews DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_apqp_gate_reviews_deleted_at;

-- Revert fixes for open_risk_trackers
ALTER TABLE open_risk_trackers DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE open_risk_trackers DROP COLUMN IF EXISTS created_by;
ALTER TABLE open_risk_trackers DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_open_risk_trackers_deleted_at;

-- Revert fixes for gauge_rnr_studies
ALTER TABLE gauge_rnr_studies DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE gauge_rnr_studies DROP COLUMN IF EXISTS created_by;
ALTER TABLE gauge_rnr_studies DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_gauge_rnr_studies_deleted_at;

-- Revert fixes for calibration_matrices
ALTER TABLE calibration_matrices DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE calibration_matrices DROP COLUMN IF EXISTS created_by;
ALTER TABLE calibration_matrices DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_calibration_matrices_deleted_at;

-- Revert fixes for apqp_project_timelines
ALTER TABLE apqp_project_timelines DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE apqp_project_timelines DROP COLUMN IF EXISTS created_by;
ALTER TABLE apqp_project_timelines DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_apqp_project_timelines_deleted_at;

-- Revert fixes for apqp_milestones
ALTER TABLE apqp_milestones DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE apqp_milestones DROP COLUMN IF EXISTS created_by;
ALTER TABLE apqp_milestones DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_apqp_milestones_deleted_at;

-- Revert fixes for spc_studies
ALTER TABLE spc_studies DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE spc_studies DROP COLUMN IF EXISTS created_by;
ALTER TABLE spc_studies DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_spc_studies_deleted_at;

-- Revert fixes for quotations
ALTER TABLE quotations DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE quotations DROP COLUMN IF EXISTS created_by;
ALTER TABLE quotations DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_quotations_deleted_at;

-- Revert fixes for cost_calculations
ALTER TABLE cost_calculations DROP COLUMN IF EXISTS updated_at;
ALTER TABLE cost_calculations DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE cost_calculations DROP COLUMN IF EXISTS created_by;
ALTER TABLE cost_calculations DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_cost_calculations_deleted_at;

-- Revert fixes for project_cost_analysis
ALTER TABLE project_cost_analysis DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE project_cost_analysis DROP COLUMN IF EXISTS created_by;
ALTER TABLE project_cost_analysis DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_project_cost_analysis_deleted_at;

-- Revert fixes for workflow_definitions
ALTER TABLE workflow_definitions DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workflow_definitions DROP COLUMN IF EXISTS created_by;
ALTER TABLE workflow_definitions DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_workflow_definitions_deleted_at;

-- Revert fixes for workflow_steps
ALTER TABLE workflow_steps DROP COLUMN IF EXISTS updated_at;
ALTER TABLE workflow_steps DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workflow_steps DROP COLUMN IF EXISTS created_by;
ALTER TABLE workflow_steps DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_workflow_steps_deleted_at;

-- Revert fixes for workflow_instances
ALTER TABLE workflow_instances DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workflow_instances DROP COLUMN IF EXISTS created_by;
ALTER TABLE workflow_instances DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_workflow_instances_deleted_at;

-- Revert fixes for workflow_history
ALTER TABLE workflow_history DROP COLUMN IF EXISTS created_at;
ALTER TABLE workflow_history DROP COLUMN IF EXISTS updated_at;
ALTER TABLE workflow_history DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE workflow_history DROP COLUMN IF EXISTS created_by;
ALTER TABLE workflow_history DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_workflow_history_deleted_at;

-- Revert fixes for job_work_challans
ALTER TABLE job_work_challans DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE job_work_challans DROP COLUMN IF EXISTS created_by;
ALTER TABLE job_work_challans DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_job_work_challans_deleted_at;

-- Revert fixes for vendor_quality_scores
ALTER TABLE vendor_quality_scores DROP COLUMN IF EXISTS created_at;
ALTER TABLE vendor_quality_scores DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE vendor_quality_scores DROP COLUMN IF EXISTS created_by;
ALTER TABLE vendor_quality_scores DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_vendor_quality_scores_deleted_at;

-- Revert fixes for supplier_scorecards
ALTER TABLE supplier_scorecards DROP COLUMN IF EXISTS created_by;
ALTER TABLE supplier_scorecards DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for supplier_ncrs
ALTER TABLE supplier_ncrs DROP COLUMN IF EXISTS created_by;
ALTER TABLE supplier_ncrs DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for supplier_audits
ALTER TABLE supplier_audits DROP COLUMN IF EXISTS created_by;
ALTER TABLE supplier_audits DROP COLUMN IF EXISTS updated_by;

-- Revert fixes for tooling_projects
ALTER TABLE tooling_projects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE tooling_projects DROP COLUMN IF EXISTS created_by;
ALTER TABLE tooling_projects DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_tooling_projects_deleted_at;

-- Revert fixes for tool_assets
ALTER TABLE tool_assets DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE tool_assets DROP COLUMN IF EXISTS created_by;
ALTER TABLE tool_assets DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_tool_assets_deleted_at;

-- Revert fixes for tooling_life_logs
ALTER TABLE tooling_life_logs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE tooling_life_logs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE tooling_life_logs DROP COLUMN IF EXISTS created_by;
ALTER TABLE tooling_life_logs DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_tooling_life_logs_deleted_at;

-- Revert fixes for refurbishment_tickets
ALTER TABLE refurbishment_tickets DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE refurbishment_tickets DROP COLUMN IF EXISTS created_by;
ALTER TABLE refurbishment_tickets DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_refurbishment_tickets_deleted_at;

-- Revert fixes for drawing_vault_documents
ALTER TABLE drawing_vault_documents DROP COLUMN IF EXISTS updated_at;
ALTER TABLE drawing_vault_documents DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE drawing_vault_documents DROP COLUMN IF EXISTS created_by;
ALTER TABLE drawing_vault_documents DROP COLUMN IF EXISTS updated_by;
DROP INDEX IF EXISTS idx_drawing_vault_documents_deleted_at;

