-- Fixes for analytics_kpis
ALTER TABLE analytics_kpis ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE analytics_kpis ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE analytics_kpis ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_analytics_kpis_deleted_at ON analytics_kpis(deleted_at);

-- Fixes for analytics_revenue
ALTER TABLE analytics_revenue ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE analytics_revenue ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE analytics_revenue ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_analytics_revenue_deleted_at ON analytics_revenue(deleted_at);

-- Fixes for analytics_machine_utilization
ALTER TABLE analytics_machine_utilization ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE analytics_machine_utilization ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE analytics_machine_utilization ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_analytics_machine_utilization_deleted_at ON analytics_machine_utilization(deleted_at);

-- Fixes for analytics_vendor_defects
ALTER TABLE analytics_vendor_defects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE analytics_vendor_defects ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE analytics_vendor_defects ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_analytics_vendor_defects_deleted_at ON analytics_vendor_defects(deleted_at);

-- Fixes for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);

-- Fixes for auth_attendance
ALTER TABLE auth_attendance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE auth_attendance ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE auth_attendance ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_auth_attendance_deleted_at ON auth_attendance(deleted_at);

-- Fixes for companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for plants
ALTER TABLE plants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_plants_deleted_at ON plants(deleted_at);

-- Fixes for departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_departments_deleted_at ON departments(deleted_at);

-- Fixes for modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_modules_deleted_at ON modules(deleted_at);

-- Fixes for permissions
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_permissions_deleted_at ON permissions(deleted_at);

-- Fixes for roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for user_roles
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_deleted_at ON user_roles(deleted_at);

-- Fixes for role_permissions
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_role_permissions_deleted_at ON role_permissions(deleted_at);

-- Fixes for audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_audit_logs_deleted_at ON audit_logs(deleted_at);

-- Fixes for change_requests
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_change_requests_deleted_at ON change_requests(deleted_at);

-- Fixes for change_impact_analyses
ALTER TABLE change_impact_analyses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE change_impact_analyses ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE change_impact_analyses ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_change_impact_analyses_deleted_at ON change_impact_analyses(deleted_at);

-- Fixes for change_notices
ALTER TABLE change_notices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE change_notices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE change_notices ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_change_notices_deleted_at ON change_notices(deleted_at);

-- Fixes for customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers(deleted_at);

-- Fixes for contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON contacts(deleted_at);

-- Fixes for rfqs
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_rfqs_deleted_at ON rfqs(deleted_at);

-- Fixes for invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices(deleted_at);

-- Fixes for expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON expenses(deleted_at);

-- Fixes for copq_logs
ALTER TABLE copq_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE copq_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE copq_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_copq_logs_deleted_at ON copq_logs(deleted_at);

-- Fixes for chart_of_accounts
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for journal_entries
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for journal_lines
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE journal_lines ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for payment_receipts
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE payment_receipts ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for finance_purchase_orders
ALTER TABLE finance_purchase_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_purchase_orders ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_purchase_orders ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_purchase_orders_deleted_at ON finance_purchase_orders(deleted_at);

-- Fixes for finance_accounts
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_accounts_deleted_at ON finance_accounts(deleted_at);

-- Fixes for finance_journal_entries
ALTER TABLE finance_journal_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_journal_entries ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_journal_entries ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_journal_entries_deleted_at ON finance_journal_entries(deleted_at);

-- Fixes for finance_journal_lines
ALTER TABLE finance_journal_lines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_journal_lines ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_journal_lines ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_journal_lines_deleted_at ON finance_journal_lines(deleted_at);

-- Fixes for finance_projects
ALTER TABLE finance_projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_projects ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_projects ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_projects_deleted_at ON finance_projects(deleted_at);

-- Fixes for finance_copq_logs
ALTER TABLE finance_copq_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_copq_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_copq_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_copq_logs_deleted_at ON finance_copq_logs(deleted_at);

-- Fixes for finance_invoices
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_invoices ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_invoices_deleted_at ON finance_invoices(deleted_at);

-- Fixes for finance_expenses
ALTER TABLE finance_expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE finance_expenses ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE finance_expenses ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_finance_expenses_deleted_at ON finance_expenses(deleted_at);

-- Fixes for hrms_employees
ALTER TABLE hrms_employees ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE hrms_employees ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE hrms_employees ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_hrms_employees_deleted_at ON hrms_employees(deleted_at);

-- Fixes for hrms_tasks
ALTER TABLE hrms_tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE hrms_tasks ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE hrms_tasks ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_hrms_tasks_deleted_at ON hrms_tasks(deleted_at);

-- Fixes for hrms_leaves
ALTER TABLE hrms_leaves ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE hrms_leaves ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE hrms_leaves ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_hrms_leaves_deleted_at ON hrms_leaves(deleted_at);

-- Fixes for hrms_attendance
ALTER TABLE hrms_attendance ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE hrms_attendance ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE hrms_attendance ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_hrms_attendance_deleted_at ON hrms_attendance(deleted_at);

-- Fixes for inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_inventory_items_deleted_at ON inventory_items(deleted_at);

