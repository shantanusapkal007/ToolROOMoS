-- Revert integrity constraints for analytics_kpis
ALTER TABLE analytics_kpis DROP CONSTRAINT IF EXISTS fk_analytics_kpis_tenant;
ALTER TABLE analytics_kpis DROP CONSTRAINT IF EXISTS fk_analytics_kpis_company;
ALTER TABLE analytics_kpis DROP CONSTRAINT IF EXISTS fk_analytics_kpis_created_by;
ALTER TABLE analytics_kpis DROP CONSTRAINT IF EXISTS fk_analytics_kpis_updated_by;
ALTER TABLE analytics_kpis DROP CONSTRAINT IF EXISTS fk_analytics_kpis_deleted_by;

-- Revert integrity constraints for analytics_revenue
ALTER TABLE analytics_revenue DROP CONSTRAINT IF EXISTS fk_analytics_revenue_tenant;
ALTER TABLE analytics_revenue DROP CONSTRAINT IF EXISTS fk_analytics_revenue_company;
ALTER TABLE analytics_revenue DROP CONSTRAINT IF EXISTS fk_analytics_revenue_created_by;
ALTER TABLE analytics_revenue DROP CONSTRAINT IF EXISTS fk_analytics_revenue_updated_by;
ALTER TABLE analytics_revenue DROP CONSTRAINT IF EXISTS fk_analytics_revenue_deleted_by;

-- Revert integrity constraints for analytics_machine_utilization
ALTER TABLE analytics_machine_utilization DROP CONSTRAINT IF EXISTS fk_analytics_machine_utilization_tenant;
ALTER TABLE analytics_machine_utilization DROP CONSTRAINT IF EXISTS fk_analytics_machine_utilization_company;
ALTER TABLE analytics_machine_utilization DROP CONSTRAINT IF EXISTS fk_analytics_machine_utilization_created_by;
ALTER TABLE analytics_machine_utilization DROP CONSTRAINT IF EXISTS fk_analytics_machine_utilization_updated_by;
ALTER TABLE analytics_machine_utilization DROP CONSTRAINT IF EXISTS fk_analytics_machine_utilization_deleted_by;

-- Revert integrity constraints for analytics_vendor_defects
ALTER TABLE analytics_vendor_defects DROP CONSTRAINT IF EXISTS fk_analytics_vendor_defects_tenant;
ALTER TABLE analytics_vendor_defects DROP CONSTRAINT IF EXISTS fk_analytics_vendor_defects_company;
ALTER TABLE analytics_vendor_defects DROP CONSTRAINT IF EXISTS fk_analytics_vendor_defects_created_by;
ALTER TABLE analytics_vendor_defects DROP CONSTRAINT IF EXISTS fk_analytics_vendor_defects_updated_by;
ALTER TABLE analytics_vendor_defects DROP CONSTRAINT IF EXISTS fk_analytics_vendor_defects_deleted_by;

-- Revert integrity constraints for sessions
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_tenant;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_company;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_created_by;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_updated_by;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS fk_sessions_deleted_by;

-- Revert integrity constraints for auth_attendance
ALTER TABLE auth_attendance DROP CONSTRAINT IF EXISTS fk_auth_attendance_tenant;
ALTER TABLE auth_attendance DROP CONSTRAINT IF EXISTS fk_auth_attendance_company;
ALTER TABLE auth_attendance DROP CONSTRAINT IF EXISTS fk_auth_attendance_created_by;
ALTER TABLE auth_attendance DROP CONSTRAINT IF EXISTS fk_auth_attendance_updated_by;
ALTER TABLE auth_attendance DROP CONSTRAINT IF EXISTS fk_auth_attendance_deleted_by;

-- Revert integrity constraints for plants
ALTER TABLE plants DROP CONSTRAINT IF EXISTS fk_plants_tenant;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS fk_plants_company;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS fk_plants_created_by;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS fk_plants_updated_by;
ALTER TABLE plants DROP CONSTRAINT IF EXISTS fk_plants_deleted_by;

-- Revert integrity constraints for departments
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_tenant;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_company;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_created_by;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_updated_by;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_deleted_by;

-- Revert integrity constraints for modules
ALTER TABLE modules DROP CONSTRAINT IF EXISTS fk_modules_tenant;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS fk_modules_company;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS fk_modules_created_by;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS fk_modules_updated_by;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS fk_modules_deleted_by;

-- Revert integrity constraints for permissions
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_tenant;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_company;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_created_by;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_updated_by;
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS fk_permissions_deleted_by;

-- Revert integrity constraints for roles
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_tenant;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_company;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_created_by;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_updated_by;
ALTER TABLE roles DROP CONSTRAINT IF EXISTS fk_roles_deleted_by;

-- Revert integrity constraints for user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_tenant;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_company;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_created_by;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_updated_by;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS fk_user_roles_deleted_by;

-- Revert integrity constraints for role_permissions
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS fk_role_permissions_tenant;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS fk_role_permissions_company;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS fk_role_permissions_created_by;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS fk_role_permissions_updated_by;
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS fk_role_permissions_deleted_by;

-- Revert integrity constraints for audit_logs
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_tenant;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_company;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_created_by;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_updated_by;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS fk_audit_logs_deleted_by;

-- Revert integrity constraints for change_requests
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS fk_change_requests_tenant;
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS fk_change_requests_company;
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS fk_change_requests_created_by;
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS fk_change_requests_updated_by;
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS fk_change_requests_deleted_by;

-- Revert integrity constraints for change_impact_analyses
ALTER TABLE change_impact_analyses DROP CONSTRAINT IF EXISTS fk_change_impact_analyses_tenant;
ALTER TABLE change_impact_analyses DROP CONSTRAINT IF EXISTS fk_change_impact_analyses_company;
ALTER TABLE change_impact_analyses DROP CONSTRAINT IF EXISTS fk_change_impact_analyses_created_by;
ALTER TABLE change_impact_analyses DROP CONSTRAINT IF EXISTS fk_change_impact_analyses_updated_by;
ALTER TABLE change_impact_analyses DROP CONSTRAINT IF EXISTS fk_change_impact_analyses_deleted_by;

