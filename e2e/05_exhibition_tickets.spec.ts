import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.6: Virtual Exhibitions
 * - Buyer purchases ticket token using internal credits and receives unique pass
 * - VIP viewing window enforcement:
 *   1. BEFORE VIP Window: Standard ticket holder can access open hall without VIP restriction
 *   2. DURING VIP Window: Standard pass is restricted by #vip-restriction-view; upgrade to VIP unlocks hall
 *   3. AFTER VIP Window: Lapsed VIP window allows standard pass holder unrestricted hall access
 * - Responsive verification across Desktop, Tablet 768px, and Mobile 360px
 */
test.describe('Acceptance Criteria 3.6: Exhibition Ticket Token & VIP Window Enforcement', () => {
  test.describe.configure({ mode: 'serial' });

  test('buyer purchases exhibition access and receives unique ticket pass', async ({ page }) => {
    test.setTimeout(90000);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const collector = {
      name: `Passholder Collector ${uniqueId}`,
      email: `collector_${uniqueId}@nakshi.test`,
      password: 'Password123!',
      role: 'BUYER',
      bio: 'Collector exploring heritage textiles and virtual halls.',
    };

    // 1. Register new buyer
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(collector.name);
    await page.locator('#email').fill(collector.email);
    await page.locator('#password').fill(collector.password);
    await page.locator('#bio').fill(collector.bio);
    await page.locator('#register-submit-btn').click();

    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('0.00');

    // 2. Top-up internal credits
    await page.locator('#dashboard-topup-btn').click();
    const topUpModal = page.locator('#topup-credits-modal');
    await expect(topUpModal).toBeVisible();

    await page.locator('#preset-package-500-btn').click();
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(topUpModal).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('500.00');

    // 3. Navigate to Exhibitions catalog
    await page.goto('/exhibitions');
    await expect(page.locator('#exhibitions-filter-all')).toBeVisible({ timeout: 15000 });

    // Select the live exhibition (Threads of Bengal)
    const activeExhibitionCard = page.locator('article:has-text("Threads of Bengal")');
    await expect(activeExhibitionCard).toBeVisible({ timeout: 10000 });
    await activeExhibitionCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-hall-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // 4. Reserve Exhibition Pass via Modal
    await page.locator('#unlock-exhibition-ticket-btn').click();
    const buyModal = page.locator('#buy-ticket-modal');
    await expect(buyModal).toBeVisible();

    // Select standard pass and purchase
    await page.locator('#select-standard-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();

    // Verify digital ticket card generation
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#ticket-token-badge')).toContainText('NK-EXH-');

    const ticketToken = (await page.locator('#ticket-token-badge').innerText()).trim();
    expect(ticketToken).toMatch(/^NK-EXH-/);

    // Close modal to enter virtual hall
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();
    await expect(page.locator('#active-ticket-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('restricts VIP exhibition access during VIP window and verifies lifecycle before, during, and after window', async ({
    page,
  }) => {
    test.setTimeout(90000);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const vipCollector = {
      name: `VIP Collector ${uniqueId}`,
      email: `vip_collector_${uniqueId}@nakshi.test`,
      password: 'Password123!',
      role: 'BUYER',
      bio: 'High-tier collector accessing private preview halls.',
    };

    // 1. Register a VIP collector
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(vipCollector.name);
    await page.locator('#email').fill(vipCollector.email);
    await page.locator('#password').fill(vipCollector.password);
    await page.locator('#bio').fill(vipCollector.bio);
    await page.locator('#register-submit-btn').click();

    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });

    // 2. Top-up internal credits
    await page.locator('#dashboard-topup-btn').click();
    const topUpModal = page.locator('#topup-credits-modal');
    await expect(topUpModal).toBeVisible();

    await page.locator('#preset-package-500-btn').click();
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(topUpModal).not.toBeVisible({ timeout: 15000 });

    // ==========================================
    // PHASE 1: DURING VIP WINDOW
    // ==========================================
    await page.goto('/exhibitions');
    await page.locator('#exhibitions-filter-vip').click();

    const vipCard = page.locator('article:has-text("Royal Muslin & Masterpiece Jamdani Retrospective")');
    await expect(vipCard).toBeVisible({ timeout: 10000 });
    await vipCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // Reserve Standard Pass first during active VIP window
    await page.locator('#unlock-exhibition-ticket-btn').click();
    const buyModal = page.locator('#buy-ticket-modal');
    await expect(buyModal).toBeVisible();

    await page.locator('#select-standard-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();

    // Standard pass holder is strictly restricted by VIP restriction screen
    await expect(page.locator('#vip-restriction-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#vip-restriction-view')).toContainText('VIP Collector Window Active');
    await expect(page.locator('button[id^="wall-tab-"]')).toHaveCount(0);

    // Responsive verification of VIP restriction screen
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#vip-restriction-view')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('#vip-restriction-view')).toBeVisible();

    // Reset back to Desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // Upgrade to VIP pass
    await page.locator('#vip-restriction-view button:has-text("Upgrade to VIP Pass")').click();
    await expect(buyModal).toBeVisible();

    // Select VIP pass and confirm upgrade
    await page.locator('#select-vip-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#digital-pass-card')).toContainText('VIP Pass');

    // Enter hall with VIP pass
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();

    // Access is granted: VIP badge shown and gallery walls are visible
    await expect(page.locator('#vip-restriction-view')).not.toBeVisible();
    await expect(page.locator('#active-ticket-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-ticket-badge')).toContainText('VIP Collector Pass');
    await expect(page.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // PHASE 2: BEFORE VIP WINDOW
    // ==========================================
    await page.goto('/exhibitions');
    await page.locator('#exhibitions-filter-all').click();

    const beforeVipCard = page.locator('article:has-text("Sonargaon Loom & Silk Heritage")');
    await expect(beforeVipCard).toBeVisible({ timeout: 10000 });
    await beforeVipCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // Buy standard pass
    await page.locator('#unlock-exhibition-ticket-btn').click();
    await expect(buyModal).toBeVisible();
    await page.locator('#select-standard-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });

    // Enter hall: Before VIP window, standard pass holder enters directly without restriction
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();
    await expect(page.locator('#vip-restriction-view')).not.toBeVisible();
    await expect(page.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });

    // ==========================================
    // PHASE 3: AFTER VIP WINDOW
    // ==========================================
    await page.goto('/exhibitions');
    await page.locator('#exhibitions-filter-all').click();

    const afterVipCard = page.locator('article:has-text("Threads of Bengal")');
    await expect(afterVipCard).toBeVisible({ timeout: 10000 });
    await afterVipCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // Buy standard pass
    await page.locator('#unlock-exhibition-ticket-btn').click();
    await expect(buyModal).toBeVisible();
    await page.locator('#select-standard-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });

    // Enter hall: VIP window lapsed, standard pass holder enters directly without #vip-restriction-view
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();
    await expect(page.locator('#vip-restriction-view')).not.toBeVisible();
    await expect(page.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });
  });
});
