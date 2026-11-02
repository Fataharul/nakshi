import { test, expect } from '@playwright/test';

test.describe('Acceptance Criteria 3.6: VIP Viewing Schedule Configuration Interface', () => {
  let organizerEmail: string;
  const organizerPassword = 'Password123!';
  const organizerName = 'Curator Jahanara';

  test.beforeEach(() => {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    organizerEmail = `curator_jahanara_${uniqueId}@nakshi.test`;
  });

  test('allows an ORGANIZER to configure and save VIP viewing schedule with presets and validation', async ({ page }) => {
    // 1. Register as ORGANIZER
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Join Nakshi');
    
    // Select Organizer role
    await page.locator('#role-btn-organizer').click();
    await page.locator('#name').fill(organizerName);
    await page.locator('#email').fill(organizerEmail);
    await page.locator('#password').fill(organizerPassword);
    await page.locator('#bio').fill('Senior curator specializing in Bengali folk art and handloom tapestries.');
    await page.locator('#register-submit-btn').click();

    // 2. Verify redirect to Organizer Dashboard
    await expect(page).toHaveURL(/\/dashboard\/organizer/, { timeout: 15000 });
    await expect(page.locator('#dashboard-user-name')).toHaveText(organizerName);
    await expect(page.locator('#dashboard-role-badge')).toContainText('Curator');

    // 3. Open Curate Exhibition modal
    await page.locator('#create-exhibition-btn').click();
    await expect(page.locator('#create-exhibition-modal')).toBeVisible();

    // 4. Fill in exhibition details
    const exhibitionTitle = `Heritage Muslin & Kantha Premiere ${Date.now()}`;
    await page.locator('#exhibition-title-input').fill(exhibitionTitle);
    await page.locator('#exhibition-desc-input').fill(
      'An immersive virtual gallery exploring two centuries of exquisite Bengali craft traditions.'
    );
    await page.locator('#exhibition-price-input').fill('35.00');

    // Schedule: 10 days in future to 20 days in future
    const now = new Date();
    const futureStart = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000);
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    await page.locator('#exhibition-start-time-input').fill(formatLocal(futureStart));
    await page.locator('#exhibition-end-time-input').fill(formatLocal(futureEnd));

    // Submit exhibition
    await page.locator('#submit-create-exhibition-btn').click();
    await expect(page.locator('#create-exhibition-modal')).not.toBeVisible({ timeout: 10000 });

    // 5. Verify the exhibition card appears in the grid
    await expect(page.locator('#organizer-exhibitions-grid')).toContainText(exhibitionTitle, { timeout: 10000 });

    // 6. Open the VIP Viewing Schedule Configuration Modal
    const configureBtn = page.locator('button[id^="configure-vip-btn-"]').first();
    await configureBtn.scrollIntoViewIfNeeded();
    await configureBtn.click();
    await expect(page.locator('#vip-schedule-modal')).toBeVisible();
    await expect(page.locator('#vip-modal-title')).toHaveText('VIP Viewing Schedule');

    // 7. Verify all configuration controls are rendered
    await expect(page.locator('#vip-toggle')).toBeAttached();
    await expect(page.locator('#vip-quick-preset-24h')).toBeVisible();
    await expect(page.locator('#vip-quick-preset-48h')).toBeVisible();
    await expect(page.locator('#vip-quick-preset-72h')).toBeVisible();
    await expect(page.locator('#vip-start-time-input')).toBeVisible();
    await expect(page.locator('#vip-end-time-input')).toBeVisible();
    await expect(page.locator('#vip-timeline-preview')).toBeVisible();
    await expect(page.locator('#vip-save-schedule-btn')).toBeVisible();
    await expect(page.locator('#vip-cancel-btn')).toBeVisible();

    // 8. Test Preset Application: Click "48h Preview"
    await page.locator('#vip-quick-preset-48h').click();
    const startVal = await page.locator('#vip-start-time-input').inputValue();
    const endVal = await page.locator('#vip-end-time-input').inputValue();
    expect(startVal).toBeTruthy();
    expect(endVal).toBeTruthy();

    // Verify timeline preview displays duration
    await expect(page.locator('#vip-timeline-preview')).toContainText('48h');
    await expect(page.locator('#vip-status-badge')).toContainText('VIP Scheduled');

    // 9. Test Client-Side Validation Error on Inverted Dates
    // Set end time earlier than start time
    const earlierDate = new Date(new Date(startVal).getTime() - 24 * 60 * 60 * 1000);
    await page.locator('#vip-end-time-input').fill(formatLocal(earlierDate));
    await page.locator('#vip-save-schedule-btn').click();

    // Expect inline human-readable error
    await expect(page.locator('#vip-schedule-error')).toBeVisible();
    await expect(page.locator('#vip-schedule-error')).toContainText('after VIP start time');

    // 10. Correct schedule using "24h Early Access" preset
    await page.locator('#vip-quick-preset-24h').click();
    await expect(page.locator('#vip-schedule-error')).not.toBeVisible();

    // 11. Save the VIP Viewing Schedule
    await page.locator('#vip-save-schedule-btn').click();

    // Expect modal closure upon successful schedule configuration
    await expect(page.locator('#vip-schedule-modal')).not.toBeVisible({ timeout: 10000 });

    // 12. Verify Dashboard card reflects VIP Scheduled status badge and 24h duration
    const statusBadge = page.locator('span[id^="vip-status-badge-"]').first();
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('VIP Scheduled');
    await expect(page.locator('#organizer-exhibitions-grid')).toContainText('24h');
  });
});
