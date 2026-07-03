-- Enable RLS and create isolation policies for all multi-tenant tables

ALTER TABLE abc_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON abc_analysis;
CREATE POLICY tenant_isolation_policy ON abc_analysis
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE analytics_kpis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_kpis;
CREATE POLICY tenant_isolation_policy ON analytics_kpis
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE analytics_machine_utilization ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_machine_utilization;
CREATE POLICY tenant_isolation_policy ON analytics_machine_utilization
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE analytics_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_revenue;
CREATE POLICY tenant_isolation_policy ON analytics_revenue
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE analytics_vendor_defects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON analytics_vendor_defects;
CREATE POLICY tenant_isolation_policy ON analytics_vendor_defects
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE appearance_approval_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON appearance_approval_reports;
CREATE POLICY tenant_isolation_policy ON appearance_approval_reports
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE apqp_gate_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_gate_reviews;
CREATE POLICY tenant_isolation_policy ON apqp_gate_reviews
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE apqp_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_milestones;
CREATE POLICY tenant_isolation_policy ON apqp_milestones
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE apqp_project_timelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_project_timelines;
CREATE POLICY tenant_isolation_policy ON apqp_project_timelines
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE audit_infractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON audit_infractions;
CREATE POLICY tenant_isolation_policy ON audit_infractions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE calibration_matrices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON calibration_matrices;
CREATE POLICY tenant_isolation_policy ON calibration_matrices
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE capability_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON capability_reports;
CREATE POLICY tenant_isolation_policy ON capability_reports
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE change_impact_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_impact_analyses;
CREATE POLICY tenant_isolation_policy ON change_impact_analyses
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE change_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_notices;
CREATE POLICY tenant_isolation_policy ON change_notices
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON change_requests;
CREATE POLICY tenant_isolation_policy ON change_requests
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON companies;
CREATE POLICY tenant_isolation_policy ON companies
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE control_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON control_plans;
CREATE POLICY tenant_isolation_policy ON control_plans
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE customer_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON customer_complaints;
CREATE POLICY tenant_isolation_policy ON customer_complaints
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON customers;
CREATE POLICY tenant_isolation_policy ON customers
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE cycle_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON cycle_counts;
CREATE POLICY tenant_isolation_policy ON cycle_counts
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON departments;
CREATE POLICY tenant_isolation_policy ON departments
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE dimensional_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON dimensional_reports;
CREATE POLICY tenant_isolation_policy ON dimensional_reports
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE downtime_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON downtime_logs;
CREATE POLICY tenant_isolation_policy ON downtime_logs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE eight_d_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON eight_d_reports;
CREATE POLICY tenant_isolation_policy ON eight_d_reports
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE fais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON fais;
CREATE POLICY tenant_isolation_policy ON fais
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE finance_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON finance_invoices;
CREATE POLICY tenant_isolation_policy ON finance_invoices
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE gauge_rnr_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnr_studies;
CREATE POLICY tenant_isolation_policy ON gauge_rnr_studies
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE gauge_rnrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnrs;
CREATE POLICY tenant_isolation_policy ON gauge_rnrs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON infractions;
CREATE POLICY tenant_isolation_policy ON infractions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE inventory_delivery_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_delivery_challans;
CREATE POLICY tenant_isolation_policy ON inventory_delivery_challans
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_items;
CREATE POLICY tenant_isolation_policy ON inventory_items
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE job_work_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON job_work_challans;
CREATE POLICY tenant_isolation_policy ON job_work_challans
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE machine_capacities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_capacities;
CREATE POLICY tenant_isolation_policy ON machine_capacities
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE machine_telemetry_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_telemetry_logs;
CREATE POLICY tenant_isolation_policy ON machine_telemetry_logs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machines;
CREATE POLICY tenant_isolation_policy ON machines
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON maintenance_logs;
CREATE POLICY tenant_isolation_policy ON maintenance_logs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE material_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certificates;
CREATE POLICY tenant_isolation_policy ON material_certificates
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE material_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certifications;
CREATE POLICY tenant_isolation_policy ON material_certifications
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE material_heat_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_heat_numbers;
CREATE POLICY tenant_isolation_policy ON material_heat_numbers
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON modules;
CREATE POLICY tenant_isolation_policy ON modules
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE oee_daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON oee_daily_metrics;
CREATE POLICY tenant_isolation_policy ON oee_daily_metrics
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE open_risk_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON open_risk_trackers;
CREATE POLICY tenant_isolation_policy ON open_risk_trackers
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON permissions;
CREATE POLICY tenant_isolation_policy ON permissions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE pfmeas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON pfmeas;
CREATE POLICY tenant_isolation_policy ON pfmeas
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON plants;
CREATE POLICY tenant_isolation_policy ON plants
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE ppap_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON ppap_submissions;
CREATE POLICY tenant_isolation_policy ON ppap_submissions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON preventive_maintenance_schedules;
CREATE POLICY tenant_isolation_policy ON preventive_maintenance_schedules
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE process_flow_diagrams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON process_flow_diagrams;
CREATE POLICY tenant_isolation_policy ON process_flow_diagrams
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_jobs;
CREATE POLICY tenant_isolation_policy ON production_jobs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_schedules;
CREATE POLICY tenant_isolation_policy ON production_schedules
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE psws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON psws;
CREATE POLICY tenant_isolation_policy ON psws
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON rfqs;
CREATE POLICY tenant_isolation_policy ON rfqs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON role_permissions;
CREATE POLICY tenant_isolation_policy ON role_permissions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON roles;
CREATE POLICY tenant_isolation_policy ON roles
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON sessions;
CREATE POLICY tenant_isolation_policy ON sessions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON shifts;
CREATE POLICY tenant_isolation_policy ON shifts
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON stock_transactions;
CREATE POLICY tenant_isolation_policy ON stock_transactions
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE supplier_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_audits;
CREATE POLICY tenant_isolation_policy ON supplier_audits
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE supplier_ncrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_ncrs;
CREATE POLICY tenant_isolation_policy ON supplier_ncrs
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE supplier_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_scorecards;
CREATE POLICY tenant_isolation_policy ON supplier_scorecards
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE traveler_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON traveler_stages;
CREATE POLICY tenant_isolation_policy ON traveler_stages
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON travelers;
CREATE POLICY tenant_isolation_policy ON travelers
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON user_roles;
CREATE POLICY tenant_isolation_policy ON user_roles
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE vendor_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON vendor_quality_scores;
CREATE POLICY tenant_isolation_policy ON vendor_quality_scores
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON warehouses;
CREATE POLICY tenant_isolation_policy ON warehouses
    USING (tenant_id = current_setting('app.current_tenant', true)::varchar);

