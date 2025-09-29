import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows header and quick actions', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Overview of sales, orders, and production pipeline.')).toBeVisible();

    await expect(page.getByRole('button', { name: 'View Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New Product' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    for (const name of ['Manage products', 'Materials', 'Sizes', 'Panels', 'Shipments', 'Settings']) {
      await expect(page.getByRole('link', { name })).toBeVisible();
    }
  });

  test('renders KPI cards', async ({ page }) => {
    for (const label of ['Gross Sales (30d)', 'Orders (30d)', 'In Production', 'Low Stock Variants']) {
      await expect(page.getByRole('heading', { name: label, level: 3 })).toBeVisible();
    }
  });

  test('renders recent orders table and production queue', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Orders' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Order' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Customer' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See all orders →' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Production Queue' })).toBeVisible();
    for (const text of ['Design received', 'In production', 'Quality check', 'Ready to ship', 'Shipped (7d)']) {
      await expect(page.getByText(text)).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'Open board' })).toBeVisible();
  });
});


