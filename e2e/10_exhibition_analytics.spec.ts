import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('Password123!');
  await page.locator('#login-submit-btn').click();
}

test.describe('Sprint 5 BL-025: Exhibition Analytics Report (T-083)', () => {
  test('organizer opens the analytics report from the dashboard', async ({ page }) => {
    await login(page, 'organizer@nakshi.test');
    await expect(page).toHaveURL(/\/dashboard\/organizer/);

    const analyticsBtn = page.locator('[id^="exhibition-analytics-btn-"]').first();
    await expect(analyticsBtn).toBeVisible({ timeout: 10000 });
    await analyticsBtn.click();

    await expect(page).toHaveURL(/\/dashboard\/organizer\/exhibitions\/.+\/analytics/);
    await expect(page.locator('#analytics-report-title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#analytics-visitor-traffic')).toBeVisible();
    await expect(page.locator('#analytics-average-viewing-time')).toBeVisible();
    await expect(page.locator('#analytics-ticket-revenue')).toBeVisible();
  });

  test('buyer cannot open the analytics report', async ({ page }) => {
    await login(page, 'buyer@nakshi.test');
    await expect(page).toHaveURL(/\/dashboard\/buyer/);

    await page.goto('/dashboard/organizer/exhibitions/any-id/analytics');
    await expect(page.locator('body')).toContainText('Access Restricted');
  });
});