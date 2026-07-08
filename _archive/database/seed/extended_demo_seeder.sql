-- Extended Demo Data Seeder for 8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1

-- Variables for random UUIDs will be evaluated inline by Postgres 16 gen_random_uuid()

-- 1. Insert more Quality / APQP data
INSERT INTO apqp_project_timelines (id, tenant_id, product_id, status, start_date, target_completion_date)
VALUES 
(gen_random_uuid()::varchar, '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a3333333-3333-3333-3333-333333333333', 'IN_PROGRESS', NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days'),
(gen_random_uuid()::varchar, '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a1111111-1111-1111-1111-111111111111', 'PLANNING', NOW() - INTERVAL '5 days', NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

INSERT INTO fais (id, tenant_id, product_id, work_order_id, inspector_id, inspection_date, result, remarks)
VALUES 
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a3333333-3333-3333-3333-333333333333', gen_random_uuid(), gen_random_uuid(), NOW() - INTERVAL '2 days', 'PASS', 'Dimensional tolerances met.'),
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a-4444-4444-4444-444444444444', gen_random_uuid(), gen_random_uuid(), NOW() - INTERVAL '1 days', 'REJECT', 'Surface finish non-compliant.')
ON CONFLICT DO NOTHING;

INSERT INTO pfmeas (id, tenant_id, product_id, process_step, failure_mode, severity, occurrence, detection, rpn, action_plan)
VALUES 
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a3333333-3333-3333-3333-333333333333', 'Sheet Stamping', 'Micro-cracks on bending radius', 8, 4, 3, 96, 'Increase bend radius tool by 0.5mm'),
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'a3333333-3333-3333-3333-333333333333', 'Welding', 'Porosity in weld seam', 7, 3, 2, 42, 'Implement automated gas flow monitoring')
ON CONFLICT DO NOTHING;

-- 2. Insert more Production Data
INSERT INTO production_jobs (tenant_id, order_id, machine_id, status, quantity_produced)
VALUES 
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 5001, 1, 'IN_PROGRESS', 1500),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 5002, 2, 'COMPLETED', 500),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 5003, 3, 'PLANNED', 0)
ON CONFLICT DO NOTHING;

INSERT INTO oee_daily_metrics (tenant_id, machine_id, date, availability, performance, quality, oee_score, planned_production_time, operating_time, total_pieces, good_pieces, ideal_run_rate)
VALUES 
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 1, to_char(NOW(), 'YYYY-MM-DD'), 85.5, 90.0, 99.5, 76.5, 480, 410, 1000, 995, 60),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 2, to_char(NOW(), 'YYYY-MM-DD'), 92.0, 88.5, 98.0, 79.8, 480, 441, 500, 490, 30),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 1, to_char(NOW() - INTERVAL '1 day', 'YYYY-MM-DD'), 88.0, 91.0, 99.0, 79.2, 480, 422, 1050, 1039, 60),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 2, to_char(NOW() - INTERVAL '1 day', 'YYYY-MM-DD'), 80.0, 85.0, 97.0, 65.9, 480, 384, 450, 436, 30)
ON CONFLICT DO NOTHING;

INSERT INTO downtime_logs (tenant_id, machine_id, reason, started_at, ended_at)
VALUES 
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 1, 'Tool Change', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3.5 hours'),
('8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 2, 'Material Shortage', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- 3. Insert Procurement / Vendor Data
INSERT INTO supplier_scorecards (id, tenant_id, vendor_id, period_start, period_end, ppm, delivery_performance, overall_score)
VALUES 
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', gen_random_uuid(), NOW() - INTERVAL '30 days', NOW(), 120, 98.5, 95.0),
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', gen_random_uuid(), NOW() - INTERVAL '30 days', NOW(), 500, 85.0, 72.5)
ON CONFLICT DO NOTHING;

-- 4. Audit & Infractions
INSERT INTO infractions (id, tenant_id, title, detail, severity, category, status)
VALUES 
(gen_random_uuid()::varchar, '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Fire Extinguisher Expired', 'Extinguisher near welding cell A expired last month.', 'HIGH', 'SAFETY', 'OPEN'),
(gen_random_uuid()::varchar, '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'Missing 5S Tags', 'Shadow board missing tools on assembly line 1.', 'LOW', '5S', 'OPEN')
ON CONFLICT DO NOTHING;

-- 5. Maintenance
INSERT INTO maintenance_logs (id, tenant_id, machine_id, type, status, description, scheduled_at)
VALUES 
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'b4444444-4444-4444-4444-444444444444', 'BREAKDOWN', 'IN_PROGRESS', 'Hydraulic leak on main cylinder', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), '8f7b5cb0-6fb5-48ef-b4b1-e2be67d264e1', 'b5555555-5555-5555-5555-555555555555', 'PREVENTIVE', 'SCHEDULED', 'Quarterly lubrication and alignment', NOW() + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
