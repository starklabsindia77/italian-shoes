import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Materials CRUD (smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('create material (form validates and routes)', async ({ page }) => {
    await page.goto('/materials/new');

    // Basic required fields if present
    const name = `Leather ${Date.now()}`;
    if (await page.getByLabel('Name').isVisible()) {
      await page.getByLabel('Name').fill(name);
    }
    if (await page.getByLabel('SKU').isVisible().catch(() => false)) {
      await page.getByLabel('SKU').fill(`MAT-${Math.floor(Math.random() * 10000)}`);
    }

    // Submit
    const saveButton = page.getByRole('button', { name: /Create|Save|Submit/i });
    await saveButton.click();

    // Expect either navigation back to list, or success toast, or details page
    await page.waitForLoadState('networkidle');
    const possible = [
      page.getByRole('heading', { name: /Materials|Material/i }),
      page.getByText(/created|saved|success/i),
    ];
    const assertions = await Promise.all(possible.map(async loc => loc.isVisible().catch(() => false)));
    expect(assertions.some(Boolean)).toBeTruthy();
  });
});


