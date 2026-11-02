import { test, expect } from '@playwright/test';
import { prisma } from '../server/src/config/prisma';

/**
 * Acceptance Criteria 3.6: Virtual Exhibitions
 * - Organizer creates exhibition and configures gallery layout
 * - VIP viewing window schedule configuration and validation
 * - Buyer purchases VIP access pass using internal credits
 * - Timestamp-based VIP access restriction enforcement
 */
test.describe('Acceptance Criteria 3.6: Virtual Exhibitions & VIP Access Gating', () => {
  let organizerEmail: string;
  const organizerPassword = 'Password123!';
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let createdExhibitionUrl: string;

  test.beforeAll(() => {
    organizerEmail = `curator_ac36_${uniqueId}@nakshi.test`;
  });

  test('organizer configures VIP schedule and views curatorial gallery preview', async ({ page }) => {
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

    // 8. Capture exhibition URL from View Gallery link
    const viewBtn = page.locator('a[id^="view-exhibition-btn-"]').first();
    const href = await viewBtn.getAttribute('href');
    expect(href).toBeTruthy();
    createdExhibitionUrl = href!;

    // 9. Organizer enters virtual exhibition gallery (curatorial access)
    await viewBtn.click();
    await expect(page).toHaveURL(new RegExp(createdExhibitionUrl), { timeout: 10000 });
    await expect(page.locator('#exhibition-page-title')).toBeVisible();
    await page.locator('#enter-exhibition-btn').click();
    await expect(page.locator('#virtual-gallery-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#gallery-access-badge')).toContainText('Curatorial Preview');
  });

  test('buyer purchases VIP pass with credits and is restricted outside configured VIP window', async ({ page }) => {
    const testSeed = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // 1. Seed exhibition with future VIP viewing window via Prisma
    const seedOrganizer = await prisma.user.create({
      data: {
        name: `Curator Seed ${testSeed}`,
        email: `curator_seed_${testSeed}@nakshi.test`,
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
        role: 'ORGANIZER',
      },
    });

    const now = new Date();
    const futureVipStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const futureVipEnd = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const futureStart = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const futureEnd = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);

    const seededExhibition = await prisma.exhibition.create({
      data: {
        title: `Pre-Commencement Vernissage ${testSeed}`,
        description: 'Exhibition exploring royal kantha quilts and gold zari embroidery.',
        ticketPrice: 20.0,
        startTime: futureStart,
        endTime: futureEnd,
        vipStartTime: futureVipStart,
        vipEndTime: futureVipEnd,
        organizerId: seedOrganizer.id,
      },
    });

    // 2. Register as BUYER
    const buyerEmail = `collector_buyer_${testSeed}@nakshi.test`;
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(`Collector Buyer ${testSeed}`);
    await page.locator('#email').fill(buyerEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });

    // 3. Fund buyer's internal credit wallet
    const buyerUser = await prisma.user.findUnique({ where: { email: buyerEmail } });
    expect(buyerUser).toBeDefined();
    await prisma.wallet.update({
      where: { userId: buyerUser!.id },
      data: { balance: 500.0 },
    });

    // 4. Navigate to the virtual exhibition page
    await page.goto(`/exhibitions/${seededExhibition.id}`);
    await expect(page.locator('#exhibition-page-title')).toHaveText(seededExhibition.title, { timeout: 10000 });
    await expect(page.locator('#exhibition-vip-status-chip')).toBeVisible();

    // 5. Purchase VIP Early Access Pass
    await page.locator('#buy-vip-ticket-btn').click();
    await expect(page.locator('#ticket-purchase-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#my-ticket-badge')).toBeVisible();
    await expect(page.locator('#my-ticket-badge')).toContainText('VIP Early Access Pass');

    // 6. Attempt to enter before VIP window commences (enforce timestamp restriction)
    await page.locator('#enter-exhibition-btn').click();
    await expect(page.locator('#vip-access-restricted-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#vip-access-restricted-banner')).toContainText(
      'VIP Viewing Window Has Not Commenced'
    );
  });
});
