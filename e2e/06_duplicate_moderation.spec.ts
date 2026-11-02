import { test, expect } from '@playwright/test';

/**
 * Acceptance Criteria 3.7: Duplicate Artwork Detection & Moderation
 * - Upload triggers perceptual hashing (dHash)
 * - Similarity > 80% marks artwork FLAGGED (hidden from marketplace)
 * - Admin reviews split-screen comparison and approves/rejects
 */
test.describe('Acceptance Criteria 3.7: Duplicate Detection & Moderation', () => {
  test.describe.configure({ mode: 'serial' });

  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const artist1Email = `artist1_mod_${uniqueId}@nakshi.test`;
  const artist2Email = `artist2_mod_${uniqueId}@nakshi.test`;
  const originalTitle = `Authentic Heritage Nakshi Kantha ${uniqueId}`;
  const duplicateTitle = `Copycat Duplicate Listing ${uniqueId}`;
  const sharedImageUrl = `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&dup=${uniqueId}`;

  test('flags duplicate artwork upload exceeding 80% threshold and routes to admin review queue', async ({ page }) => {
    // 1. Register Artist 1
    await page.goto('/register');
    await page.locator('#role-btn-artist').click();
    await page.locator('#name').fill(`Master Weaver ${uniqueId}`);
    await page.locator('#email').fill(artist1Email);
    await page.locator('#password').fill('Password123!');
    await page.locator('#bio').fill('Original folk artisan preserving Bengal embroidery heritage.');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/artist/, { timeout: 15000 });

    // 2. Artist 1 creates Original Artwork
    await page.locator('#add-artwork-btn').click();
    await expect(page.locator('#create-artwork-modal')).toBeVisible();

    await page.locator('#artwork-title-input').fill(originalTitle);
    await page.locator('#artwork-medium-select').selectOption('Nakshi Kantha');
    await page.locator('#artwork-price-input').fill('500');
    await page.locator('#artwork-description-input').fill(
      'Authentic handcrafted Bengal heirloom quilt with natural botanical dye embroidery.'
    );
    await page.locator('#artwork-dimensions-input').fill('60 x 40 cm');
    await page.locator('#toggle-url-input-btn').click();
    await page.locator('#artwork-image-url-input').fill(sharedImageUrl);
    await page.locator('#create-artwork-submit-btn').click();

    await expect(page.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('#artworks-grid')).toContainText(originalTitle);

    // 3. Logout Artist 1
    const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
    if (isMobile) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-logout-btn').click();
    } else {
      await page.locator('#navbar-logout-btn').click();
    }
    await expect(page).toHaveURL(/\/login/);

    // 4. Register Artist 2
    await page.goto('/register');
    await page.locator('#role-btn-artist').click();
    await page.locator('#name').fill(`Second Artisan ${uniqueId}`);
    await page.locator('#email').fill(artist2Email);
    await page.locator('#password').fill('Password123!');
    await page.locator('#bio').fill('Secondary artisan account.');
    await page.locator('#register-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard\/artist/, { timeout: 15000 });


    // 5. Artist 2 creates Duplicate Artwork with identical photography
    await page.locator('#add-artwork-btn').click();
    await expect(page.locator('#create-artwork-modal')).toBeVisible();

    await page.locator('#artwork-title-input').fill(duplicateTitle);
    await page.locator('#artwork-medium-select').selectOption('Nakshi Kantha');
    await page.locator('#artwork-price-input').fill('420');
    await page.locator('#artwork-description-input').fill(
      'Suspected duplicate listing using the exact same photography as the original piece.'
    );
    await page.locator('#artwork-dimensions-input').fill('60 x 40 cm');
    await page.locator('#toggle-url-input-btn').click();
    await page.locator('#artwork-image-url-input').fill(sharedImageUrl);
    await page.locator('#create-artwork-submit-btn').click();

    await expect(page.locator('#create-artwork-modal')).not.toBeVisible({ timeout: 15000 });

    // 6. Verify duplicate listing shows FLAGGED status on artist 2 dashboard
    await expect(page.locator('#artworks-grid')).toContainText(duplicateTitle);
    await expect(page.locator('#artworks-grid')).toContainText('Flagged');

    // 7. Verify public gallery EXCLUDES the flagged duplicate artwork
    await page.goto('/gallery');
    await expect(page.locator('#artwork-search-input')).toBeVisible();
    await page.locator('#artwork-search-input').fill(uniqueId);

    // Original artwork must be present in public search
    await expect(page.locator('#search-artworks-grid')).toContainText(originalTitle);
    // Flagged duplicate artwork must NOT be present in public search
    await expect(page.locator('#search-artworks-grid')).not.toContainText(duplicateTitle);

    // 8. Logout Artist 2
    if (isMobile) {
      await page.locator('#mobile-menu-toggle').click();
      await page.locator('#mobile-logout-btn').click();
    } else {
      await page.locator('#navbar-logout-btn').click();
    }
    await expect(page).toHaveURL(/\/login/);

    // 9. Admin logs in to review moderation queue
    await page.goto('/login');
    await page.locator('#email').fill('admin@nakshi.test');
    await page.locator('#password').fill('Password123!');
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 10. Verify Admin Moderation Queue displays side-by-side comparative inspection
    await expect(page.locator('#admin-moderation-queue')).toBeVisible();
    await expect(page.locator('#moderation-queue-list')).toContainText(duplicateTitle);
    await expect(page.locator('#moderation-queue-list')).toContainText(originalTitle);
    await expect(page.locator('#moderation-queue-list')).toContainText('Visual Match');
  });

  test('allows admin to inspect, approve flagged artwork, and verify audit history', async ({ page }) => {
    // 1. Log in as Admin if needed
    await page.goto('/login');
    await page.locator('#email').fill('admin@nakshi.test');
    await page.locator('#password').fill('Password123!');
    await page.locator('#login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to dedicated /admin/moderation console via dashboard link
    const consoleLink = page.locator('#admin-moderation-console-link');
    await expect(consoleLink).toBeVisible();
    await consoleLink.click();
    await expect(page).toHaveURL(/\/admin\/moderation/);
    await expect(page.locator('#admin-moderation-queue')).toBeVisible();

    // 3. Search for the duplicate artwork in the queue
    await page.locator('#moderation-search-input').fill(duplicateTitle);

    // 4. Locate the flagged artwork card in the moderation queue
    const card = page.locator('#moderation-queue-list > div').filter({ hasText: duplicateTitle });
    await expect(card).toBeVisible({ timeout: 10000 });

    // 5. Open Fullscreen Comparison Modal
    const inspectBtn = card.locator('button:has-text("Compare Fullscreen")');
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // 6. Verify Fullscreen Comparison Modal is open with side-by-side specs
    await expect(page.locator('#comparison-inspection-modal')).toBeVisible();
    await expect(page.locator('#comparison-inspection-modal')).toContainText('High-Resolution Comparative Inspection');
    await expect(page.locator('#comparison-inspection-modal')).toContainText('Flagged Upload (New)');
    await expect(page.locator('#comparison-inspection-modal')).toContainText('Suspected Match (Archive)');

    // 7. Close Comparison Modal
    await page.locator('#close-inspection-modal-btn').click();
    await expect(page.locator('#comparison-inspection-modal')).not.toBeVisible();

    // 8. Select quick preset note
    const presetBtn = card.locator('button:has-text("Authentic folk craft variation")');
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
    }

    // 9. Admin clicks Approve button
    const approveBtn = card.locator('button:has-text("Approve & Publish")');
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // 10. Verify toast notification and card removal from pending queue
    await expect(page.locator('#moderation-success-toast')).toBeVisible();
    await expect(page.locator('#moderation-queue-list')).not.toContainText(duplicateTitle);

    // 11. Switch to Audit History Tab and verify reviewed item is logged
    await page.locator('#tab-audit-history').click();
    await expect(page.locator('#audit-history-section')).toBeVisible();
    await expect(page.locator('#audit-history-section')).toContainText(duplicateTitle);
    await expect(page.locator('#audit-history-section')).toContainText('APPROVED');

    // 12. Navigate to public gallery and verify approved artwork is now visible
    await page.goto('/gallery');
    await expect(page.locator('#artwork-search-input')).toBeVisible();
    await page.locator('#artwork-search-input').fill(duplicateTitle);

    await expect(page.locator('#search-artworks-grid')).toContainText(duplicateTitle);
    await expect(page.locator('#search-artworks-grid')).toContainText('420.00 Credits');
  });
});