-- Revert integrity constraints for change_notices
ALTER TABLE change_notices DROP CONSTRAINT IF EXISTS fk_change_notices_tenant;
ALTER TABLE change_notices DROP CONSTRAINT IF EXISTS fk_change_notices_company;
ALTER TABLE change_notices DROP CONSTRAINT IF EXISTS fk_change_notices_created_by;
ALTER TABLE change_notices DROP CONSTRAINT IF EXISTS fk_change_notices_updated_by;
ALTER TABLE change_notices DROP CONSTRAINT IF EXISTS fk_change_notices_deleted_by;

-- Revert integrity constraints for customers
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_tenant;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_company;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_created_by;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_updated_by;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS fk_customers_deleted_by;

-- Revert integrity constraints for contacts
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_contacts_tenant;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_contacts_company;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_contacts_created_by;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_contacts_updated_by;
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS fk_contacts_deleted_by;

-- Revert integrity constraints for rfqs
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS fk_rfqs_tenant;
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS fk_rfqs_company;
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS fk_rfqs_created_by;
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS fk_rfqs_updated_by;
ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS fk_rfqs_deleted_by;

-- Revert integrity constraints for invoices
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_tenant;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_company;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_created_by;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_updated_by;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoices_deleted_by;

-- Revert integrity constraints for expenses
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_tenant;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_company;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_created_by;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_updated_by;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS fk_expenses_deleted_by;

-- Revert integrity constraints for copq_logs
ALTER TABLE copq_logs DROP CONSTRAINT IF EXISTS fk_copq_logs_tenant;
ALTER TABLE copq_logs DROP CONSTRAINT IF EXISTS fk_copq_logs_company;
ALTER TABLE copq_logs DROP CONSTRAINT IF EXISTS fk_copq_logs_created_by;
ALTER TABLE copq_logs DROP CONSTRAINT IF EXISTS fk_copq_logs_updated_by;
ALTER TABLE copq_logs DROP CONSTRAINT IF EXISTS fk_copq_logs_deleted_by;

-- Revert integrity constraints for chart_of_accounts
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_chart_of_accounts_tenant;
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_chart_of_accounts_company;
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_chart_of_accounts_created_by;
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_chart_of_accounts_updated_by;
ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS fk_chart_of_accounts_deleted_by;

-- Revert integrity constraints for journal_entries
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS fk_journal_entries_tenant;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS fk_journal_entries_company;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS fk_journal_entries_created_by;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS fk_journal_entries_updated_by;
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS fk_journal_entries_deleted_by;

-- Revert integrity constraints for journal_lines
ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS fk_journal_lines_tenant;
ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS fk_journal_lines_company;
ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS fk_journal_lines_created_by;
ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS fk_journal_lines_updated_by;
ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS fk_journal_lines_deleted_by;

-- Revert integrity constraints for payment_receipts
ALTER TABLE payment_receipts DROP CONSTRAINT IF EXISTS fk_payment_receipts_tenant;
ALTER TABLE payment_receipts DROP CONSTRAINT IF EXISTS fk_payment_receipts_company;
ALTER TABLE payment_receipts DROP CONSTRAINT IF EXISTS fk_payment_receipts_created_by;
ALTER TABLE payment_receipts DROP CONSTRAINT IF EXISTS fk_payment_receipts_updated_by;
ALTER TABLE payment_receipts DROP CONSTRAINT IF EXISTS fk_payment_receipts_deleted_by;

-- Revert integrity constraints for finance_purchase_orders
ALTER TABLE finance_purchase_orders DROP CONSTRAINT IF EXISTS fk_finance_purchase_orders_tenant;
ALTER TABLE finance_purchase_orders DROP CONSTRAINT IF EXISTS fk_finance_purchase_orders_company;
ALTER TABLE finance_purchase_orders DROP CONSTRAINT IF EXISTS fk_finance_purchase_orders_created_by;
ALTER TABLE finance_purchase_orders DROP CONSTRAINT IF EXISTS fk_finance_purchase_orders_updated_by;
ALTER TABLE finance_purchase_orders DROP CONSTRAINT IF EXISTS fk_finance_purchase_orders_deleted_by;

-- Revert integrity constraints for finance_accounts
ALTER TABLE finance_accounts DROP CONSTRAINT IF EXISTS fk_finance_accounts_tenant;
ALTER TABLE finance_accounts DROP CONSTRAINT IF EXISTS fk_finance_accounts_company;
ALTER TABLE finance_accounts DROP CONSTRAINT IF EXISTS fk_finance_accounts_created_by;
ALTER TABLE finance_accounts DROP CONSTRAINT IF EXISTS fk_finance_accounts_updated_by;
ALTER TABLE finance_accounts DROP CONSTRAINT IF EXISTS fk_finance_accounts_deleted_by;

-- Revert integrity constraints for finance_journal_entries
ALTER TABLE finance_journal_entries DROP CONSTRAINT IF EXISTS fk_finance_journal_entries_tenant;
ALTER TABLE finance_journal_entries DROP CONSTRAINT IF EXISTS fk_finance_journal_entries_company;
ALTER TABLE finance_journal_entries DROP CONSTRAINT IF EXISTS fk_finance_journal_entries_created_by;
ALTER TABLE finance_journal_entries DROP CONSTRAINT IF EXISTS fk_finance_journal_entries_updated_by;
ALTER TABLE finance_journal_entries DROP CONSTRAINT IF EXISTS fk_finance_journal_entries_deleted_by;

-- Revert integrity constraints for finance_journal_lines
ALTER TABLE finance_journal_lines DROP CONSTRAINT IF EXISTS fk_finance_journal_lines_tenant;
ALTER TABLE finance_journal_lines DROP CONSTRAINT IF EXISTS fk_finance_journal_lines_company;
ALTER TABLE finance_journal_lines DROP CONSTRAINT IF EXISTS fk_finance_journal_lines_created_by;
ALTER TABLE finance_journal_lines DROP CONSTRAINT IF EXISTS fk_finance_journal_lines_updated_by;
ALTER TABLE finance_journal_lines DROP CONSTRAINT IF EXISTS fk_finance_journal_lines_deleted_by;