-- Fixes for stock_transactions
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE stock_transactions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_stock_transactions_deleted_at ON stock_transactions(deleted_at);

-- Fixes for inventory_delivery_challans
ALTER TABLE inventory_delivery_challans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE inventory_delivery_challans ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE inventory_delivery_challans ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_inventory_delivery_challans_deleted_at ON inventory_delivery_challans(deleted_at);

-- Fixes for warehouses
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_warehouses_deleted_at ON warehouses(deleted_at);

-- Fixes for cycle_counts
ALTER TABLE cycle_counts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cycle_counts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cycle_counts ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_cycle_counts_deleted_at ON cycle_counts(deleted_at);

-- Fixes for abc_analysis
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE abc_analysis ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_abc_analysis_deleted_at ON abc_analysis(deleted_at);

-- Fixes for material_heat_numbers
ALTER TABLE material_heat_numbers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE material_heat_numbers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE material_heat_numbers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE material_heat_numbers ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_material_heat_numbers_deleted_at ON material_heat_numbers(deleted_at);

-- Fixes for material_certificates
ALTER TABLE material_certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE material_certificates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE material_certificates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE material_certificates ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_material_certificates_deleted_at ON material_certificates(deleted_at);

-- Fixes for machines
ALTER TABLE machines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_machines_deleted_at ON machines(deleted_at);

-- Fixes for maintenance_logs
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE maintenance_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_deleted_at ON maintenance_logs(deleted_at);

-- Fixes for preventive_maintenance_schedules
ALTER TABLE preventive_maintenance_schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE preventive_maintenance_schedules ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE preventive_maintenance_schedules ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_schedules_deleted_at ON preventive_maintenance_schedules(deleted_at);

-- Fixes for machine_telemetry_logs
ALTER TABLE machine_telemetry_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE machine_telemetry_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE machine_telemetry_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE machine_telemetry_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_machine_telemetry_logs_deleted_at ON machine_telemetry_logs(deleted_at);

-- Fixes for shifts
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_shifts_deleted_at ON shifts(deleted_at);

-- Fixes for production_jobs
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE production_jobs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_production_jobs_deleted_at ON production_jobs(deleted_at);

-- Fixes for downtime_logs
ALTER TABLE downtime_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE downtime_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE downtime_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_downtime_logs_deleted_at ON downtime_logs(deleted_at);

-- Fixes for travelers
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE travelers ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_travelers_deleted_at ON travelers(deleted_at);

-- Fixes for traveler_stages
ALTER TABLE traveler_stages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE traveler_stages ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE traveler_stages ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_traveler_stages_deleted_at ON traveler_stages(deleted_at);

-- Fixes for machine_capacities
ALTER TABLE machine_capacities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE machine_capacities ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE machine_capacities ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_machine_capacities_deleted_at ON machine_capacities(deleted_at);

-- Fixes for production_schedules
ALTER TABLE production_schedules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE production_schedules ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE production_schedules ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_production_schedules_deleted_at ON production_schedules(deleted_at);

-- Fixes for oee_daily_metrics
ALTER TABLE oee_daily_metrics ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE oee_daily_metrics ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE oee_daily_metrics ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_oee_daily_metrics_deleted_at ON oee_daily_metrics(deleted_at);

-- Fixes for quality_pfmeas
ALTER TABLE quality_pfmeas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE quality_pfmeas ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE quality_pfmeas ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_quality_pfmeas_deleted_at ON quality_pfmeas(deleted_at);

-- Fixes for quality_control_plans
ALTER TABLE quality_control_plans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE quality_control_plans ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE quality_control_plans ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_quality_control_plans_deleted_at ON quality_control_plans(deleted_at);

-- Fixes for gauge_rnrs
ALTER TABLE gauge_rnrs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE gauge_rnrs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE gauge_rnrs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_gauge_rnrs_deleted_at ON gauge_rnrs(deleted_at);

-- Fixes for fais
ALTER TABLE fais ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE fais ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE fais ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_fais_deleted_at ON fais(deleted_at);

-- Fixes for ppap_submissions
ALTER TABLE ppap_submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE ppap_submissions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE ppap_submissions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_ppap_submissions_deleted_at ON ppap_submissions(deleted_at);

-- Fixes for dimensional_reports
ALTER TABLE dimensional_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE dimensional_reports ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE dimensional_reports ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_dimensional_reports_deleted_at ON dimensional_reports(deleted_at);

-- Fixes for material_certifications
ALTER TABLE material_certifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE material_certifications ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE material_certifications ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_material_certifications_deleted_at ON material_certifications(deleted_at);

-- Fixes for capability_reports
ALTER TABLE capability_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE capability_reports ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE capability_reports ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_capability_reports_deleted_at ON capability_reports(deleted_at);

-- Fixes for appearance_approval_reports
ALTER TABLE appearance_approval_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE appearance_approval_reports ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE appearance_approval_reports ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_appearance_approval_reports_deleted_at ON appearance_approval_reports(deleted_at);

-- Fixes for process_flow_diagrams
ALTER TABLE process_flow_diagrams ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE process_flow_diagrams ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE process_flow_diagrams ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_process_flow_diagrams_deleted_at ON process_flow_diagrams(deleted_at);

