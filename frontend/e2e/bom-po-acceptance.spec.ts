import { test, expect } from '@playwright/test';

test.describe('BOM to PO Acceptance Flow', () => {
  let projectId: string;
  let bomId: string;
  let materialId: string;
  const projectNumber = `ACC-PRJ-${Date.now()}`;

  test.beforeAll(async ({ request }) => {
    // 0. Login to get auth token/cookie
    const loginRes = await request.post('http://127.0.0.1:4000/api/v1/auth/login', {
      data: { email: 'admin@toolroom.com', password: 'password123' }
    });
    
    // Playwright `request` context automatically stores the cookies from the response!
    // We can also extract the token if needed, but assuming cookies are used.
    const loginData = await loginRes.json();
    const token = loginData.access_token || loginData.token;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // 1. Setup Test Data via API to save UI interaction time and flakes
    // Get a plant
    const plantRes = await request.get('http://127.0.0.1:4000/api/v1/master-data/plants', { headers });
    const plants = (await plantRes.json()).data || await plantRes.json();
    const plantId = plants[0]?.id || 'PL-01';

    // Get a customer
    const custRes = await request.get('http://127.0.0.1:4000/api/v1/master-data/customers', { headers });
    const customers = (await custRes.json()).data || await custRes.json();
    const customerId = customers[0]?.id || 'CUST-01';

    // Create Project
    const projRes = await request.post('http://127.0.0.1:4000/api/v1/projects', {
      headers,
      data: { projectNumber, partName: 'Acceptance Part', plantId, customerId, status: 'DRAFT', currentStage: 'ENGINEERING', priority: 'MEDIUM' }
    });
    const projData = await projRes.json();
    projectId = projData.data?.id || projData.id;

    // Get a material
    const matRes = await request.get('http://127.0.0.1:4000/api/v1/master-data/materials', { headers });
    const materials = (await matRes.json()).data || await matRes.json();
    materialId = materials[0]?.id;

    // Create BOM
    const bomRes = await request.post(`http://127.0.0.1:4000/api/v1/projects/${projectId}/bom`, {
      headers,
      data: {
        items: [{
          materialId,
          dimensions: '75x75x75',
          hsnCode: 'HSN-ACC',
          gstPercent: 12,
          requiredQty: 10,
          estimatedCost: 150,
          rawSize: '50',
          calculatedWeight: 10
        }]
      }
    });
    const bomData = await bomRes.json();
    bomId = bomData.data?.id || bomData.id;

    // Get or Create Vendor
    const vendRes = await request.get('http://127.0.0.1:4000/api/v1/master-data/vendors', { headers });
    let vendors = (await vendRes.json()).data || await vendRes.json();
    if (!vendors || vendors.length === 0) {
       await request.post('http://127.0.0.1:4000/api/v1/master-data/vendors', {
         headers,
         data: { vendorName: 'Test Vendor', vendorCode: 'VEND-' + Date.now(), vendorType: 'MATERIAL_SUPPLIER', status: 'ACTIVE' }
       });
    }

    // Approve BOM to trigger Auto-PO
    await request.put(`http://127.0.0.1:4000/api/v1/projects/${projectId}/bom/${bomId}/approve`, { headers });
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@toolroom.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page.locator('text=Mission Control').first()).toBeVisible({ timeout: 30000 });
  });

  test('Auto-generated PO contains BOM details and can be edited', async ({ page }) => {
    // 1. Navigate to Project Purchase tab
    await page.goto(`/projects/${projectId}/purchase`);
    // Wait for page to load - 'Procurement & Sourcing' is a header
    await expect(page.locator('h2', { hasText: /Procurement/i }).first()).toBeVisible({ timeout: 15000 });

    // 2. Find the Auto PO for this project
    // Look for PO with number starting with PO-AUTO
    const poCard = page.locator('div', { has: page.locator('h3', { hasText: /PO-AUTO/ }) }).first();
    await expect(poCard).toBeVisible({ timeout: 15000 });

    // 3. Open the PO (click on the edit button on the PO card)
    await poCard.getByTitle('Edit Purchase Order').click();
    
    // Wait for Drawer/Modal to open
    await expect(page.locator('button', { hasText: /Save Changes/i })).toBeVisible({ timeout: 10000 });

    // 4. Verify Dimensions, HSN, and GST are present in the PO items inputs
    await expect(page.locator('input[placeholder="Dim (LxWxH)"]').first()).toHaveValue('75x75x75');
    await expect(page.locator('input[placeholder="HSN"]').first()).toHaveValue('HSN-ACC');
    await expect(page.locator('input[placeholder="GST %"]').first()).toHaveValue('12');

    // 5. Edit the PO
    const rateInput = page.locator('input[placeholder="Rate"]').first();
    await rateInput.fill('200');

    // Save changes
    const saveBtn = page.getByRole('button', { name: /Save Changes/i });
    await saveBtn.click();

    // Verify modal closes
    await expect(page.locator('button', { hasText: /Save Changes/i })).not.toBeVisible({ timeout: 10000 });
  });
});
