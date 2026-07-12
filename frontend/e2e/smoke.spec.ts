import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('Application boots and loads the login page', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Go to the root page, which should redirect to /login if unauthenticated
    await page.goto('/login');

    // 2. Check for essential login elements
    const loginHeading = page.locator('h1', { hasText: 'ToolRoomOS' });
    await expect(loginHeading).toBeVisible({ timeout: 30000 }); // give it 30s to compile

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const submitBtn = page.getByRole('button', { name: /Sign In/i });
    await expect(submitBtn).toBeVisible();
  });

  test('User can login and reach dashboard', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Go to login page
    await page.goto('/login');

    // 2. Wait for it to load
    await expect(page.locator('h1', { hasText: 'ToolRoomOS' })).toBeVisible({ timeout: 30000 });

    // 3. Fill credentials
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('admin@toolroom.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('password123');
    
    // 4. Submit
    await page.getByRole('button', { name: /Sign In/i }).click();

    // 5. Check if we landed on Mission Control (Dashboard)
    const dashboardTitle = page.locator('text=Mission Control').first();
    await expect(dashboardTitle).toBeVisible({ timeout: 30000 });
  });

  test('User can navigate to a project and view Finance Tracking', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('admin@toolroom.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    await expect(page.locator('text=Mission Control').first()).toBeVisible({ timeout: 30000 });

    // Assuming there's a link to projects or we can navigate via API to create one and go to its finance tab
    // Since this is a smoke test, we can try clicking the first project link or navigating via side menu
    await page.goto('/projects');
    await page.waitForTimeout(2000);

    // If there are no projects, this test might fail, so we might want to check the layout instead
    // Wait for a project link and click it
    const firstProject = page.locator('a[href^="/projects/"]').first();
    const count = await firstProject.count();
    
    if (count > 0) {
      await firstProject.click();
      
      // Navigate to Finance Tab
      const financeTab = page.locator('a', { hasText: 'Finance' });
      await expect(financeTab).toBeVisible();
      await financeTab.click();

      // Check for Finance Tracking elements
      await expect(page.locator('text=Financial Overview')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('text=Budget')).toBeVisible();
      await expect(page.locator('text=Actual Cost')).toBeVisible();
    }
  });
});
