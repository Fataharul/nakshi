import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.6: Virtual Exhibitions
 * - Buyer purchases ticket token using internal credits and receives unique pass
 * - Token validation input in foyer reception validates valid pass and unlocks hall
 * - Invalid, empty, or mismatched tokens are rejected with inline feedback
 * - Direct navigation via URL query ?token=... auto-validates and unlocks hall
 * - VIP viewing window enforcement (VIP preview hall restricts standard ticket and admits VIP ticket)
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

      // Test 5c: Verify URL parameter auto-validation in another fresh page
      const autoContext = await browser.newContext();
      const autoPage = await autoContext.newPage();
      try {
        await autoPage.goto(`${exhibitionUrl}?token=${encodeURIComponent(ticketToken)}`);
        // Hall automatically unlocks without manual input
        await expect(autoPage.locator('#active-ticket-badge')).toBeVisible({ timeout: 15000 });
        await expect(autoPage.locator('#active-ticket-badge')).toContainText(ticketToken);
        await expect(autoPage.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });
      } finally {
        await autoContext.close();
      }
    } finally {
      await guestContext.close();
    }
  });

  test('restricts VIP exhibition access outside configured VIP window', async ({ page }) => {
    test.setTimeout(90000);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const vipCollector = {
      name: `VIP Collector ${uniqueId}`,
      email: `vip_collector_${uniqueId}@nakshi.test`,
      password: 'Password123!',
      role: 'BUYER',
      bio: 'Collector of royal and museum-grade masterworks.',
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

    // 3. Navigate to VIP Preview exhibition
    await page.goto('/exhibitions');
    await page.locator('#exhibitions-filter-vip').click();

    const vipCard = page.locator('article:has-text("Royal Muslin & Masterpiece Jamdani")');
    await expect(vipCard).toBeVisible({ timeout: 10000 });
    await vipCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // 4. Reserve Standard Pass first to test VIP window lock
    await page.locator('#unlock-exhibition-ticket-btn').click();
    const buyModal = page.locator('#buy-ticket-modal');
    await expect(buyModal).toBeVisible();

    await page.locator('#select-standard-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();

    // Since VIP window is active, standard pass holder is restricted
    await expect(page.locator('#vip-restriction-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#vip-restriction-view')).toContainText('VIP Collector Window Active');

    // 5. Upgrade to VIP pass
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

    // Access is granted: VIP pill is shown and gallery walls are visible
    await expect(page.locator('#vip-restriction-view')).not.toBeVisible();
    await expect(page.locator('#active-ticket-badge')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#active-ticket-badge')).toContainText('VIP Collector Pass');
    await expect(page.locator('button[id^="wall-tab-"]').first()).toBeVisible({ timeout: 10000 });
  });
});
