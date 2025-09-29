import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Products CRUD (smoke)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('open new product page and validate primary sections', async ({ page }) => {
    await page.goto('/products/new');
    for (const heading of [
      /New Product|Create Product/i,
      /Details|Basic Info/i,
      /Pricing/i,
      /Options|Variants/i,
    ]) {
      await expect(page.getByRole('heading', { name: heading as any })).toBeVisible();
    }
  });
});