-- Revert integrity constraints for finance_projects
ALTER TABLE finance_projects DROP CONSTRAINT IF EXISTS fk_finance_projects_tenant;
ALTER TABLE finance_projects DROP CONSTRAINT IF EXISTS fk_finance_projects_company;
ALTER TABLE finance_projects DROP CONSTRAINT IF EXISTS fk_finance_projects_created_by;
ALTER TABLE finance_projects DROP CONSTRAINT IF EXISTS fk_finance_projects_updated_by;
ALTER TABLE finance_projects DROP CONSTRAINT IF EXISTS fk_finance_projects_deleted_by;

-- Revert integrity constraints for finance_copq_logs
ALTER TABLE finance_copq_logs DROP CONSTRAINT IF EXISTS fk_finance_copq_logs_tenant;
ALTER TABLE finance_copq_logs DROP CONSTRAINT IF EXISTS fk_finance_copq_logs_company;
ALTER TABLE finance_copq_logs DROP CONSTRAINT IF EXISTS fk_finance_copq_logs_created_by;
ALTER TABLE finance_copq_logs DROP CONSTRAINT IF EXISTS fk_finance_copq_logs_updated_by;
ALTER TABLE finance_copq_logs DROP CONSTRAINT IF EXISTS fk_finance_copq_logs_deleted_by;

-- Revert integrity constraints for finance_invoices
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS fk_finance_invoices_tenant;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS fk_finance_invoices_company;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS fk_finance_invoices_created_by;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS fk_finance_invoices_updated_by;
ALTER TABLE finance_invoices DROP CONSTRAINT IF EXISTS fk_finance_invoices_deleted_by;

-- Revert integrity constraints for finance_expenses
ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS fk_finance_expenses_tenant;
ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS fk_finance_expenses_company;
ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS fk_finance_expenses_created_by;
ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS fk_finance_expenses_updated_by;
ALTER TABLE finance_expenses DROP CONSTRAINT IF EXISTS fk_finance_expenses_deleted_by;

-- Revert integrity constraints for hrms_employees
ALTER TABLE hrms_employees DROP CONSTRAINT IF EXISTS fk_hrms_employees_tenant;
ALTER TABLE hrms_employees DROP CONSTRAINT IF EXISTS fk_hrms_employees_company;
ALTER TABLE hrms_employees DROP CONSTRAINT IF EXISTS fk_hrms_employees_created_by;
ALTER TABLE hrms_employees DROP CONSTRAINT IF EXISTS fk_hrms_employees_updated_by;
ALTER TABLE hrms_employees DROP CONSTRAINT IF EXISTS fk_hrms_employees_deleted_by;

-- Revert integrity constraints for hrms_tasks
ALTER TABLE hrms_tasks DROP CONSTRAINT IF EXISTS fk_hrms_tasks_tenant;
ALTER TABLE hrms_tasks DROP CONSTRAINT IF EXISTS fk_hrms_tasks_company;
ALTER TABLE hrms_tasks DROP CONSTRAINT IF EXISTS fk_hrms_tasks_created_by;
ALTER TABLE hrms_tasks DROP CONSTRAINT IF EXISTS fk_hrms_tasks_updated_by;
ALTER TABLE hrms_tasks DROP CONSTRAINT IF EXISTS fk_hrms_tasks_deleted_by;

-- Revert integrity constraints for hrms_leaves
ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS fk_hrms_leaves_tenant;
ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS fk_hrms_leaves_company;
ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS fk_hrms_leaves_created_by;
ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS fk_hrms_leaves_updated_by;
ALTER TABLE hrms_leaves DROP CONSTRAINT IF EXISTS fk_hrms_leaves_deleted_by;

-- Revert integrity constraints for hrms_attendance
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS fk_hrms_attendance_tenant;
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS fk_hrms_attendance_company;
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS fk_hrms_attendance_created_by;
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS fk_hrms_attendance_updated_by;
ALTER TABLE hrms_attendance DROP CONSTRAINT IF EXISTS fk_hrms_attendance_deleted_by;

-- Revert integrity constraints for inventory_items
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_tenant;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_company;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_created_by;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_updated_by;
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS fk_inventory_items_deleted_by;

-- Revert integrity constraints for stock_transactions
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS fk_stock_transactions_tenant;
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS fk_stock_transactions_company;
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS fk_stock_transactions_created_by;
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS fk_stock_transactions_updated_by;
ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS fk_stock_transactions_deleted_by;

-- Revert integrity constraints for inventory_delivery_challans
ALTER TABLE inventory_delivery_challans DROP CONSTRAINT IF EXISTS fk_inventory_delivery_challans_tenant;
ALTER TABLE inventory_delivery_challans DROP CONSTRAINT IF EXISTS fk_inventory_delivery_challans_company;
ALTER TABLE inventory_delivery_challans DROP CONSTRAINT IF EXISTS fk_inventory_delivery_challans_created_by;
ALTER TABLE inventory_delivery_challans DROP CONSTRAINT IF EXISTS fk_inventory_delivery_challans_updated_by;
ALTER TABLE inventory_delivery_challans DROP CONSTRAINT IF EXISTS fk_inventory_delivery_challans_deleted_by;

-- Revert integrity constraints for warehouses
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS fk_warehouses_tenant;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS fk_warehouses_company;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS fk_warehouses_created_by;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS fk_warehouses_updated_by;
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS fk_warehouses_deleted_by;

-- Revert integrity constraints for cycle_counts
ALTER TABLE cycle_counts DROP CONSTRAINT IF EXISTS fk_cycle_counts_tenant;
ALTER TABLE cycle_counts DROP CONSTRAINT IF EXISTS fk_cycle_counts_company;
ALTER TABLE cycle_counts DROP CONSTRAINT IF EXISTS fk_cycle_counts_created_by;
ALTER TABLE cycle_counts DROP CONSTRAINT IF EXISTS fk_cycle_counts_updated_by;
ALTER TABLE cycle_counts DROP CONSTRAINT IF EXISTS fk_cycle_counts_deleted_by;

