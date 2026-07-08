-- KTAS Demo Seeder Script

-- CREATE MISSING TABLES THAT GORM MIGHT NOT HAVE CREATED YET
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'ktas-tenant-001',
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    status VARCHAR(50),
    account_manager VARCHAR(100),
    website VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfqs (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'ktas-tenant-001',
    rfq_code VARCHAR(100) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    part_name VARCHAR(255) NOT NULL,
    estimated_value DECIMAL(15,2),
    stage VARCHAR(50),
    priority VARCHAR(50),
    days_left INT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    draw_number VARCHAR(100),
    spec_notes TEXT
);

CREATE TABLE IF NOT EXISTS finance_invoices (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'ktas-tenant-001',
    invoice_number VARCHAR(100) NOT NULL,
    customer_id VARCHAR(36) NOT NULL,
    total DECIMAL(15,2),
    status VARCHAR(50),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_infractions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL DEFAULT 'ktas-tenant-001',
    title VARCHAR(255),
    description TEXT,
    severity VARCHAR(50),
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Master Data: Customers
INSERT INTO customers (id, tenant_id, name, industry, status, account_manager, website, address) 
VALUES 
('a1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'Tata Motors', 'Automotive', 'ACTIVE', 'Rahul S.', 'www.tatamotors.com', 'Pune, Maharashtra'),
('a2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'Mahindra Tractors', 'Agriculture', 'ACTIVE', 'Rahul S.', 'www.mahindra.com', 'Mumbai, Maharashtra'),
('a3333333-3333-3333-3333-333333333333', 'ktas-tenant-001', 'Cummins India', 'Engine Gensets', 'ACTIVE', 'Sanjay P.', 'www.cummins.com', 'Kothrud, Pune')
ON CONFLICT (id) DO NOTHING;

-- 2. Master Data: Machines
INSERT INTO machines (id, tenant_id, name, model, status)
VALUES
('b1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'CNC VMC-01', 'Haas VF-2', 'ACTIVE'),
('b2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'Wire EDM-02', 'Makino U6', 'ACTIVE'),
('b3333333-3333-3333-3333-333333333333', 'ktas-tenant-001', '500T Stamping Press', 'Komatsu 500T', 'ACTIVE'),
('b4444444-4444-4444-4444-444444444444', 'ktas-tenant-001', '250T Press', 'Aida 250T', 'MAINTENANCE'),
('b5555555-5555-5555-5555-555555555555', 'ktas-tenant-001', 'SPM Assembly Station 1', 'KTAS Custom SPM', 'ACTIVE'),
('b6666666-6666-6666-6666-666666666666', 'ktas-tenant-001', 'Welding Cell A', 'Panasonic Robotic', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Master Data: Inventory
INSERT INTO inventory_items (id, tenant_id, sku, name, description, item_type, quantity, unit, unit_price, location)
VALUES
('a1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'RM-MS-COIL-01', 'Mild Steel Coil 2mm', 'Sheet metal coil for blanking', 'RAW_MATERIAL', 2500, 'KG', 65.00, 'Raw Material Yard'),
('a2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'RM-D3-STEEL', 'Die Steel Block D3', 'Tool steel for die manufacturing', 'RAW_MATERIAL', 120, 'KG', 250.00, 'Tool Room Storage'),
('a-3333-3333-3333-333333333333', 'ktas-tenant-001', 'FG-GENSET-ENC', 'Genset Enclosure Body', 'Batch produced stamped enclosure', 'FINISHED_GOOD', 450, 'PCS', 1200.00, 'Dispatch Bay 1'),
('a-4444-4444-4444-444444444444', 'ktas-tenant-001', 'FG-AGRI-BRK', 'Agri Equipment Bracket', 'Stamped mounting bracket', 'FINISHED_GOOD', 1500, 'PCS', 45.00, 'Dispatch Bay 2')
ON CONFLICT DO NOTHING;

-- 4. CRM: RFQs
INSERT INTO rfqs (id, tenant_id, rfq_code, customer_id, part_name, estimated_value, stage, priority, days_left, draw_number, spec_notes)
VALUES
('a1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'RFQ-KTAS-001', 'a1111111-1111-1111-1111-111111111111', 'Progressive Die for Auto Bracket', 450000.00, 'ESTIMATING', 'HIGH', 3, 'DRW-AUTO-101', 'Requires D3 tool steel.'),
('a2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'RFQ-KTAS-002', 'a3333333-3333-3333-3333-333333333333', 'Batch Production: Genset Enclosures', 1250000.00, 'QUOTED', 'MEDIUM', 5, 'DRW-GEN-204', 'Requires 2mm MS Sheet.')
ON CONFLICT (id) DO NOTHING;

-- 5. Quality: Customer Complaints
INSERT INTO customer_complaints (id, tenant_id, customer_id, product_id, description, status, reported_date)
VALUES
('d1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'a3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Excessive burrs found on the stamped edges of the enclosure. Requires die sharpening.', 'OPEN', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- 6. Maintenance: Die Sharpening Log
INSERT INTO maintenance_logs (id, tenant_id, machine_id, type, status, description)
VALUES
('e1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'b3333333-3333-3333-3333-333333333333', 'PREVENTIVE', 'SCHEDULED', 'Remove Progressive Die for sharpening due to burr formation on Genset Enclosures.')
ON CONFLICT (id) DO NOTHING;

-- 7. Subcontracting: Job Work Challan
INSERT INTO job_work_challans (id, tenant_id, challan_number, vendor_id, process, project_id, part_details, qty_sent, status, issued_by)
VALUES
('f1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'CH-KTAS-001', 'a3333333-3333-3333-3333-333333333333', 'Powder Coating', 'PRJ-01', 'Genset Enclosure', 450, 'DISPATCHED', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 8. Dashboard KPIs: Production Jobs
INSERT INTO production_jobs (id, tenant_id, order_id, machine_id, shift_id, status, quantity_produced)
VALUES
(1001, 'ktas-tenant-001', 2001, 1, 1, 'IN_PROGRESS', 150),
(1002, 'ktas-tenant-001', 2002, 3, 1, 'PLANNED', 0),
(1003, 'ktas-tenant-001', 2003, 6, 2, 'IN_PROGRESS', 50)
ON CONFLICT (id) DO NOTHING;

-- 9. Dashboard KPIs: Finance Invoices
INSERT INTO finance_invoices (id, tenant_id, invoice_number, customer_id, total, status)
VALUES
('f1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'INV-KTAS-001', 'a1111111-1111-1111-1111-111111111111', 125000.00, 'PAID'),
('f2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'INV-KTAS-002', 'a2222222-2222-2222-2222-222222222222', 450000.00, 'PAID'),
('f3333333-3333-3333-3333-333333333333', 'ktas-tenant-001', 'INV-KTAS-003', 'a3333333-3333-3333-3333-333333333333', 75000.00, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- 10. Dashboard KPIs: Audit Infractions
INSERT INTO audit_infractions (id, tenant_id, title, description, severity, resolved)
VALUES
('a1111111-1111-1111-1111-111111111111', 'ktas-tenant-001', 'Safety Violation', 'Operator not wearing PPE near 500T Press', 'HIGH', false),
('a2222222-2222-2222-2222-222222222222', 'ktas-tenant-001', 'ISO Non-Compliance', 'Missing calibration sticker on Vernier Caliper', 'MEDIUM', false)
ON CONFLICT (id) DO NOTHING;
