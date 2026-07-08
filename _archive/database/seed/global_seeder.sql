CREATE TABLE IF NOT EXISTS inventory_items (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0.0,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(15, 4) NOT NULL DEFAULT 0.0,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transactions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL REFERENCES inventory_items(id),
    type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUSTMENT
    quantity DECIMAL(15, 4) NOT NULL,
    reference_type VARCHAR(50), -- e.g., PURCHASE_ORDER, WORK_ORDER
    reference_id VARCHAR(36),
    notes TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX idx_stock_tx_item ON stock_transactions(item_id);
CREATE TABLE IF NOT EXISTS inventory_delivery_challans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    challan_number VARCHAR(100) NOT NULL,
    client VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    vehicle_num VARCHAR(100) NOT NULL,
    dispatch_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE inventory_items ADD COLUMN expiry_date TIMESTAMP;

CREATE TABLE warehouses (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE cycle_counts (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    warehouse_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    completed_date TIMESTAMP,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE abc_analysis (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    item_id VARCHAR(36) PRIMARY KEY,
    tier VARCHAR(10) NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    calculated_at TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS material_heat_numbers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    item_id VARCHAR(36) NOT NULL,
    heat_number VARCHAR(100) NOT NULL,
    supplier_po VARCHAR(100),
    received_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

CREATE TABLE IF NOT EXISTS material_certificates (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    heat_number_id VARCHAR(36) NOT NULL,
    certificate_url VARCHAR(255),
    chemical_properties TEXT,
    mechanical_properties TEXT,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (heat_number_id) REFERENCES material_heat_numbers(id)
);
ALTER TABLE inventory_items ADD COLUMN bin VARCHAR(50);
CREATE TABLE IF NOT EXISTS job_work_challans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    challan_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID NOT NULL,
    process VARCHAR(100) NOT NULL,
    project_id VARCHAR(50) NOT NULL,
    part_details TEXT NOT NULL,
    qty_sent INTEGER NOT NULL,
    qty_received INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL,
    expected_eta TIMESTAMP,
    issued_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_quality_scores (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    vendor_id UUID PRIMARY KEY,
    vendor_name VARCHAR(255) NOT NULL,
    total_jobs INTEGER NOT NULL DEFAULT 0,
    on_time_delivery_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    quality_acceptance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS supplier_scorecards (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    ppm NUMERIC NOT NULL,
    delivery_performance NUMERIC NOT NULL,
    overall_score NUMERIC NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_ncrs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    challan_id UUID,
    issue_date TIMESTAMP NOT NULL,
    defect_qty INT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supplier_audits (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL,
    audit_date TIMESTAMP NOT NULL,
    auditor VARCHAR(100) NOT NULL,
    score NUMERIC NOT NULL,
    findings TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shifts (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_jobs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    machine_id INT NOT NULL,
    shift_id INT REFERENCES shifts(id),
    status VARCHAR(50) DEFAULT 'PLANNED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    quantity_produced INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS downtime_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id INT NOT NULL,
    job_id INT REFERENCES production_jobs(id),
    reason TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS travelers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    job_id INT NOT NULL REFERENCES production_jobs(id),
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS traveler_stages (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    traveler_id INT NOT NULL REFERENCES travelers(id),
    stage_name VARCHAR(100) NOT NULL,
    operator_id INT,
    machine_id INT,
    status VARCHAR(50) DEFAULT 'PENDING',
    digital_signature VARCHAR(255),
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS machine_capacities (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id INT NOT NULL,
    category VARCHAR(100) NOT NULL,
    max_hours_per_day NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_schedules (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id INT NOT NULL,
    job_id INT NOT NULL REFERENCES production_jobs(id),
    scheduled_date DATE NOT NULL,
    scheduled_hours NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS machine_telemetry_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oee_daily_metrics (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id SERIAL PRIMARY KEY,
    machine_id INT NOT NULL,
    date VARCHAR(10) NOT NULL,
    availability NUMERIC(10,4) NOT NULL,
    performance NUMERIC(10,4) NOT NULL,
    quality NUMERIC(10,4) NOT NULL,
    oee_score NUMERIC(10,4) NOT NULL,
    planned_production_time NUMERIC(10,4) NOT NULL,
    operating_time NUMERIC(10,4) NOT NULL,
    total_pieces INT NOT NULL,
    good_pieces INT NOT NULL,
    ideal_run_rate NUMERIC(10,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Global Seeder for ToolRoom ERP

-- CRM

-- 000001_init.up.sql
CREATE TABLE IF NOT EXISTS pfmeas (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    process_step VARCHAR(255) NOT NULL,
    failure_mode VARCHAR(255) NOT NULL,
    severity INT NOT NULL,
    occurrence INT NOT NULL,
    detection INT NOT NULL,
    rpn INT NOT NULL,
    action_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS control_plans (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    operation_number VARCHAR(100) NOT NULL,
    characteristic VARCHAR(255) NOT NULL,
    specification VARCHAR(255) NOT NULL,
    measurement_method VARCHAR(255) NOT NULL,
    sample_quantity INT NOT NULL,
    sample_frequency VARCHAR(100) NOT NULL,
    control_method VARCHAR(255) NOT NULL,
    reaction_plan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gauge_rnrs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    appraiser_count INT NOT NULL,
    trial_count INT NOT NULL,
    part_count INT NOT NULL,
    ev DOUBLE PRECISION NOT NULL,
    av DOUBLE PRECISION NOT NULL,
    rnr DOUBLE PRECISION NOT NULL,
    study_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fais (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    work_order_id UUID NOT NULL,
    inspector_id UUID NOT NULL,
    inspection_date TIMESTAMP WITH TIME ZONE NOT NULL,
    result VARCHAR(50) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 000002_ppap.up.sql
CREATE TABLE IF NOT EXISTS ppap_submissions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    submission_level INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    customer_approval BOOLEAN NOT NULL DEFAULT FALSE,
    submission_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dimensional_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    characteristic_id UUID NOT NULL,
    measurement DOUBLE PRECISION NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_certifications (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    material_spec VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    heat_number VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS capability_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    characteristic_id UUID NOT NULL,
    cpk DOUBLE PRECISION NOT NULL,
    ppk DOUBLE PRECISION NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appearance_approval_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    color VARCHAR(100) NOT NULL,
    texture VARCHAR(100) NOT NULL,
    master_number VARCHAR(100) NOT NULL,
    is_acceptable BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS process_flow_diagrams (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    document_url VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS psws (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES ppap_submissions(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) NOT NULL,
    engineering_level VARCHAR(100),
    weight DOUBLE PRECISION,
    declaration TEXT,
    authorized_by VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 000003_complaints_apqp.up.sql
CREATE TABLE IF NOT EXISTS customer_complaints (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    product_id UUID NOT NULL,
    description TEXT,
    status VARCHAR(50),
    reported_date TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eight_d_reports (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    complaint_id UUID NOT NULL,
    d1_team TEXT,
    d2_problem TEXT,
    d3_ica TEXT,
    d4_rca TEXT,
    d5_pca TEXT,
    d6_implement TEXT,
    d7_prevent TEXT,
    d8_recognize TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apqp_gate_reviews (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    gate INT,
    status VARCHAR(50),
    review_date TIMESTAMP,
    reviewer VARCHAR(255),
    comments TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS open_risk_trackers (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    risk_detail TEXT,
    status VARCHAR(50),
    mitigation TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gauge_rnr_studies (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    conducted_by VARCHAR(255),
    study_date TIMESTAMP,
    result TEXT,
    is_acceptable BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibration_matrices (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    gauge_id UUID NOT NULL,
    last_calibration TIMESTAMP,
    next_calibration TIMESTAMP,
    status VARCHAR(50),
    certificate_url VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 000004_apqp_advanced.up.sql
CREATE TABLE IF NOT EXISTS apqp_project_timelines (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    target_completion_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apqp_milestones (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    timeline_id VARCHAR(36) NOT NULL,
    milestone_name VARCHAR(255) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    target_date TIMESTAMP NOT NULL,
    actual_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 000001_init.up.sql
CREATE TABLE IF NOT EXISTS machines (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 000002_predictive_maintenance.up.sql
CREATE TABLE IF NOT EXISTS preventive_maintenance_schedules (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    machine_id UUID NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    spindle_hours_threshold NUMERIC(10, 2) NOT NULL,
    last_spindle_hours_checked NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);

-- Inventory
INSERT INTO inventory_items (id, tenant_id, sku, name, description, item_type, quantity, unit, unit_price, location)
VALUES
('i1111111-1111-1111-1111-111111111111', 'default-tenant', 'RAW-AL-6061', 'Aluminum 6061 Block', 'Raw material block', 'RAW_MATERIAL', 500, 'KG', 5.50, 'Warehouse A-1'),
('i2222222-2222-2222-2222-222222222222', 'default-tenant', 'TOOL-EM-001', 'End Mill 10mm Carbide', 'Cutting tool', 'CONSUMABLE', 50, 'PCS', 45.00, 'Tool Crib 1')
ON CONFLICT DO NOTHING;

-- Production Shifts
INSERT INTO shifts (id, name, start_time, end_time) 
VALUES 
(1, 'Morning Shift', '06:00:00', '14:00:00'),
(2, 'Evening Shift', '14:00:00', '22:00:00'),
(3, 'Night Shift', '22:00:00', '06:00:00')
ON CONFLICT DO NOTHING;

-- Production Jobs
INSERT INTO production_jobs (id, tenant_id, order_id, machine_id, shift_id, status, quantity_produced)
VALUES
(1, 'default-tenant', 1001, 1, 1, 'IN_PROGRESS', 50),
(2, 'default-tenant', 1002, 2, 1, 'PLANNED', 0)
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS infractions (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    detail TEXT,
    severity VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Postgres RLS Policies injected automatically
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_items;
CREATE POLICY tenant_isolation_policy ON inventory_items USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON stock_transactions;
CREATE POLICY tenant_isolation_policy ON stock_transactions USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE inventory_delivery_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON inventory_delivery_challans;
CREATE POLICY tenant_isolation_policy ON inventory_delivery_challans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON warehouses;
CREATE POLICY tenant_isolation_policy ON warehouses USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE cycle_counts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON cycle_counts;
CREATE POLICY tenant_isolation_policy ON cycle_counts USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE abc_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON abc_analysis;
CREATE POLICY tenant_isolation_policy ON abc_analysis USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE material_heat_numbers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_heat_numbers;
CREATE POLICY tenant_isolation_policy ON material_heat_numbers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE material_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certificates;
CREATE POLICY tenant_isolation_policy ON material_certificates USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE job_work_challans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON job_work_challans;
CREATE POLICY tenant_isolation_policy ON job_work_challans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE vendor_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON vendor_quality_scores;
CREATE POLICY tenant_isolation_policy ON vendor_quality_scores USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE supplier_scorecards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_scorecards;
CREATE POLICY tenant_isolation_policy ON supplier_scorecards USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE supplier_ncrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_ncrs;
CREATE POLICY tenant_isolation_policy ON supplier_ncrs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE supplier_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_audits;
CREATE POLICY tenant_isolation_policy ON supplier_audits USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON shifts;
CREATE POLICY tenant_isolation_policy ON shifts USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_jobs;
CREATE POLICY tenant_isolation_policy ON production_jobs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE downtime_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON downtime_logs;
CREATE POLICY tenant_isolation_policy ON downtime_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON travelers;
CREATE POLICY tenant_isolation_policy ON travelers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE traveler_stages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON traveler_stages;
CREATE POLICY tenant_isolation_policy ON traveler_stages USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE machine_capacities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_capacities;
CREATE POLICY tenant_isolation_policy ON machine_capacities USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE production_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON production_schedules;
CREATE POLICY tenant_isolation_policy ON production_schedules USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE machine_telemetry_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machine_telemetry_logs;
CREATE POLICY tenant_isolation_policy ON machine_telemetry_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE oee_daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON oee_daily_metrics;
CREATE POLICY tenant_isolation_policy ON oee_daily_metrics USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE pfmeas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON pfmeas;
CREATE POLICY tenant_isolation_policy ON pfmeas USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE control_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON control_plans;
CREATE POLICY tenant_isolation_policy ON control_plans USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE gauge_rnrs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnrs;
CREATE POLICY tenant_isolation_policy ON gauge_rnrs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE fais ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON fais;
CREATE POLICY tenant_isolation_policy ON fais USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE ppap_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON ppap_submissions;
CREATE POLICY tenant_isolation_policy ON ppap_submissions USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE dimensional_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON dimensional_reports;
CREATE POLICY tenant_isolation_policy ON dimensional_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE material_certifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON material_certifications;
CREATE POLICY tenant_isolation_policy ON material_certifications USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE capability_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON capability_reports;
CREATE POLICY tenant_isolation_policy ON capability_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE appearance_approval_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON appearance_approval_reports;
CREATE POLICY tenant_isolation_policy ON appearance_approval_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE process_flow_diagrams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON process_flow_diagrams;
CREATE POLICY tenant_isolation_policy ON process_flow_diagrams USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE psws ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON psws;
CREATE POLICY tenant_isolation_policy ON psws USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE customer_complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON customer_complaints;
CREATE POLICY tenant_isolation_policy ON customer_complaints USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE eight_d_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON eight_d_reports;
CREATE POLICY tenant_isolation_policy ON eight_d_reports USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE apqp_gate_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_gate_reviews;
CREATE POLICY tenant_isolation_policy ON apqp_gate_reviews USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE open_risk_trackers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON open_risk_trackers;
CREATE POLICY tenant_isolation_policy ON open_risk_trackers USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE gauge_rnr_studies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON gauge_rnr_studies;
CREATE POLICY tenant_isolation_policy ON gauge_rnr_studies USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE calibration_matrices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON calibration_matrices;
CREATE POLICY tenant_isolation_policy ON calibration_matrices USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE apqp_project_timelines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_project_timelines;
CREATE POLICY tenant_isolation_policy ON apqp_project_timelines USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE apqp_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON apqp_milestones;
CREATE POLICY tenant_isolation_policy ON apqp_milestones USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON machines;
CREATE POLICY tenant_isolation_policy ON machines USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON maintenance_logs;
CREATE POLICY tenant_isolation_policy ON maintenance_logs USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON preventive_maintenance_schedules;
CREATE POLICY tenant_isolation_policy ON preventive_maintenance_schedules USING (tenant_id = current_setting('app.current_tenant', true));

ALTER TABLE infractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON infractions;
CREATE POLICY tenant_isolation_policy ON infractions USING (tenant_id = current_setting('app.current_tenant', true));

CREATE TABLE IF NOT EXISTS quotations (
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'default-tenant',
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    rfq_code VARCHAR(100),
    project_name VARCHAR(255),
    material VARCHAR(255) DEFAULT 'H13 Steel',
    weight NUMERIC(10, 2) DEFAULT 0,
    total_hours NUMERIC(10, 2) DEFAULT 0,
    total_estimated_cost NUMERIC(12, 2) DEFAULT 0,
    final_price NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_policy ON quotations;
CREATE POLICY tenant_isolation_policy ON quotations USING (tenant_id = current_setting('app.current_tenant', true));



-- Secondary Performance Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_tenant ON stock_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_delivery_challans_tenant ON inventory_delivery_challans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cycle_counts_tenant ON cycle_counts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_abc_analysis_tenant ON abc_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_heat_numbers_tenant ON material_heat_numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_certificates_tenant ON material_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_work_challans_tenant ON job_work_challans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_quality_scores_tenant ON vendor_quality_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_scorecards_tenant ON supplier_scorecards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ncrs_tenant ON supplier_ncrs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_audits_tenant ON supplier_audits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_tenant ON production_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_downtime_logs_tenant ON downtime_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_travelers_tenant ON travelers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_traveler_stages_tenant ON traveler_stages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_machine_capacities_tenant ON machine_capacities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_production_schedules_tenant ON production_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_machine_telemetry_logs_tenant ON machine_telemetry_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_oee_daily_metrics_tenant ON oee_daily_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pfmeas_tenant ON pfmeas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_control_plans_tenant ON control_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gauge_rnrs_tenant ON gauge_rnrs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fais_tenant ON fais(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ppap_submissions_tenant ON ppap_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dimensional_reports_tenant ON dimensional_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_material_certifications_tenant ON material_certifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_capability_reports_tenant ON capability_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appearance_approval_reports_tenant ON appearance_approval_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_process_flow_diagrams_tenant ON process_flow_diagrams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_psws_tenant ON psws(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_complaints_tenant ON customer_complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_eight_d_reports_tenant ON eight_d_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apqp_gate_reviews_tenant ON apqp_gate_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_open_risk_trackers_tenant ON open_risk_trackers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gauge_rnr_studies_tenant ON gauge_rnr_studies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calibration_matrices_tenant ON calibration_matrices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apqp_project_timelines_tenant ON apqp_project_timelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_apqp_milestones_tenant ON apqp_milestones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_machines_tenant ON machines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_tenant ON maintenance_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_preventive_maintenance_schedules_tenant ON preventive_maintenance_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_infractions_tenant ON infractions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_code ON quotations(rfq_code);
CREATE INDEX IF NOT EXISTS idx_eight_d_reports_complaint ON eight_d_reports(complaint_id);