-- Revert integrity constraints for abc_analysis
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS fk_abc_analysis_tenant;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS fk_abc_analysis_company;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS fk_abc_analysis_created_by;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS fk_abc_analysis_updated_by;
ALTER TABLE abc_analysis DROP CONSTRAINT IF EXISTS fk_abc_analysis_deleted_by;

-- Revert integrity constraints for material_heat_numbers
ALTER TABLE material_heat_numbers DROP CONSTRAINT IF EXISTS fk_material_heat_numbers_tenant;
ALTER TABLE material_heat_numbers DROP CONSTRAINT IF EXISTS fk_material_heat_numbers_company;
ALTER TABLE material_heat_numbers DROP CONSTRAINT IF EXISTS fk_material_heat_numbers_created_by;
ALTER TABLE material_heat_numbers DROP CONSTRAINT IF EXISTS fk_material_heat_numbers_updated_by;
ALTER TABLE material_heat_numbers DROP CONSTRAINT IF EXISTS fk_material_heat_numbers_deleted_by;

-- Revert integrity constraints for material_certificates
ALTER TABLE material_certificates DROP CONSTRAINT IF EXISTS fk_material_certificates_tenant;
ALTER TABLE material_certificates DROP CONSTRAINT IF EXISTS fk_material_certificates_company;
ALTER TABLE material_certificates DROP CONSTRAINT IF EXISTS fk_material_certificates_created_by;
ALTER TABLE material_certificates DROP CONSTRAINT IF EXISTS fk_material_certificates_updated_by;
ALTER TABLE material_certificates DROP CONSTRAINT IF EXISTS fk_material_certificates_deleted_by;

-- Revert integrity constraints for machines
ALTER TABLE machines DROP CONSTRAINT IF EXISTS fk_machines_tenant;
ALTER TABLE machines DROP CONSTRAINT IF EXISTS fk_machines_company;
ALTER TABLE machines DROP CONSTRAINT IF EXISTS fk_machines_created_by;
ALTER TABLE machines DROP CONSTRAINT IF EXISTS fk_machines_updated_by;
ALTER TABLE machines DROP CONSTRAINT IF EXISTS fk_machines_deleted_by;

-- Revert integrity constraints for maintenance_logs
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS fk_maintenance_logs_tenant;
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS fk_maintenance_logs_company;
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS fk_maintenance_logs_created_by;
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS fk_maintenance_logs_updated_by;
ALTER TABLE maintenance_logs DROP CONSTRAINT IF EXISTS fk_maintenance_logs_deleted_by;

-- Revert integrity constraints for preventive_maintenance_schedules
ALTER TABLE preventive_maintenance_schedules DROP CONSTRAINT IF EXISTS fk_preventive_maintenance_schedules_tenant;
ALTER TABLE preventive_maintenance_schedules DROP CONSTRAINT IF EXISTS fk_preventive_maintenance_schedules_company;
ALTER TABLE preventive_maintenance_schedules DROP CONSTRAINT IF EXISTS fk_preventive_maintenance_schedules_created_by;
ALTER TABLE preventive_maintenance_schedules DROP CONSTRAINT IF EXISTS fk_preventive_maintenance_schedules_updated_by;
ALTER TABLE preventive_maintenance_schedules DROP CONSTRAINT IF EXISTS fk_preventive_maintenance_schedules_deleted_by;

-- Revert integrity constraints for shifts
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS fk_shifts_tenant;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS fk_shifts_company;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS fk_shifts_created_by;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS fk_shifts_updated_by;
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS fk_shifts_deleted_by;

-- Revert integrity constraints for production_jobs
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS fk_production_jobs_tenant;
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS fk_production_jobs_company;
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS fk_production_jobs_created_by;
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS fk_production_jobs_updated_by;
ALTER TABLE production_jobs DROP CONSTRAINT IF EXISTS fk_production_jobs_deleted_by;

-- Revert integrity constraints for downtime_logs
ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS fk_downtime_logs_tenant;
ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS fk_downtime_logs_company;
ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS fk_downtime_logs_created_by;
ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS fk_downtime_logs_updated_by;
ALTER TABLE downtime_logs DROP CONSTRAINT IF EXISTS fk_downtime_logs_deleted_by;

-- Revert integrity constraints for travelers
ALTER TABLE travelers DROP CONSTRAINT IF EXISTS fk_travelers_tenant;
ALTER TABLE travelers DROP CONSTRAINT IF EXISTS fk_travelers_company;
ALTER TABLE travelers DROP CONSTRAINT IF EXISTS fk_travelers_created_by;
ALTER TABLE travelers DROP CONSTRAINT IF EXISTS fk_travelers_updated_by;
ALTER TABLE travelers DROP CONSTRAINT IF EXISTS fk_travelers_deleted_by;

-- Revert integrity constraints for traveler_stages
ALTER TABLE traveler_stages DROP CONSTRAINT IF EXISTS fk_traveler_stages_tenant;
ALTER TABLE traveler_stages DROP CONSTRAINT IF EXISTS fk_traveler_stages_company;
ALTER TABLE traveler_stages DROP CONSTRAINT IF EXISTS fk_traveler_stages_created_by;
ALTER TABLE traveler_stages DROP CONSTRAINT IF EXISTS fk_traveler_stages_updated_by;
ALTER TABLE traveler_stages DROP CONSTRAINT IF EXISTS fk_traveler_stages_deleted_by;

-- Revert integrity constraints for machine_capacities
ALTER TABLE machine_capacities DROP CONSTRAINT IF EXISTS fk_machine_capacities_tenant;
ALTER TABLE machine_capacities DROP CONSTRAINT IF EXISTS fk_machine_capacities_company;
ALTER TABLE machine_capacities DROP CONSTRAINT IF EXISTS fk_machine_capacities_created_by;
ALTER TABLE machine_capacities DROP CONSTRAINT IF EXISTS fk_machine_capacities_updated_by;
ALTER TABLE machine_capacities DROP CONSTRAINT IF EXISTS fk_machine_capacities_deleted_by;

