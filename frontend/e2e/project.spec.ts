import { test, expect } from '@playwright/test';

test.describe('Project Management System Tests', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120000);
    // Login before each test
    await page.goto('/login');
    await expect(page.locator('h1', { hasText: 'ToolRoomOS' })).toBeVisible({ timeout: 30000 });
    
    await page.locator('input[type="email"]').fill('admin@toolroom.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();
    
    // Wait for dashboard to load
    await expect(page.locator('text=Mission Control').first()).toBeVisible({ timeout: 30000 });
  });

  test('User can create a new project and view it in the dashboard', async ({ page }) => {
    // 1. Navigate to Projects page
    await page.locator('a[href="/projects"]').click();
    await expect(page).toHaveURL(/.*\/projects/);

    // 2. Wait for projects page to load completely
    await expect(page.locator('h1', { hasText: 'Active Projects' })).toBeVisible({ timeout: 15000 });

    // 3. Click the "Initialize Project" button
    const initBtn = page.getByRole('button', { name: /Initialize Project/i });
    await expect(initBtn).toBeVisible({ timeout: 15000 });
    await initBtn.click();

    // 4. Fill out the project creation form
    await expect(page.locator('h2', { hasText: 'Initialize Mission' })).toBeVisible({ timeout: 10000 });

    const projectNumberInput = page.locator('input').nth(0);
    const partNameInput = page.locator('input').nth(1);
    
    const uniqueProjectNumber = `PRJ-E2E-${Date.now()}`;
    await projectNumberInput.fill(uniqueProjectNumber);
    await partNameInput.fill('E2E Test Part');

    // 5. Submit the form
    const launchBtn = page.getByRole('button', { name: /Launch Project/i });
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // 6. Wait for modal to disappear
    await expect(page.locator('h2', { hasText: 'Initialize Mission' })).not.toBeVisible({ timeout: 15000 });

    // 7. Verify the new project appears in the list (wait for text of unique project number)
    const newProjectCard = page.locator(`text=${uniqueProjectNumber}`).first();
    await expect(newProjectCard).toBeVisible({ timeout: 15000 });
  });
});
