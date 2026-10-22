import { test, expect, Page } from '@playwright/test';

/**
 * Acceptance Criteria 3.5: Admin-Managed Live Auctions & Real-Time Bidding
 * - Only Admin can create and configure auctions (RBAC)
 * - Public Auctions browse page at /auctions
 * - Real-time WebSocket bids and synchronized countdown
 * - Instant outbid notifications across multi-user sessions
 * - Server-side validation rejecting bids below minimum increment
 */
test.describe('Acceptance Criteria 3.5: Auctions', () => {
  test.describe.configure({ mode: 'serial' });

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const artistEmail = `artist_auc_${uniqueId}@nakshi.test`;
  const buyer1Email = `buyer1_auc_${uniqueId}@nakshi.test`;
  const buyer2Email = `buyer2_auc_${uniqueId}@nakshi.test`;
  const artworkTitle = `Masterpiece Tapestry ${uniqueId}`;
  let sharedAuctionId = '';

  const isMobileView = (page: Page) => (page.viewportSize()?.width ?? 1280) < 768;

  const performLogout = async (page: Page) => {
    if (isMobileView(page)) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-logout-btn').click();
    } else {
      await page.locator('#navbar-logout-btn').click();
    }
    await expect(page).toHaveURL(/\/login/);
  };

  const topUpCredits = async (page: Page) => {
    if (isMobileView(page)) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-topup-btn').click();
    } else {
      await page.locator('#navbar-wallet-balance').click();
    }
    const modal = page.locator('#topup-credits-modal');
    await expect(modal).toBeVisible({ timeout: 10000 });
    await page.locator('#preset-package-500-btn').click();
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(modal).not.toBeVisible({ timeout: 8000 });
  };

  test('admin creates auction and multiple buyers participate in real time', async ({ page, browser }) => {
    test.setTimeout(90000);

    // -------------------------------------------------------------
    // Step 1: Artist registers and lists an approved artwork
    // -------------------------------------------------------------
    await page.goto('/register');
    await page.locator('#role-btn-artist').click();
    await page.locator('#name').fill(`Artisan ${uniqueId}`);
    await page.locator('#email').fill(artistEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#bio').fill('Heritage master craftsperson.');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/artist/);

    await page.locator('#add-artwork-btn').click();
    await expect(page.locator('#create-artwork-modal')).toBeVisible();
    await page.locator('#artwork-title-input').fill(artworkTitle);
    await page.locator('#artwork-medium-select').selectOption('Nakshi Kantha');
    await page.locator('#artwork-price-input').fill('100');
    await page.locator('#artwork-description-input').fill('Authentic hand-embroidered Bengali heritage tapestry.');
    await page.locator('#artwork-dimensions-input').fill('150 x 100 cm');
    await page.locator('#create-artwork-submit-btn').click();
    await expect(page.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#artworks-grid')).toContainText(artworkTitle);

    // Verify artists do NOT have auction creation capability in their dashboard
    await expect(page.locator('#create-auction-btn')).not.toBeVisible();

    // Logout artist
    await performLogout(page);

    // -------------------------------------------------------------
    // Step 2: Admin schedules auction using Admin Auction Scheduler
    // -------------------------------------------------------------
    await page.locator('#email').fill('admin@nakshi.test');
    await page.locator('#password').fill('Password123!');
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Click Admin Schedule Live Auction trigger
    await page.locator('#admin-open-create-auction-btn').click();
    await expect(page.locator('#admin-create-auction-modal')).toBeVisible();

    // Select the artwork in the dropdown by locating the option with artworkTitle
    const select = page.locator('#admin-auction-artwork-select');
    await expect(select).toBeVisible();
    const option = select.locator(`option:has-text("${artworkTitle}")`);
    await expect(option).toBeAttached({ timeout: 10000 });
    const optionValue = await option.getAttribute('value');
    await select.selectOption(optionValue!);

    // Set starting bid 100 and min increment 50
    await page.locator('#admin-auction-starting-bid').fill('100');
    await page.locator('#admin-auction-min-increment').fill('50');

    // Submit form
    await page.locator('#admin-create-auction-submit-btn').click();
    await expect(page.locator('#admin-create-auction-modal')).not.toBeVisible({ timeout: 15000 });

    // -------------------------------------------------------------
    // Step 3: Verify Public Auctions Browse Page (/auctions)
    // -------------------------------------------------------------
    if (isMobileView(page)) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-navbar-auctions-link').click();
    } else {
      await page.locator('#navbar-auctions-link').click();
    }
    await expect(page).toHaveURL(/\/auctions/);
    await expect(page.locator('#auctions-filter-all')).toBeVisible();

    // Locate the newly created auction card
    const auctionCard = page.locator('[id^="auction-card-"]').filter({ hasText: artworkTitle });
    await expect(auctionCard).toBeVisible({ timeout: 10000 });
    await expect(auctionCard).toContainText('100.00 Credits');

    // Extract the auction ID from the enter bidding room button
    const enterBtn = auctionCard.locator('[id^="enter-bidding-room-"]');
    await expect(enterBtn).toBeVisible();
    const href = await enterBtn.getAttribute('href');
    expect(href).toMatch(/\/auctions\/.+/);
    sharedAuctionId = href!.split('/').pop()!;
    expect(sharedAuctionId).toBeTruthy();

    // Logout admin
    await performLogout(page);

    // -------------------------------------------------------------
    // Step 4: Multi-User Synchronous Bidding via WebSocket
    // -------------------------------------------------------------
    // Buyer 1 session on page
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(`Buyer One ${uniqueId}`);
    await page.locator('#email').fill(buyer1Email);
    await page.locator('#password').fill('Password123!');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });
    await topUpCredits(page);

    // Buyer 1 enters bidding room
    await page.goto(`/auctions/${sharedAuctionId}`);
    await expect(page.locator('#live-auction-container')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#auction-current-bid')).toContainText('100');

    // Buyer 2 session (concurrent browser context)
    const buyer2Context = await browser.newContext();
    const buyer2Page = await buyer2Context.newPage();

    await buyer2Page.goto('/register');
    await buyer2Page.locator('#role-btn-buyer').click();
    await buyer2Page.locator('#name').fill(`Buyer Two ${uniqueId}`);
    await buyer2Page.locator('#email').fill(buyer2Email);
    await buyer2Page.locator('#password').fill('Password123!');
    await buyer2Page.locator('#register-submit-btn').click();
    await expect(buyer2Page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });
    await topUpCredits(buyer2Page);

    // Buyer 2 enters same bidding room
    await buyer2Page.goto(`/auctions/${sharedAuctionId}`);
    await expect(buyer2Page.locator('#live-auction-container')).toBeVisible({ timeout: 10000 });
    await expect(buyer2Page.locator('#auction-current-bid')).toContainText('100');

    // Action 1: Buyer 1 submits starting bid of 100
    await page.locator('#bid-amount-input').fill('100');
    const [buyer1BidResponse] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/bid') && resp.status() === 201),
      page.locator('#place-bid-btn').click(),
    ]);
    expect(buyer1BidResponse.ok()).toBeTruthy();

    // Buyer 1 sees current bid update
    await expect(page.locator('#auction-current-bid')).toContainText('100');

    // Action 2: Buyer 2 instantly sees the bid update via WebSocket without refreshing!
    await expect(buyer2Page.locator('#auction-current-bid')).toContainText('100', { timeout: 10000 });
    await expect(buyer2Page.locator('#bid-amount-input')).toHaveAttribute('placeholder', /Min: 150 Credits/, { timeout: 10000 });

    // Action 3: Buyer 2 places a higher bid of 150 Credits (100 + 50 min increment)
    await buyer2Page.locator('#bid-amount-input').fill('150');
    const [buyer2BidResponse] = await Promise.all([
      buyer2Page.waitForResponse(resp => resp.url().includes('/bid') && resp.status() === 201),
      buyer2Page.locator('#place-bid-btn').click(),
    ]);
    expect(buyer2BidResponse.ok()).toBeTruthy();

    // Buyer 2 sees current bid update to 150
    await expect(buyer2Page.locator('#auction-current-bid')).toContainText('150');

    // Action 4: Buyer 1 receives INSTANT WebSocket OUTBID notification and price update!
    await expect(page.locator('#auction-current-bid')).toContainText('150', { timeout: 10000 });
    await expect(page.locator('#bid-notification-banner')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#bid-notification-banner')).toContainText('outbid');

    await buyer2Context.close();
  });

  test('rejects bid below the required minimum increment', async ({ page }) => {
    test.setTimeout(60000);
    let targetAuctionId = sharedAuctionId;
    if (!targetAuctionId) {
      await page.goto('/auctions');
      const enterBtn = page.locator('[id^="enter-bidding-room-"]').first();
      await expect(enterBtn).toBeVisible({ timeout: 10000 });
      const href = await enterBtn.getAttribute('href');
      targetAuctionId = href!.split('/').pop()!;
    }
    expect(targetAuctionId).toBeTruthy();

    // Register Buyer 3
    const buyer3Email = `buyer3_auc_${uniqueId}@nakshi.test`;
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(`Buyer Three ${uniqueId}`);
    await page.locator('#email').fill(buyer3Email);
    await page.locator('#password').fill('Password123!');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/buyer/, { timeout: 15000 });
    await topUpCredits(page);

    // Navigate to bidding room
    await page.goto(`/auctions/${targetAuctionId}`);
    await expect(page.locator('#live-auction-container')).toBeVisible({ timeout: 10000 });

    // Current highest bid is 150 and minIncrement is 50, so minimum next bid is 200.
    // Buyer 3 enters 160 (which violates minimum increment)
    await page.locator('#bid-amount-input').fill('160');
    await page.locator('#place-bid-btn').click();

    // Server-side validation rejects bid and displays error
    const errorBanner = page.locator('#bid-error-message');
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
    await expect(errorBanner).toContainText(/Bid must be at least/i);
  });
});