-- Revert integrity constraints for production_schedules
ALTER TABLE production_schedules DROP CONSTRAINT IF EXISTS fk_production_schedules_tenant;
ALTER TABLE production_schedules DROP CONSTRAINT IF EXISTS fk_production_schedules_company;
ALTER TABLE production_schedules DROP CONSTRAINT IF EXISTS fk_production_schedules_created_by;
ALTER TABLE production_schedules DROP CONSTRAINT IF EXISTS fk_production_schedules_updated_by;
ALTER TABLE production_schedules DROP CONSTRAINT IF EXISTS fk_production_schedules_deleted_by;

-- Revert integrity constraints for machine_telemetry_logs
ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS fk_machine_telemetry_logs_tenant;
ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS fk_machine_telemetry_logs_company;
ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS fk_machine_telemetry_logs_created_by;
ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS fk_machine_telemetry_logs_updated_by;
ALTER TABLE machine_telemetry_logs DROP CONSTRAINT IF EXISTS fk_machine_telemetry_logs_deleted_by;

-- Revert integrity constraints for oee_daily_metrics
ALTER TABLE oee_daily_metrics DROP CONSTRAINT IF EXISTS fk_oee_daily_metrics_tenant;
ALTER TABLE oee_daily_metrics DROP CONSTRAINT IF EXISTS fk_oee_daily_metrics_company;
ALTER TABLE oee_daily_metrics DROP CONSTRAINT IF EXISTS fk_oee_daily_metrics_created_by;
ALTER TABLE oee_daily_metrics DROP CONSTRAINT IF EXISTS fk_oee_daily_metrics_updated_by;
ALTER TABLE oee_daily_metrics DROP CONSTRAINT IF EXISTS fk_oee_daily_metrics_deleted_by;

-- Revert integrity constraints for quality_pfmeas
ALTER TABLE quality_pfmeas DROP CONSTRAINT IF EXISTS fk_quality_pfmeas_tenant;
ALTER TABLE quality_pfmeas DROP CONSTRAINT IF EXISTS fk_quality_pfmeas_company;
ALTER TABLE quality_pfmeas DROP CONSTRAINT IF EXISTS fk_quality_pfmeas_created_by;
ALTER TABLE quality_pfmeas DROP CONSTRAINT IF EXISTS fk_quality_pfmeas_updated_by;
ALTER TABLE quality_pfmeas DROP CONSTRAINT IF EXISTS fk_quality_pfmeas_deleted_by;

-- Revert integrity constraints for quality_control_plans
ALTER TABLE quality_control_plans DROP CONSTRAINT IF EXISTS fk_quality_control_plans_tenant;
ALTER TABLE quality_control_plans DROP CONSTRAINT IF EXISTS fk_quality_control_plans_company;
ALTER TABLE quality_control_plans DROP CONSTRAINT IF EXISTS fk_quality_control_plans_created_by;
ALTER TABLE quality_control_plans DROP CONSTRAINT IF EXISTS fk_quality_control_plans_updated_by;
ALTER TABLE quality_control_plans DROP CONSTRAINT IF EXISTS fk_quality_control_plans_deleted_by;

-- Revert integrity constraints for gauge_rnrs
ALTER TABLE gauge_rnrs DROP CONSTRAINT IF EXISTS fk_gauge_rnrs_tenant;
ALTER TABLE gauge_rnrs DROP CONSTRAINT IF EXISTS fk_gauge_rnrs_company;
ALTER TABLE gauge_rnrs DROP CONSTRAINT IF EXISTS fk_gauge_rnrs_created_by;
ALTER TABLE gauge_rnrs DROP CONSTRAINT IF EXISTS fk_gauge_rnrs_updated_by;
ALTER TABLE gauge_rnrs DROP CONSTRAINT IF EXISTS fk_gauge_rnrs_deleted_by;

-- Revert integrity constraints for fais
ALTER TABLE fais DROP CONSTRAINT IF EXISTS fk_fais_tenant;
ALTER TABLE fais DROP CONSTRAINT IF EXISTS fk_fais_company;
ALTER TABLE fais DROP CONSTRAINT IF EXISTS fk_fais_created_by;
ALTER TABLE fais DROP CONSTRAINT IF EXISTS fk_fais_updated_by;
ALTER TABLE fais DROP CONSTRAINT IF EXISTS fk_fais_deleted_by;

-- Revert integrity constraints for ppap_submissions
ALTER TABLE ppap_submissions DROP CONSTRAINT IF EXISTS fk_ppap_submissions_tenant;
ALTER TABLE ppap_submissions DROP CONSTRAINT IF EXISTS fk_ppap_submissions_company;
ALTER TABLE ppap_submissions DROP CONSTRAINT IF EXISTS fk_ppap_submissions_created_by;
ALTER TABLE ppap_submissions DROP CONSTRAINT IF EXISTS fk_ppap_submissions_updated_by;
ALTER TABLE ppap_submissions DROP CONSTRAINT IF EXISTS fk_ppap_submissions_deleted_by;

-- Revert integrity constraints for dimensional_reports
ALTER TABLE dimensional_reports DROP CONSTRAINT IF EXISTS fk_dimensional_reports_tenant;
ALTER TABLE dimensional_reports DROP CONSTRAINT IF EXISTS fk_dimensional_reports_company;
ALTER TABLE dimensional_reports DROP CONSTRAINT IF EXISTS fk_dimensional_reports_created_by;
ALTER TABLE dimensional_reports DROP CONSTRAINT IF EXISTS fk_dimensional_reports_updated_by;
ALTER TABLE dimensional_reports DROP CONSTRAINT IF EXISTS fk_dimensional_reports_deleted_by;