-- Fixes for psws
ALTER TABLE psws ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE psws ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE psws ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_psws_deleted_at ON psws(deleted_at);

-- Fixes for customer_complaints
ALTER TABLE customer_complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customer_complaints ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE customer_complaints ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_customer_complaints_deleted_at ON customer_complaints(deleted_at);

-- Fixes for eight_d_reports
ALTER TABLE eight_d_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE eight_d_reports ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE eight_d_reports ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_eight_d_reports_deleted_at ON eight_d_reports(deleted_at);

-- Fixes for apqp_gate_reviews
ALTER TABLE apqp_gate_reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE apqp_gate_reviews ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE apqp_gate_reviews ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_apqp_gate_reviews_deleted_at ON apqp_gate_reviews(deleted_at);

-- Fixes for open_risk_trackers
ALTER TABLE open_risk_trackers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE open_risk_trackers ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE open_risk_trackers ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_open_risk_trackers_deleted_at ON open_risk_trackers(deleted_at);

-- Fixes for gauge_rnr_studies
ALTER TABLE gauge_rnr_studies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE gauge_rnr_studies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE gauge_rnr_studies ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_gauge_rnr_studies_deleted_at ON gauge_rnr_studies(deleted_at);

-- Fixes for calibration_matrices
ALTER TABLE calibration_matrices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE calibration_matrices ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE calibration_matrices ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_calibration_matrices_deleted_at ON calibration_matrices(deleted_at);

-- Fixes for apqp_project_timelines
ALTER TABLE apqp_project_timelines ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE apqp_project_timelines ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE apqp_project_timelines ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_apqp_project_timelines_deleted_at ON apqp_project_timelines(deleted_at);

-- Fixes for apqp_milestones
ALTER TABLE apqp_milestones ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE apqp_milestones ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE apqp_milestones ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_apqp_milestones_deleted_at ON apqp_milestones(deleted_at);

-- Fixes for spc_studies
ALTER TABLE spc_studies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE spc_studies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE spc_studies ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_spc_studies_deleted_at ON spc_studies(deleted_at);

-- Fixes for quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_quotations_deleted_at ON quotations(deleted_at);

-- Fixes for cost_calculations
ALTER TABLE cost_calculations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE cost_calculations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cost_calculations ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE cost_calculations ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_cost_calculations_deleted_at ON cost_calculations(deleted_at);

-- Fixes for project_cost_analysis
ALTER TABLE project_cost_analysis ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE project_cost_analysis ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE project_cost_analysis ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_project_cost_analysis_deleted_at ON project_cost_analysis(deleted_at);

-- Fixes for workflow_definitions
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE workflow_definitions ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_deleted_at ON workflow_definitions(deleted_at);

-- Fixes for workflow_steps
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_workflow_steps_deleted_at ON workflow_steps(deleted_at);

-- Fixes for workflow_instances
ALTER TABLE workflow_instances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workflow_instances ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE workflow_instances ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_workflow_instances_deleted_at ON workflow_instances(deleted_at);

-- Fixes for workflow_history
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_workflow_history_deleted_at ON workflow_history(deleted_at);

-- Fixes for job_work_challans
ALTER TABLE job_work_challans ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE job_work_challans ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE job_work_challans ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_job_work_challans_deleted_at ON job_work_challans(deleted_at);

-- Fixes for vendor_quality_scores
ALTER TABLE vendor_quality_scores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE vendor_quality_scores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE vendor_quality_scores ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE vendor_quality_scores ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_vendor_quality_scores_deleted_at ON vendor_quality_scores(deleted_at);

-- Fixes for supplier_scorecards
ALTER TABLE supplier_scorecards ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE supplier_scorecards ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for supplier_ncrs
ALTER TABLE supplier_ncrs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE supplier_ncrs ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for supplier_audits
ALTER TABLE supplier_audits ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE supplier_audits ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Fixes for tooling_projects
ALTER TABLE tooling_projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tooling_projects ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tooling_projects ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_tooling_projects_deleted_at ON tooling_projects(deleted_at);

-- Fixes for tool_assets
ALTER TABLE tool_assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tool_assets ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tool_assets ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_tool_assets_deleted_at ON tool_assets(deleted_at);

-- Fixes for tooling_life_logs
ALTER TABLE tooling_life_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tooling_life_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tooling_life_logs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tooling_life_logs ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_tooling_life_logs_deleted_at ON tooling_life_logs(deleted_at);

-- Fixes for refurbishment_tickets
ALTER TABLE refurbishment_tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE refurbishment_tickets ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE refurbishment_tickets ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_refurbishment_tickets_deleted_at ON refurbishment_tickets(deleted_at);

-- Fixes for drawing_vault_documents
ALTER TABLE drawing_vault_documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE drawing_vault_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE drawing_vault_documents ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE drawing_vault_documents ADD COLUMN IF NOT EXISTS updated_by UUID;
CREATE INDEX IF NOT EXISTS idx_drawing_vault_documents_deleted_at ON drawing_vault_documents(deleted_at);

