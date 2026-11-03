import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.6: Virtual Exhibitions
 * - Buyer purchases ticket token using internal credits and receives unique pass
 * - Token validation input in foyer reception validates valid pass and unlocks hall
 * - Invalid, empty, or mismatched tokens are rejected with inline feedback
 * - Direct navigation via URL query ?token=... auto-validates and unlocks hall
 * - VIP viewing window enforcement:
 *   1. BEFORE VIP Window: Standard ticket holder can access open hall without VIP restriction
 *   2. DURING VIP Window: Standard pass is restricted by #vip-restriction-view; upgrade to VIP unlocks hall
 *   3. AFTER VIP Window: Lapsed VIP window allows standard pass holder unrestricted hall access
 * - Concluded exhibition access gating: blocks access, disables reservations, displays concluded badge
 * - Responsive verification across Desktop, Tablet 768px, and Mobile 360px
 */
test.describe('Acceptance Criteria 3.6: Exhibition Ticket Token Validation & Entry', () => {
  test.describe.configure({ mode: 'serial' });

  test('buyer purchases exhibition access, receives ticket token, and validates token in guest session', async ({
    page,
    browser,
  }) => {
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

    // Verify token validation gate exists in foyer
    await expect(page.locator('#enter-ticket-token-section')).toBeVisible();
    await expect(page.locator('#ticket-token-input')).toBeVisible();
    await expect(page.locator('#validate-ticket-token-btn')).toBeVisible();

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

    // Capture the generated ticket token
    const ticketToken = (await page.locator('#ticket-token-badge').innerText()).trim();
    expect(ticketToken).toMatch(/^NK-EXH-/);

    // Close modal to see authenticated user has access
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(page.locator('#active-ticket-badge')).toBeVisible();
    await expect(page.locator('#active-ticket-badge')).toContainText(ticketToken);

    const exhibitionUrl = page.url();

    // 5. Open a fresh Guest / Incognito Context (no login session)
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    try {
      await guestPage.goto(exhibitionUrl);
      await expect(guestPage.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

      // Test 5a: Attempt validation with an invalid ticket token
      await guestPage.locator('#ticket-token-input').fill('NK-EXH-9999-INVALID-TOKEN');
      await guestPage.locator('#validate-ticket-token-btn').click();

      // Expect inline error banner
      await expect(guestPage.locator('#ticket-validation-error')).toBeVisible({ timeout: 10000 });
      await expect(guestPage.locator('#ticket-validation-error')).toContainText(/Invalid exhibition ticket token/i);

      // Hall remains locked
      await expect(guestPage.locator('#exhibition-foyer-view')).toBeVisible();

      // Test 5b: Enter the genuine ticket token
      await guestPage.locator('#ticket-token-input').fill(ticketToken);
      await guestPage.locator('#validate-ticket-token-btn').click();

      // Expect hall to unlock
      await expect(guestPage.locator('#active-ticket-badge')).toBeVisible({ timeout: 10000 });
      await expect(guestPage.locator('#active-ticket-badge')).toContainText(ticketToken);

      // Verify gallery wall tabs and exhibits are now visible to guest
      const wallTabs = guestPage.locator('button[id^="wall-tab-"]');
      await expect(wallTabs.first()).toBeVisible({ timeout: 10000 });
      expect(await wallTabs.count()).toBeGreaterThan(0);

      // Test 5c: Direct URL deep-link with query parameter ?token=...
      const directUrl = `${exhibitionUrl}?token=${ticketToken}`;
      await guestPage.goto(directUrl);

      // Should automatically validate and unlock hall without clicking validate
      await expect(guestPage.locator('#active-ticket-badge')).toBeVisible({ timeout: 15000 });
      await expect(guestPage.locator('#active-ticket-badge')).toContainText(ticketToken);
      await expect(guestPage.locator('button[id^="wall-tab-"]').first()).toBeVisible();
    } finally {
      await guestContext.close();
    }
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
    // 3. Navigate to VIP Preview exhibition
    await page.goto('/exhibitions');
    await page.locator('#exhibitions-filter-vip').click();

    const vipCard = page.locator('article:has-text("Royal Muslin & Masterpiece Jamdani")');
    await expect(vipCard).toBeVisible({ timeout: 10000 });
    await vipCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // 4. Reserve Standard Pass first during active VIP window
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

  test('blocks access when exhibition period has expired, rendering concluded screen and disabling pass purchase', async ({
    page,
  }) => {
    test.setTimeout(90000);

    // 1. Navigate to Exhibitions catalog
    await page.goto('/exhibitions');
    await expect(page.locator('#exhibitions-filter-all')).toBeVisible({ timeout: 15000 });

    // 2. Select the concluded exhibition
    const concludedCard = page.locator('article:has-text("Ancient Kantha & Silk Archive (Concluded)")');
    await expect(concludedCard).toBeVisible({ timeout: 10000 });
    await concludedCard.locator('[id^="enter-exhibition-btn-"]').click();

    // 3. Verify concluded access block view is displayed
    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-concluded-view')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#exhibition-concluded-badge')).toBeVisible();
    await expect(page.locator('#exhibition-concluded-badge')).toContainText('Exhibition Schedule Concluded');
    await expect(page.locator('#expired-ticket-badge')).toBeVisible();
    await expect(page.locator('#expired-ticket-badge')).toContainText('Viewing Closed');

    // 4. Verify gallery wall tabs and interactive exhibits are strictly blocked
    await expect(page.locator('button[id^="wall-tab-"]')).toHaveCount(0);
    await expect(page.locator('#unlock-exhibition-ticket-btn')).toBeDisabled();
    await expect(page.locator('#unlock-exhibition-ticket-btn')).toContainText('Pass Reservations Closed');

    // 5. Verify responsive layout on Tablet (768px) and Mobile (360px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('#exhibition-concluded-view')).toBeVisible();
    await expect(page.locator('#return-to-catalog-btn')).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    await expect(page.locator('#exhibition-concluded-view')).toBeVisible();
    await expect(page.locator('#return-to-catalog-btn')).toBeVisible();

    // 6. Return to catalog button works
    await page.locator('#return-to-catalog-btn').click();
    await expect(page).toHaveURL(/\/exhibitions/);
    await expect(page.locator('#exhibitions-filter-all')).toBeVisible({ timeout: 10000 });
  });
});