-- Revert integrity constraints for material_certifications
ALTER TABLE material_certifications DROP CONSTRAINT IF EXISTS fk_material_certifications_tenant;
ALTER TABLE material_certifications DROP CONSTRAINT IF EXISTS fk_material_certifications_company;
ALTER TABLE material_certifications DROP CONSTRAINT IF EXISTS fk_material_certifications_created_by;
ALTER TABLE material_certifications DROP CONSTRAINT IF EXISTS fk_material_certifications_updated_by;
ALTER TABLE material_certifications DROP CONSTRAINT IF EXISTS fk_material_certifications_deleted_by;

-- Revert integrity constraints for capability_reports
ALTER TABLE capability_reports DROP CONSTRAINT IF EXISTS fk_capability_reports_tenant;
ALTER TABLE capability_reports DROP CONSTRAINT IF EXISTS fk_capability_reports_company;
ALTER TABLE capability_reports DROP CONSTRAINT IF EXISTS fk_capability_reports_created_by;
ALTER TABLE capability_reports DROP CONSTRAINT IF EXISTS fk_capability_reports_updated_by;
ALTER TABLE capability_reports DROP CONSTRAINT IF EXISTS fk_capability_reports_deleted_by;

-- Revert integrity constraints for appearance_approval_reports
ALTER TABLE appearance_approval_reports DROP CONSTRAINT IF EXISTS fk_appearance_approval_reports_tenant;
ALTER TABLE appearance_approval_reports DROP CONSTRAINT IF EXISTS fk_appearance_approval_reports_company;
ALTER TABLE appearance_approval_reports DROP CONSTRAINT IF EXISTS fk_appearance_approval_reports_created_by;
ALTER TABLE appearance_approval_reports DROP CONSTRAINT IF EXISTS fk_appearance_approval_reports_updated_by;
ALTER TABLE appearance_approval_reports DROP CONSTRAINT IF EXISTS fk_appearance_approval_reports_deleted_by;

-- Revert integrity constraints for process_flow_diagrams
ALTER TABLE process_flow_diagrams DROP CONSTRAINT IF EXISTS fk_process_flow_diagrams_tenant;
ALTER TABLE process_flow_diagrams DROP CONSTRAINT IF EXISTS fk_process_flow_diagrams_company;
ALTER TABLE process_flow_diagrams DROP CONSTRAINT IF EXISTS fk_process_flow_diagrams_created_by;
ALTER TABLE process_flow_diagrams DROP CONSTRAINT IF EXISTS fk_process_flow_diagrams_updated_by;
ALTER TABLE process_flow_diagrams DROP CONSTRAINT IF EXISTS fk_process_flow_diagrams_deleted_by;

-- Revert integrity constraints for psws
ALTER TABLE psws DROP CONSTRAINT IF EXISTS fk_psws_tenant;
ALTER TABLE psws DROP CONSTRAINT IF EXISTS fk_psws_company;
ALTER TABLE psws DROP CONSTRAINT IF EXISTS fk_psws_created_by;
ALTER TABLE psws DROP CONSTRAINT IF EXISTS fk_psws_updated_by;
ALTER TABLE psws DROP CONSTRAINT IF EXISTS fk_psws_deleted_by;

-- Revert integrity constraints for customer_complaints
ALTER TABLE customer_complaints DROP CONSTRAINT IF EXISTS fk_customer_complaints_tenant;
ALTER TABLE customer_complaints DROP CONSTRAINT IF EXISTS fk_customer_complaints_company;
ALTER TABLE customer_complaints DROP CONSTRAINT IF EXISTS fk_customer_complaints_created_by;
ALTER TABLE customer_complaints DROP CONSTRAINT IF EXISTS fk_customer_complaints_updated_by;
ALTER TABLE customer_complaints DROP CONSTRAINT IF EXISTS fk_customer_complaints_deleted_by;

-- Revert integrity constraints for eight_d_reports
ALTER TABLE eight_d_reports DROP CONSTRAINT IF EXISTS fk_eight_d_reports_tenant;
ALTER TABLE eight_d_reports DROP CONSTRAINT IF EXISTS fk_eight_d_reports_company;
ALTER TABLE eight_d_reports DROP CONSTRAINT IF EXISTS fk_eight_d_reports_created_by;
ALTER TABLE eight_d_reports DROP CONSTRAINT IF EXISTS fk_eight_d_reports_updated_by;
ALTER TABLE eight_d_reports DROP CONSTRAINT IF EXISTS fk_eight_d_reports_deleted_by;

-- Revert integrity constraints for apqp_gate_reviews
ALTER TABLE apqp_gate_reviews DROP CONSTRAINT IF EXISTS fk_apqp_gate_reviews_tenant;
ALTER TABLE apqp_gate_reviews DROP CONSTRAINT IF EXISTS fk_apqp_gate_reviews_company;
ALTER TABLE apqp_gate_reviews DROP CONSTRAINT IF EXISTS fk_apqp_gate_reviews_created_by;
ALTER TABLE apqp_gate_reviews DROP CONSTRAINT IF EXISTS fk_apqp_gate_reviews_updated_by;
ALTER TABLE apqp_gate_reviews DROP CONSTRAINT IF EXISTS fk_apqp_gate_reviews_deleted_by;

-- Revert integrity constraints for open_risk_trackers
ALTER TABLE open_risk_trackers DROP CONSTRAINT IF EXISTS fk_open_risk_trackers_tenant;
ALTER TABLE open_risk_trackers DROP CONSTRAINT IF EXISTS fk_open_risk_trackers_company;
ALTER TABLE open_risk_trackers DROP CONSTRAINT IF EXISTS fk_open_risk_trackers_created_by;
ALTER TABLE open_risk_trackers DROP CONSTRAINT IF EXISTS fk_open_risk_trackers_updated_by;
ALTER TABLE open_risk_trackers DROP CONSTRAINT IF EXISTS fk_open_risk_trackers_deleted_by;

