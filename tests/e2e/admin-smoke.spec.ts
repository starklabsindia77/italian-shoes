import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

const adminRoutes: Array<{ path: string; heading: string | RegExp }> = [
  { path: '/dashboard', heading: 'Dashboard' },
  { path: '/products', heading: /Products|All Products/i },
  { path: '/products/new', heading: /New Product/i },
  { path: '/materials', heading: /Materials/i },
  { path: '/materials/new', heading: /New Material/i },
  { path: '/sizes', heading: /Sizes/i },
  { path: '/panels', heading: /Panels/i },
  { path: '/panels/new', heading: /New Panel/i },
  { path: '/shipments', heading: /Shipments/i },
  { path: '/shipments/settings', heading: /Shipping Settings|Settings/i },
  { path: '/reports', heading: /Reports/i },
  { path: '/analytics', heading: /Analytics/i },
  { path: '/settings', heading: /Settings/i },
  { path: '/settings/users', heading: /Users/i },
  { path: '/settings/notifications', heading: /Notifications/i },
  { path: '/settings/developer', heading: /Developer/i },
  { path: '/settings/localization', heading: /Localization/i },
  { path: '/settings/payments', heading: /Payments/i },
  { path: '/settings/seo', heading: /SEO/i },
  { path: '/settings/shipping', heading: /Shipping/i },
  { path: '/settings/tax', heading: /Tax/i },
  { path: '/orders', heading: /Orders/i },
];

test.describe('Admin smoke navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  for (const route of adminRoutes) {
    test(`navigates to ${route.path} and sees heading`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.heading as any })).toBeVisible();
    });
  }
});



