import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.3: Artist & Marketplace Fixed-Price Checkout
 * - Artist storefront & listing management
 * - Public browsing and artwork details page
 * - Atomic purchase deduction and seller payout
 * - Race condition single-item double purchase prevention
 */
test.describe('Acceptance Criteria 3.3: Artist & Marketplace', () => {
  test('artist lists artwork and buyer completes atomic purchase', async ({ page }) => {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const artistEmail = `artist_${uniqueId}@nakshi.test`;
    const buyerEmail = `buyer_${uniqueId}@nakshi.test`;
    const artworkTitle = `Masterpiece Jamdani ${uniqueId}`;

    // 1. Register Artist
    await page.goto('/register');
    await page.locator('#role-btn-artist').click();
    await page.locator('#name').fill(`Artisan ${uniqueId}`);
    await page.locator('#email').fill(artistEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#bio').fill('Heritage master weaver from Sonargaon.');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/artist/);

    // 2. Artist creates artwork for 250 Credits
    await page.locator('#add-artwork-btn').click();
    await expect(page.locator('#create-artwork-modal')).toBeVisible();

    await page.locator('#artwork-title-input').fill(artworkTitle);
    await page.locator('#artwork-medium-select').selectOption('Handloom Jamdani');
    await page.locator('#artwork-price-input').fill('250');
    await page.locator('#artwork-description-input').fill('Authentic Jamdani weave featuring traditional terracotta geometric motifs.');
    await page.locator('#artwork-dimensions-input').fill('200 x 100 cm');
    await page.locator('#toggle-url-input-btn').click();
    await page.locator('#artwork-image-url-input').fill('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800');
    await page.locator('#create-artwork-submit-btn').click();

    await expect(page.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 15000 });

    // 3. Verify created artwork card on artist dashboard
    await expect(page.locator('#artworks-grid')).toContainText(artworkTitle);

    // 4. Logout artist
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-logout-btn').click();
    } else {
      await page.locator('#navbar-logout-btn').click();
    }
    await expect(page).toHaveURL(/\/login/);

    // 5. Register Buyer
    await page.goto('/register');
    await page.locator('#role-btn-buyer').click();
    await page.locator('#name').fill(`Buyer ${uniqueId}`);
    await page.locator('#email').fill(buyerEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Initial balance is 0.00
    await expect(page.locator('#dashboard-wallet-balance')).toContainText('0.00');

    // 6. Navigate to Gallery to find the artwork
    await page.goto('/gallery');
    await expect(page.locator('#artwork-search-input')).toBeVisible();
    await page.locator('#artwork-search-input').fill(artworkTitle);

    const galleryCard = page.locator('#search-artworks-grid article').filter({ hasText: artworkTitle });
    await expect(galleryCard).toBeVisible({ timeout: 10000 });

    // Click Details to navigate to product details page
    await galleryCard.locator('button:has-text("Details")').click();
    await expect(page).toHaveURL(/\/artworks\//);

    // Verify detail page elements
    await expect(page.locator('#artwork-title')).toContainText(artworkTitle);
    await expect(page.locator('#artwork-availability-badge')).toContainText('AVAILABLE');

    // 7. Click Purchase - opens modal
    await page.locator('#buy-artwork-btn').click();
    const purchaseModal = page.locator('#purchase-confirmation-modal');
    await expect(purchaseModal).toBeVisible();

    // Buyer has 0 credits, so modal displays insufficient balance warning
    await expect(page.locator('#insufficient-balance-notice')).toBeVisible();
    await expect(page.locator('#confirm-purchase-btn')).toBeDisabled();

    // 8. Click Top Up Now button inside purchase modal
    await page.locator('#purchase-topup-btn').click();
    await expect(purchaseModal).not.toBeVisible();

    // Top-Up modal appears
    const topUpModal = page.locator('#topup-credits-modal');
    await expect(topUpModal).toBeVisible();

    // Select 500 Credits and submit top-up
    await page.locator('#preset-package-500-btn').click();
    await page.locator('#topup-submit-btn').click();
    await expect(page.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(topUpModal).not.toBeVisible({ timeout: 15000 });

    // 9. Re-open Purchase modal now with sufficient credits
    await page.locator('#buy-artwork-btn').click();
    await expect(purchaseModal).toBeVisible();

    // Verify credit calculation: Current 500, Cost 250, Remaining 250
    await expect(page.locator('#purchase-current-balance')).toContainText('500.00');
    await expect(page.locator('#purchase-cost-amount')).toContainText('250.00');
    await expect(page.locator('#purchase-remaining-balance')).toContainText('250.00');
    await expect(page.locator('#confirm-purchase-btn')).toBeEnabled();

    // 10. Confirm Purchase
    await page.locator('#confirm-purchase-btn').click();

    // Verify Success Banner and order details
    await expect(page.locator('#purchase-success-banner')).toBeVisible({ timeout: 15000 });
    await page.locator('#purchase-done-btn').click();
    await expect(purchaseModal).not.toBeVisible();

    // Artwork availability on page updates to SOLD
    await expect(page.locator('#artwork-availability-badge')).toContainText('SOLD');
    await expect(page.locator('#buy-artwork-btn')).toBeDisabled();
    await expect(page.locator('#buy-artwork-btn')).toContainText(/Artwork is SOLD/i);
  });

  test('prevents two buyers from purchasing the same single-edition artwork concurrently', async ({ browser }) => {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const artworkTitle = `Exclusive Jamdani Saree ${uniqueId}`;

    // Context 1: Artist creates artwork
    const artistContext = await browser.newContext();
    const artistPage = await artistContext.newPage();

    await artistPage.goto('/register');
    await artistPage.locator('#role-btn-artist').click();
    await artistPage.locator('#name').fill(`Artist Concurrent ${uniqueId}`);
    await artistPage.locator('#email').fill(`artist_conc_${uniqueId}@nakshi.test`);
    await artistPage.locator('#password').fill('Password123!');
    await artistPage.locator('#register-submit-btn').click();
    await expect(artistPage).toHaveURL(/\/dashboard\/artist/);

    await artistPage.locator('#add-artwork-btn').click();
    await artistPage.locator('#artwork-title-input').fill(artworkTitle);
    await artistPage.locator('#artwork-medium-select').selectOption('Handloom Jamdani');
    await artistPage.locator('#artwork-price-input').fill('200');
    await artistPage.locator('#artwork-description-input').fill('Single edition piece for race testing.');
    await artistPage.locator('#toggle-url-input-btn').click();
    await artistPage.locator('#artwork-image-url-input').fill('https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800');
    await artistPage.locator('#create-artwork-submit-btn').click();
    await expect(artistPage.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 15000 });

    // Confirm creation on artist dashboard
    await expect(artistPage.locator('#artworks-grid')).toContainText(artworkTitle);

    // Context 2: Buyer A registers, tops up 500 credits
    const buyerAContext = await browser.newContext();
    const buyerAPage = await buyerAContext.newPage();
    await buyerAPage.goto('/register');
    await buyerAPage.locator('#role-btn-buyer').click();
    await buyerAPage.locator('#name').fill(`Buyer Alpha ${uniqueId}`);
    await buyerAPage.locator('#email').fill(`buyer_alpha_${uniqueId}@nakshi.test`);
    await buyerAPage.locator('#password').fill('Password123!');
    await buyerAPage.locator('#register-submit-btn').click();
    await expect(buyerAPage).toHaveURL(/\/dashboard/);

    const isMobileA = (buyerAPage.viewportSize()?.width ?? 1280) < 768;
    if (isMobileA) {
      await buyerAPage.locator('#mobile-wallet-balance').click();
    } else {
      await buyerAPage.locator('#navbar-wallet-balance').click();
    }
    await buyerAPage.locator('#preset-package-500-btn').click();
    await buyerAPage.locator('#topup-submit-btn').click();
    await expect(buyerAPage.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(buyerAPage.locator('#topup-credits-modal')).not.toBeVisible({ timeout: 15000 });

    // Context 3: Buyer B registers, tops up 500 credits
    const buyerBContext = await browser.newContext();
    const buyerBPage = await buyerBContext.newPage();
    await buyerBPage.goto('/register');
    await buyerBPage.locator('#role-btn-buyer').click();
    await buyerBPage.locator('#name').fill(`Buyer Beta ${uniqueId}`);
    await buyerBPage.locator('#email').fill(`buyer_beta_${uniqueId}@nakshi.test`);
    await buyerBPage.locator('#password').fill('Password123!');
    await buyerBPage.locator('#register-submit-btn').click();
    await expect(buyerBPage).toHaveURL(/\/dashboard/);

    const isMobileB = (buyerBPage.viewportSize()?.width ?? 1280) < 768;
    if (isMobileB) {
      await buyerBPage.locator('#mobile-wallet-balance').click();
    } else {
      await buyerBPage.locator('#navbar-wallet-balance').click();
    }
    await buyerBPage.locator('#preset-package-500-btn').click();
    await buyerBPage.locator('#topup-submit-btn').click();
    await expect(buyerBPage.locator('#topup-success-banner')).toBeVisible({ timeout: 10000 });
    await expect(buyerBPage.locator('#topup-credits-modal')).not.toBeVisible({ timeout: 15000 });

    // Both buyers find the artwork in Gallery
    await buyerAPage.goto('/gallery');
    await buyerAPage.locator('#artwork-search-input').fill(artworkTitle);
    const cardA = buyerAPage.locator('#search-artworks-grid article').filter({ hasText: artworkTitle });
    await expect(cardA).toBeVisible({ timeout: 10000 });
    await cardA.locator('button:has-text("Details")').click();
    await expect(buyerAPage).toHaveURL(/\/artworks\//);

    await buyerBPage.goto('/gallery');
    await buyerBPage.locator('#artwork-search-input').fill(artworkTitle);
    const cardB = buyerBPage.locator('#search-artworks-grid article').filter({ hasText: artworkTitle });
    await expect(cardB).toBeVisible({ timeout: 10000 });
    await cardB.locator('button:has-text("Details")').click();
    await expect(buyerBPage).toHaveURL(/\/artworks\//);

    // Wait for buy button
    await expect(buyerAPage.locator('#buy-artwork-btn')).toBeVisible({ timeout: 10000 });
    await expect(buyerBPage.locator('#buy-artwork-btn')).toBeVisible({ timeout: 10000 });

    // Both open purchase modal
    await buyerAPage.locator('#buy-artwork-btn').click();
    await expect(buyerAPage.locator('#purchase-confirmation-modal')).toBeVisible();

    await buyerBPage.locator('#buy-artwork-btn').click();
    await expect(buyerBPage.locator('#purchase-confirmation-modal')).toBeVisible();

    // Concurrent click on Confirm Purchase
    await Promise.all([
      buyerAPage.locator('#confirm-purchase-btn').click(),
      buyerBPage.locator('#confirm-purchase-btn').click(),
    ]);

    // Wait for responses to settle
    await buyerAPage.waitForTimeout(2000);
    await buyerBPage.waitForTimeout(2000);

    const aHasSuccess = await buyerAPage.locator('#purchase-success-banner').isVisible();
    const bHasSuccess = await buyerBPage.locator('#purchase-success-banner').isVisible();

    // Exactly one must succeed, the other must see error banner
    expect(aHasSuccess !== bHasSuccess).toBe(true);

    if (aHasSuccess) {
      await expect(buyerBPage.locator('#purchase-error-banner')).toBeVisible();
    } else {
      await expect(buyerAPage.locator('#purchase-error-banner')).toBeVisible();
    }

    // Cleanup contexts
    await artistContext.close();
    await buyerAContext.close();
    await buyerBContext.close();
  });
});
