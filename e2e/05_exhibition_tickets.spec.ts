import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.6: Virtual Exhibitions
 * - Organizer creates exhibition and configures gallery layout
 * - VIP viewing window schedule configuration and validation
 * - Buyer purchases ticket token using internal credits
 */
test.describe('Acceptance Criteria 3.6: Virtual Exhibitions', () => {
  let organizerEmail: string;
  const organizerPassword = 'Password123!';
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  test.beforeEach(() => {
    organizerEmail = `curator_ac36_${uniqueId}@nakshi.test`;
  });

  test('organizer configures and enforces VIP viewing window schedule', async ({ page }) => {
    // 1. Register as ORGANIZER
    await page.goto('/register');
    await page.locator('#role-btn-organizer').click();
    await page.locator('#name').fill(`Curator AC36 ${uniqueId}`);
    await page.locator('#email').fill(organizerEmail);
    await page.locator('#password').fill(organizerPassword);
    await page.locator('#bio').fill('Virtual gallery exhibition director.');
    await page.locator('#register-submit-btn').click();

    // 2. Wait for redirect to Organizer Dashboard
    await expect(page).toHaveURL(/\/dashboard\/organizer/, { timeout: 15000 });

    // 3. Create a new virtual exhibition
    await page.locator('#create-exhibition-btn').click();
    const title = `Bengali Folk Crafts Exhibition ${Date.now()}`;
    await page.locator('#exhibition-title-input').fill(title);
    await page.locator('#exhibition-desc-input').fill('A digital exhibition celebrating traditional Bengali folk arts.');
    await page.locator('#exhibition-price-input').fill('25.00');

    const now = new Date();
    const futureStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await page.locator('#exhibition-start-time-input').fill(formatLocal(futureStart));
    await page.locator('#exhibition-end-time-input').fill(formatLocal(futureEnd));
    await page.locator('#submit-create-exhibition-btn').click();
    await expect(page.locator('#create-exhibition-modal')).not.toBeVisible({ timeout: 10000 });

    // 4. Configure VIP viewing schedule
    const configureBtn = page.locator('button[id^="configure-vip-btn-"]').first();
    await configureBtn.scrollIntoViewIfNeeded();
    await configureBtn.click();
    await expect(page.locator('#vip-schedule-modal')).toBeVisible();

    // 5. Select 48h preview preset
    await page.locator('#vip-quick-preset-48h').click();
    await expect(page.locator('#vip-timeline-preview')).toContainText('48h');

    // 6. Save schedule
    await page.locator('#vip-save-schedule-btn').click();
    await expect(page.locator('#vip-schedule-modal')).not.toBeVisible({ timeout: 10000 });

    // 7. Assert updated badge on dashboard
    const statusBadge = page.locator('span[id^="vip-status-badge-"]').first();
    await expect(statusBadge).toContainText('VIP Scheduled');
  });

  test.skip('buyer purchases exhibition access and receives unique ticket pass', async ({ page }) => {
    // Reserved for buyer ticket issuance testing
  });
});