-- Revert integrity constraints for gauge_rnr_studies
ALTER TABLE gauge_rnr_studies DROP CONSTRAINT IF EXISTS fk_gauge_rnr_studies_tenant;
ALTER TABLE gauge_rnr_studies DROP CONSTRAINT IF EXISTS fk_gauge_rnr_studies_company;
ALTER TABLE gauge_rnr_studies DROP CONSTRAINT IF EXISTS fk_gauge_rnr_studies_created_by;
ALTER TABLE gauge_rnr_studies DROP CONSTRAINT IF EXISTS fk_gauge_rnr_studies_updated_by;
ALTER TABLE gauge_rnr_studies DROP CONSTRAINT IF EXISTS fk_gauge_rnr_studies_deleted_by;

-- Revert integrity constraints for calibration_matrices
ALTER TABLE calibration_matrices DROP CONSTRAINT IF EXISTS fk_calibration_matrices_tenant;
ALTER TABLE calibration_matrices DROP CONSTRAINT IF EXISTS fk_calibration_matrices_company;
ALTER TABLE calibration_matrices DROP CONSTRAINT IF EXISTS fk_calibration_matrices_created_by;
ALTER TABLE calibration_matrices DROP CONSTRAINT IF EXISTS fk_calibration_matrices_updated_by;
ALTER TABLE calibration_matrices DROP CONSTRAINT IF EXISTS fk_calibration_matrices_deleted_by;

-- Revert integrity constraints for apqp_project_timelines
ALTER TABLE apqp_project_timelines DROP CONSTRAINT IF EXISTS fk_apqp_project_timelines_tenant;
ALTER TABLE apqp_project_timelines DROP CONSTRAINT IF EXISTS fk_apqp_project_timelines_company;
ALTER TABLE apqp_project_timelines DROP CONSTRAINT IF EXISTS fk_apqp_project_timelines_created_by;
ALTER TABLE apqp_project_timelines DROP CONSTRAINT IF EXISTS fk_apqp_project_timelines_updated_by;
ALTER TABLE apqp_project_timelines DROP CONSTRAINT IF EXISTS fk_apqp_project_timelines_deleted_by;

-- Revert integrity constraints for apqp_milestones
ALTER TABLE apqp_milestones DROP CONSTRAINT IF EXISTS fk_apqp_milestones_tenant;
ALTER TABLE apqp_milestones DROP CONSTRAINT IF EXISTS fk_apqp_milestones_company;
ALTER TABLE apqp_milestones DROP CONSTRAINT IF EXISTS fk_apqp_milestones_created_by;
ALTER TABLE apqp_milestones DROP CONSTRAINT IF EXISTS fk_apqp_milestones_updated_by;
ALTER TABLE apqp_milestones DROP CONSTRAINT IF EXISTS fk_apqp_milestones_deleted_by;

-- Revert integrity constraints for spc_studies
ALTER TABLE spc_studies DROP CONSTRAINT IF EXISTS fk_spc_studies_tenant;
ALTER TABLE spc_studies DROP CONSTRAINT IF EXISTS fk_spc_studies_company;
ALTER TABLE spc_studies DROP CONSTRAINT IF EXISTS fk_spc_studies_created_by;
ALTER TABLE spc_studies DROP CONSTRAINT IF EXISTS fk_spc_studies_updated_by;
ALTER TABLE spc_studies DROP CONSTRAINT IF EXISTS fk_spc_studies_deleted_by;

-- Revert integrity constraints for quotations
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_tenant;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_company;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_created_by;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_updated_by;
ALTER TABLE quotations DROP CONSTRAINT IF EXISTS fk_quotations_deleted_by;

-- Revert integrity constraints for cost_calculations
ALTER TABLE cost_calculations DROP CONSTRAINT IF EXISTS fk_cost_calculations_tenant;
ALTER TABLE cost_calculations DROP CONSTRAINT IF EXISTS fk_cost_calculations_company;
ALTER TABLE cost_calculations DROP CONSTRAINT IF EXISTS fk_cost_calculations_created_by;
ALTER TABLE cost_calculations DROP CONSTRAINT IF EXISTS fk_cost_calculations_updated_by;
ALTER TABLE cost_calculations DROP CONSTRAINT IF EXISTS fk_cost_calculations_deleted_by;

-- Revert integrity constraints for project_cost_analysis
ALTER TABLE project_cost_analysis DROP CONSTRAINT IF EXISTS fk_project_cost_analysis_tenant;
ALTER TABLE project_cost_analysis DROP CONSTRAINT IF EXISTS fk_project_cost_analysis_company;
ALTER TABLE project_cost_analysis DROP CONSTRAINT IF EXISTS fk_project_cost_analysis_created_by;
ALTER TABLE project_cost_analysis DROP CONSTRAINT IF EXISTS fk_project_cost_analysis_updated_by;
ALTER TABLE project_cost_analysis DROP CONSTRAINT IF EXISTS fk_project_cost_analysis_deleted_by;

-- Revert integrity constraints for workflow_definitions
ALTER TABLE workflow_definitions DROP CONSTRAINT IF EXISTS fk_workflow_definitions_tenant;
ALTER TABLE workflow_definitions DROP CONSTRAINT IF EXISTS fk_workflow_definitions_company;
ALTER TABLE workflow_definitions DROP CONSTRAINT IF EXISTS fk_workflow_definitions_created_by;
ALTER TABLE workflow_definitions DROP CONSTRAINT IF EXISTS fk_workflow_definitions_updated_by;
ALTER TABLE workflow_definitions DROP CONSTRAINT IF EXISTS fk_workflow_definitions_deleted_by;

-- Revert integrity constraints for workflow_steps
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS fk_workflow_steps_tenant;
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS fk_workflow_steps_company;
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS fk_workflow_steps_created_by;
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS fk_workflow_steps_updated_by;
ALTER TABLE workflow_steps DROP CONSTRAINT IF EXISTS fk_workflow_steps_deleted_by;

-- Revert integrity constraints for workflow_instances
ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS fk_workflow_instances_tenant;
ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS fk_workflow_instances_company;
ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS fk_workflow_instances_created_by;
ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS fk_workflow_instances_updated_by;
ALTER TABLE workflow_instances DROP CONSTRAINT IF EXISTS fk_workflow_instances_deleted_by;

