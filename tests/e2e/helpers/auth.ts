import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  const email = process.env.ADMIN_EMAIL || 'admin@italianshoes.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await page.goto('/login?callbackUrl=%2Fdashboard');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}



