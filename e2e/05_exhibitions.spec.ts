import { test, expect } from '@playwright/test';

/**
 * End-to-End Acceptance Tests: Virtual Exhibitions Module
 * - Navbar responsive navigation to /exhibitions
 * - Public exhibitions catalog browsing & status filters
 * - Unauthenticated/passless visitor foyer reception lock
 * - Registered collector credit-based ticket purchase
 * - Virtual exhibition hall walkthrough, multi-wall navigation & curator spotlight
 */
test.describe('Acceptance Criteria 3.6: Virtual Exhibitions Module', () => {
  test.describe.configure({ mode: 'serial' });

  test('navigates to exhibitions page via navbar across responsive viewports', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize();
    const isMobile = (viewport?.width ?? 1280) < 768;

    if (isMobile) {
      await page.locator('#mobile-menu-toggle').click();
      await expect(page.locator('#mobile-menu-drawer')).toBeVisible();
      await page.locator('#mobile-navbar-exhibitions-link').click();
    } else {
      await page.locator('#navbar-exhibitions-link').click();
    }

    await expect(page).toHaveURL(/\/exhibitions/);
    await expect(page.locator('h1')).toContainText('Sacred Spaces');
    await expect(page.locator('#exhibitions-filter-all')).toBeVisible();
  });

  test('displays exhibitions catalog and filters by live, vip preview, and upcoming', async ({ page }) => {
    await page.goto('/exhibitions');

    // 1. Verify filter buttons exist
    await expect(page.locator('#exhibitions-filter-all')).toBeVisible();
    await expect(page.locator('#exhibitions-filter-active')).toBeVisible();
    await expect(page.locator('#exhibitions-filter-vip')).toBeVisible();
    await expect(page.locator('#exhibitions-filter-upcoming')).toBeVisible();

    // 2. Filter by Currently Live
    await page.locator('#exhibitions-filter-active').click();
    await expect(page.locator('article[id^="exhibition-card-"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('article[id^="exhibition-card-"]').first()).toContainText('Live Hall');

    // 3. Filter by VIP Exclusive
    await page.locator('#exhibitions-filter-vip').click();
    await expect(page.locator('article[id^="exhibition-card-"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('article[id^="exhibition-card-"]').first()).toContainText('VIP Preview');

    // 4. Return to All Exhibitions
    await page.locator('#exhibitions-filter-all').click();
    const allCards = page.locator('article[id^="exhibition-card-"]');
    await expect(allCards.first()).toBeVisible({ timeout: 10000 });

    // Verify exhibition card details (Curator, Title, Countdown, Explore Button)
    const firstCard = allCards.first();
    await expect(firstCard.locator('h2')).toBeVisible();
    await expect(firstCard.locator('text=Curated by')).toBeVisible();
    await expect(firstCard.locator('[id^="enter-exhibition-btn-"]')).toBeVisible();
  });

  test('unauthenticated visitor encounters foyer reception lock with ticket pass prompt', async ({ page }) => {
    await page.goto('/exhibitions');

    // Select the active exhibition
    const activeExhibitionCard = page.locator('article:has-text("Threads of Bengal")');
    await expect(activeExhibitionCard).toBeVisible({ timeout: 10000 });
    await activeExhibitionCard.locator('[id^="enter-exhibition-btn-"]').click();

    // Verify navigation to exhibition room
    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-hall-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#exhibition-hall-title')).toContainText('Threads of Bengal');

    // Verify Foyer / Reception locked screen
    const foyerView = page.locator('#exhibition-foyer-view');
    await expect(foyerView).toBeVisible({ timeout: 15000 });
    await expect(foyerView).toContainText("Curator's Statement");
    await expect(foyerView.locator('#unlock-exhibition-ticket-btn')).toBeVisible();

    // Click Unlock / Reserve button to open admission modal
    await foyerView.locator('#unlock-exhibition-ticket-btn').click();
    const ticketModal = page.locator('#buy-ticket-modal');
    await expect(ticketModal).toBeVisible();
    await expect(ticketModal).toContainText('Exhibition Pass Reservation');
    await expect(page.locator('#select-standard-pass-btn')).toBeVisible();
    await expect(page.locator('#select-vip-pass-btn')).toBeVisible();

    // Close modal
    await ticketModal.locator('button:has(svg.lucide-x)').click();
    await expect(ticketModal).not.toBeVisible();
  });

  test('collector registers, tops up credits, purchases pass, and explores virtual hall walls & spotlight', async ({
    page,
  }) => {
    test.setTimeout(90000);
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const testCollector = {
      name: `Amina Collector ${uniqueId}`,
      email: `amina_${uniqueId}@nakshi.test`,
      password: 'Password123!',
      role: 'BUYER',
      bio: 'Patron of contemporary and heritage Bangladeshi textiles.',
    };

    // 1. Register new buyer
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(testCollector.name);
    await page.locator('#email').fill(testCollector.email);
    await page.locator('#password').fill(testCollector.password);
    await page.locator('#bio').fill(testCollector.bio);
    await page.locator('#register-submit-btn').click();

    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('0.00');

    // 2. Top up credits
    await page.locator('#dashboard-topup-btn').click();
    const topUpModal = page.locator('#topup-credits-modal');
    await expect(topUpModal).toBeVisible();

    await page.locator('#preset-package-500-btn').click();
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(topUpModal).not.toBeVisible({ timeout: 15000 });

    // Verify updated balance
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('500.00');

    // 3. Navigate to Exhibitions catalog
    await page.goto('/exhibitions');
    const exhibitionCard = page.locator('article:has-text("Threads of Bengal")');
    await expect(exhibitionCard).toBeVisible({ timeout: 10000 });
    await exhibitionCard.locator('[id^="enter-exhibition-btn-"]').click();

    await expect(page).toHaveURL(/\/exhibitions\/[a-zA-Z0-9-]+/);
    await expect(page.locator('#exhibition-hall-title')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#exhibition-foyer-view')).toBeVisible({ timeout: 15000 });

    // 4. Open Pass Reservation Modal
    await page.locator('#unlock-exhibition-ticket-btn').click();
    const buyModal = page.locator('#buy-ticket-modal');
    await expect(buyModal).toBeVisible();

    // Verify wallet balance is reflected in modal
    await expect(page.locator('#modal-wallet-balance')).toContainText('500.00');

    // Select VIP collector pass and purchase
    await page.locator('#select-vip-pass-btn').click();
    await page.locator('#confirm-ticket-purchase-btn').click();

    // Verify digital ticket card generation
    await expect(page.locator('#ticket-success-view')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#ticket-token-badge')).toContainText('NK-EXH-');
    await expect(page.locator('#digital-pass-card')).toContainText('VIP Pass');

    // 5. Enter virtual exhibition hall
    await page.locator('#enter-hall-from-modal-btn').click();
    await expect(buyModal).not.toBeVisible();

    // Verify pass status pill in header
    await expect(page.locator('#active-ticket-badge')).toBeVisible();
    await expect(page.locator('#active-ticket-badge')).toContainText('VIP Collector Pass');

    // 6. Navigate Gallery Walls
    const wallTabs = page.locator('button[id^="wall-tab-"]');
    await expect(wallTabs.first()).toBeVisible({ timeout: 15000 });
    const wallCount = await wallTabs.count();
    expect(wallCount).toBeGreaterThan(0);

    if (wallCount > 1) {
      await wallTabs.nth(1).click();
      await expect(wallTabs.nth(1)).toHaveClass(/bg-primary/);
      await wallTabs.first().click();
      await expect(wallTabs.first()).toHaveClass(/bg-primary/);
    }

    // 7. Inspect artwork frame & open Curator Spotlight
    const firstFrame = page.locator('[id^="exhibit-frame-"]').first();
    await expect(firstFrame).toBeVisible({ timeout: 15000 });

    // Click on exhibit frame
    await firstFrame.click();

    // Verify Spotlight modal
    const spotlightModal = page.locator('#artwork-spotlight-modal');
    await expect(spotlightModal).toBeVisible({ timeout: 15000 });
    await expect(spotlightModal).toContainText('Curator Spotlight Exhibit');
    await expect(spotlightModal.locator('h3')).toBeVisible();
    await expect(spotlightModal.locator('text=Medium')).toBeVisible();

    // Close Spotlight modal
    await spotlightModal.locator('button:has(svg.lucide-x)').click();
    await expect(spotlightModal).not.toBeVisible();
  });
});