-- Revert integrity constraints for workflow_history
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS fk_workflow_history_tenant;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS fk_workflow_history_company;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS fk_workflow_history_created_by;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS fk_workflow_history_updated_by;
ALTER TABLE workflow_history DROP CONSTRAINT IF EXISTS fk_workflow_history_deleted_by;

-- Revert integrity constraints for job_work_challans
ALTER TABLE job_work_challans DROP CONSTRAINT IF EXISTS fk_job_work_challans_tenant;
ALTER TABLE job_work_challans DROP CONSTRAINT IF EXISTS fk_job_work_challans_company;
ALTER TABLE job_work_challans DROP CONSTRAINT IF EXISTS fk_job_work_challans_created_by;
ALTER TABLE job_work_challans DROP CONSTRAINT IF EXISTS fk_job_work_challans_updated_by;
ALTER TABLE job_work_challans DROP CONSTRAINT IF EXISTS fk_job_work_challans_deleted_by;

-- Revert integrity constraints for vendor_quality_scores
ALTER TABLE vendor_quality_scores DROP CONSTRAINT IF EXISTS fk_vendor_quality_scores_tenant;
ALTER TABLE vendor_quality_scores DROP CONSTRAINT IF EXISTS fk_vendor_quality_scores_company;
ALTER TABLE vendor_quality_scores DROP CONSTRAINT IF EXISTS fk_vendor_quality_scores_created_by;
ALTER TABLE vendor_quality_scores DROP CONSTRAINT IF EXISTS fk_vendor_quality_scores_updated_by;
ALTER TABLE vendor_quality_scores DROP CONSTRAINT IF EXISTS fk_vendor_quality_scores_deleted_by;

-- Revert integrity constraints for supplier_scorecards
ALTER TABLE supplier_scorecards DROP CONSTRAINT IF EXISTS fk_supplier_scorecards_tenant;
ALTER TABLE supplier_scorecards DROP CONSTRAINT IF EXISTS fk_supplier_scorecards_company;
ALTER TABLE supplier_scorecards DROP CONSTRAINT IF EXISTS fk_supplier_scorecards_created_by;
ALTER TABLE supplier_scorecards DROP CONSTRAINT IF EXISTS fk_supplier_scorecards_updated_by;
ALTER TABLE supplier_scorecards DROP CONSTRAINT IF EXISTS fk_supplier_scorecards_deleted_by;

-- Revert integrity constraints for supplier_ncrs
ALTER TABLE supplier_ncrs DROP CONSTRAINT IF EXISTS fk_supplier_ncrs_tenant;
ALTER TABLE supplier_ncrs DROP CONSTRAINT IF EXISTS fk_supplier_ncrs_company;
ALTER TABLE supplier_ncrs DROP CONSTRAINT IF EXISTS fk_supplier_ncrs_created_by;
ALTER TABLE supplier_ncrs DROP CONSTRAINT IF EXISTS fk_supplier_ncrs_updated_by;
ALTER TABLE supplier_ncrs DROP CONSTRAINT IF EXISTS fk_supplier_ncrs_deleted_by;

-- Revert integrity constraints for supplier_audits
ALTER TABLE supplier_audits DROP CONSTRAINT IF EXISTS fk_supplier_audits_tenant;
ALTER TABLE supplier_audits DROP CONSTRAINT IF EXISTS fk_supplier_audits_company;
ALTER TABLE supplier_audits DROP CONSTRAINT IF EXISTS fk_supplier_audits_created_by;
ALTER TABLE supplier_audits DROP CONSTRAINT IF EXISTS fk_supplier_audits_updated_by;
ALTER TABLE supplier_audits DROP CONSTRAINT IF EXISTS fk_supplier_audits_deleted_by;

-- Revert integrity constraints for tooling_projects
ALTER TABLE tooling_projects DROP CONSTRAINT IF EXISTS fk_tooling_projects_tenant;
ALTER TABLE tooling_projects DROP CONSTRAINT IF EXISTS fk_tooling_projects_company;
ALTER TABLE tooling_projects DROP CONSTRAINT IF EXISTS fk_tooling_projects_created_by;
ALTER TABLE tooling_projects DROP CONSTRAINT IF EXISTS fk_tooling_projects_updated_by;
ALTER TABLE tooling_projects DROP CONSTRAINT IF EXISTS fk_tooling_projects_deleted_by;

-- Revert integrity constraints for tool_assets
ALTER TABLE tool_assets DROP CONSTRAINT IF EXISTS fk_tool_assets_tenant;
ALTER TABLE tool_assets DROP CONSTRAINT IF EXISTS fk_tool_assets_company;
ALTER TABLE tool_assets DROP CONSTRAINT IF EXISTS fk_tool_assets_created_by;
ALTER TABLE tool_assets DROP CONSTRAINT IF EXISTS fk_tool_assets_updated_by;
ALTER TABLE tool_assets DROP CONSTRAINT IF EXISTS fk_tool_assets_deleted_by;

-- Revert integrity constraints for tooling_life_logs
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS fk_tooling_life_logs_tenant;
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS fk_tooling_life_logs_company;
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS fk_tooling_life_logs_created_by;
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS fk_tooling_life_logs_updated_by;
ALTER TABLE tooling_life_logs DROP CONSTRAINT IF EXISTS fk_tooling_life_logs_deleted_by;

-- Revert integrity constraints for refurbishment_tickets
ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS fk_refurbishment_tickets_tenant;
ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS fk_refurbishment_tickets_company;
ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS fk_refurbishment_tickets_created_by;
ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS fk_refurbishment_tickets_updated_by;
ALTER TABLE refurbishment_tickets DROP CONSTRAINT IF EXISTS fk_refurbishment_tickets_deleted_by;

-- Revert integrity constraints for drawing_vault_documents
ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS fk_drawing_vault_documents_tenant;
ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS fk_drawing_vault_documents_company;
ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS fk_drawing_vault_documents_created_by;
ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS fk_drawing_vault_documents_updated_by;
ALTER TABLE drawing_vault_documents DROP CONSTRAINT IF EXISTS fk_drawing_vault_documents_deleted_by;

